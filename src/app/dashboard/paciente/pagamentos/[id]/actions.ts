"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments";
import { createGoogleMeetEvent } from "@/lib/google-meet";

function onlyNumbers(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

function splitExpiry(expiry: string) {
  const [month, year] = expiry.split("/");

  return {
    expiryMonth: month,
    expiryYear: year?.length === 2 ? `20${year}` : year,
  };
}

function isAsaasPaymentPaid(status?: string | null) {
  return (
    status === "RECEIVED" ||
    status === "CONFIRMED" ||
    status === "RECEIVED_IN_CASH"
  );
}

function getRequiredCardHolderData(formData: FormData) {
  const formPhone = onlyNumbers(String(formData.get("phone") ?? ""));
  const formPostalCode = onlyNumbers(String(formData.get("postalCode") ?? ""));
  const formAddressNumber = onlyNumbers(
    String(formData.get("addressNumber") ?? "")
  );

  return {
    phone: formPhone.length >= 10 ? formPhone : "11999999999",
    postalCode: formPostalCode.length === 8 ? formPostalCode : "01311000",
    addressNumber: formAddressNumber || "100",
  };
}

async function ensureGoogleMeetForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    select: {
      id: true,
      meetingUrl: true,
    },
  });

  if (!appointment || appointment.meetingUrl) {
    return;
  }

  try {
    await createGoogleMeetEvent({
      appointmentId,
    });

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATED_BY_CREDIT_CARD_PAYMENT",
        entity: "Appointment",
        entityId: appointmentId,
        details:
          "Google Meet criado automaticamente após pagamento com cartão de crédito.",
      },
    });
  } catch (error) {
    console.error("Erro ao criar Google Meet após pagamento com cartão:", error);

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATION_FAILED_BY_CREDIT_CARD_PAYMENT",
        entity: "Appointment",
        entityId: appointmentId,
        details:
          "Falha ao criar Google Meet automaticamente após pagamento com cartão de crédito.",
      },
    });
  }
}

export async function payWithCreditCard(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const holderName = String(formData.get("holderName") ?? "").trim();
  const cardNumber = onlyNumbers(String(formData.get("cardNumber") ?? ""));
  const cpfCnpj = onlyNumbers(String(formData.get("cpfCnpj") ?? ""));
  const expiry = String(formData.get("expiry") ?? "").trim();
  const ccv = onlyNumbers(String(formData.get("ccv") ?? ""));
  const installmentCount = Number(formData.get("installmentCount") ?? 1);
  const { phone, postalCode, addressNumber } =
    getRequiredCardHolderData(formData);

  if (!paymentId) {
    redirect("/dashboard/paciente/pagamentos");
  }

  if (!holderName || cardNumber.length < 13 || !cpfCnpj || !expiry || !ccv) {
    redirect(
      `/dashboard/paciente/pagamentos/${paymentId}?erro=Preencha todos os dados do cartão corretamente.`
    );
  }

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      patientId: patient.id,
    },
    include: {
      appointment: true,
    },
  });

  if (!payment) {
    redirect("/dashboard/paciente/pagamentos");
  }

  if (payment.status === PaymentStatus.PAID) {
    redirect(`/dashboard/paciente/pagamentos/${payment.id}`);
  }

  if (payment.method !== PaymentMethod.CREDIT_CARD) {
    redirect(
      `/dashboard/paciente/pagamentos/${payment.id}?erro=Este pagamento não foi criado para cartão de crédito.`
    );
  }

  if (!payment.gatewayPaymentId) {
    redirect(
      `/dashboard/paciente/pagamentos/${payment.id}?erro=A cobrança do cartão ainda não foi gerada.`
    );
  }

  const { expiryMonth, expiryYear } = splitExpiry(expiry);

  console.log("Dados recebidos do formulário do cartão:", {
    paymentId,
    holderName,
    cardNumberLength: cardNumber.length,
    cpfCnpj,
    phone,
    postalCode,
    addressNumber,
    expiryMonth,
    expiryYear,
    ccvLength: ccv.length,
    installmentCount,
  });

  try {
    const result = await paymentProvider.payWithCreditCard({
      gatewayPaymentId: payment.gatewayPaymentId,
      creditCard: {
        holderName,
        number: cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
      },
      creditCardHolderInfo: {
        name: holderName,
        email: patient.user.email,
        cpfCnpj,
        phone,
        mobilePhone: phone,
        postalCode,
        addressNumber,
      },
      installmentCount,
      totalValue: Number(payment.amount),
    });

    if (isAsaasPaymentPaid(result.status)) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            gatewayPaymentId: result.id,
            externalId: result.id,
            invoiceUrl: result.invoiceUrl ?? payment.invoiceUrl,
            externalUrl: result.invoiceUrl ?? payment.externalUrl,
          },
        });

        await tx.appointment.update({
          where: {
            id: payment.appointmentId,
          },
          data: {
            status: AppointmentStatus.CONFIRMED,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "PAYMENT_APPROVED_BY_CREDIT_CARD",
            entity: "Payment",
            entityId: payment.id,
            details:
              "Pagamento aprovado por cartão de crédito dentro do checkout CannaDoctor.",
          },
        });
      });

      await ensureGoogleMeetForAppointment(payment.appointmentId);
    } else {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.PENDING,
          gatewayPaymentId: result.id,
          externalId: result.id,
          invoiceUrl: result.invoiceUrl ?? payment.invoiceUrl,
          externalUrl: result.invoiceUrl ?? payment.externalUrl,
        },
      });
    }
  } catch (error) {
    console.error("Erro ao pagar com cartão:", error);

    redirect(
      `/dashboard/paciente/pagamentos/${payment.id}?erro=Não foi possível processar o cartão. Verifique os dados e tente novamente.`
    );
  }

  redirect(`/dashboard/paciente/pagamentos/${payment.id}`);
}