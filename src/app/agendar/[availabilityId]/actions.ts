"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PaymentGateway,
  PaymentMethod,
  Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments";

function calculatePaymentAmounts(
  price: Prisma.Decimal,
  platformFeePercent: Prisma.Decimal
) {
  const amount = new Prisma.Decimal(price);
  const commissionRate = new Prisma.Decimal(platformFeePercent);
  const platformFee = amount.mul(commissionRate).div(100).toDecimalPlaces(2);
  const doctorAmount = amount.sub(platformFee).toDecimalPlaces(2);

  return {
    amount,
    commissionRate,
    platformFee,
    doctorAmount,
  };
}

function formatAsaasDueDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function onlyNumbers(value?: string | null) {
  return value?.replace(/\D/g, "") || null;
}

export async function createAppointment(formData: FormData) {
  const availabilityId = String(formData.get("availabilityId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  if (!availabilityId) {
    redirect("/medicos");
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

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!availability || availability.doctor.approvalStatus !== "APPROVED") {
    redirect("/medicos");
  }

  const now = new Date();

  if (availability.date < now) {
    redirect(
      `/medicos/${availability.doctorId}?erro=Este horário já passou e não está mais disponível.`
    );
  }

  const existingAppointmentForAvailability = await prisma.appointment.findFirst({
    where: {
      availabilityId: availability.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
  });

  if (existingAppointmentForAvailability) {
    redirect(
      `/agendar/${availability.id}?erro=Este horário já foi agendado por outro paciente.`
    );
  }

  const conflictingPatientAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      date: availability.date,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      availability: {
        startTime: {
          lt: availability.endTime,
        },
        endTime: {
          gt: availability.startTime,
        },
      },
    },
  });

  if (conflictingPatientAppointment) {
    redirect(
      `/agendar/${availability.id}?erro=Você já possui uma consulta nesse mesmo dia e horário.`
    );
  }

  const paymentAmounts = calculatePaymentAmounts(
    availability.doctor.price,
    availability.doctor.platformFeePercent
  );

  const result = await prisma.$transaction(async (tx) => {
    const createdAppointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: availability.doctorId,
        availabilityId: availability.id,
        date: availability.date,
        status: "PENDING",
        notes,
      },
    });

    const createdPayment = await tx.payment.create({
      data: {
        appointmentId: createdAppointment.id,
        patientId: patient.id,
        doctorId: availability.doctorId,
        amount: paymentAmounts.amount,
        platformFee: paymentAmounts.platformFee,
        doctorAmount: paymentAmounts.doctorAmount,
        commissionRate: paymentAmounts.commissionRate,
        status: "PENDING",
        method: PaymentMethod.PIX,
        gateway: PaymentGateway.ASAAS,
      },
    });

    return {
      appointment: createdAppointment,
      payment: createdPayment,
    };
  });

  let gatewayCustomerId = patient.paymentCustomerId;

  try {
    if (!gatewayCustomerId) {
      const customer = await paymentProvider.createCustomer({
        name: patient.user.name,
        email: patient.user.email,
        phone: onlyNumbers(patient.phone),
        cpfCnpj: patient.cpfCnpj,
      });

      gatewayCustomerId = customer.id;

      await prisma.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          paymentCustomerId: gatewayCustomerId,
        },
      });
    }

    const charge = await paymentProvider.createCharge({
      customerId: gatewayCustomerId,
      value: Number(paymentAmounts.amount),
      dueDate: formatAsaasDueDate(availability.date),
      description: `Consulta com ${availability.doctor.user.name} - CannaDoctor`,
      externalReference: result.payment.id,
      method: PaymentMethod.PIX,
    });

    await prisma.payment.update({
      where: {
        id: result.payment.id,
      },
      data: {
        gateway: PaymentGateway.ASAAS,
        gatewayCustomerId,
        gatewayPaymentId: charge.id,
        invoiceUrl: charge.invoiceUrl,
        pixQrCode: charge.pixQrCode,
        pixCopyPaste: charge.pixCopyPaste,
        boletoUrl: charge.bankSlipUrl,
        externalId: charge.id,
        externalUrl: charge.invoiceUrl,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cobrança Asaas:", error);

    redirect(
      `/dashboard/paciente/pagamentos/${result.payment.id}?erro=Não foi possível gerar a cobrança automaticamente. Tente novamente em instantes.`
    );
  }

  redirect(`/dashboard/paciente/pagamentos/${result.payment.id}`);
}