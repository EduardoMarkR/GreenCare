import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { asaasRequest } from "@/lib/payments/asaas";
import { createGoogleMeetEvent } from "@/lib/google-meet";

type PaymentStatusRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type AsaasPaymentResponse = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
};

function isAsaasPaymentPaid(status?: string | null) {
  return (
    status === "RECEIVED" ||
    status === "CONFIRMED" ||
    status === "RECEIVED_IN_CASH"
  );
}

function getAsaasPaidAt(asaasPayment: AsaasPaymentResponse) {
  if (asaasPayment.paymentDate) return new Date(asaasPayment.paymentDate);
  if (asaasPayment.clientPaymentDate) {
    return new Date(asaasPayment.clientPaymentDate);
  }
  if (asaasPayment.confirmedDate) return new Date(asaasPayment.confirmedDate);

  return new Date();
}

async function ensureGoogleMeetForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    select: {
      id: true,
      meetingUrl: true,
      googleEventId: true,
    },
  });

  if (!appointment || appointment.meetingUrl) {
    return appointment?.meetingUrl ?? null;
  }

  try {
    const meet = await createGoogleMeetEvent({
      appointmentId: appointment.id,
    });

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATED_BY_STATUS_SYNC",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Google Meet criado automaticamente após sincronização individual do pagamento aprovado.",
      },
    });

    return meet.meetingUrl;
  } catch (error) {
    console.error(
      "Erro ao criar Google Meet após sincronizar status do pagamento:",
      error
    );

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATION_FAILED_BY_STATUS_SYNC",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Falha ao criar Google Meet automaticamente após sincronização individual do pagamento aprovado.",
      },
    });

    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: PaymentStatusRouteProps
) {
  const { id } = await params;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId || activeProfile !== "PATIENT") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      patientId: patient.id,
    },
    include: {
      appointment: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let syncedPayment = payment;
  let meetingUrl = payment.appointment.meetingUrl;

  if (payment.status !== PaymentStatus.PAID && payment.gatewayPaymentId) {
    try {
      const asaasPayment = await asaasRequest<AsaasPaymentResponse>(
        `/payments/${payment.gatewayPaymentId}`
      );

      if (isAsaasPaymentPaid(asaasPayment.status)) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: PaymentStatus.PAID,
              paidAt: getAsaasPaidAt(asaasPayment),
              gatewayPaymentId: asaasPayment.id,
              externalId: asaasPayment.id,
              invoiceUrl: asaasPayment.invoiceUrl ?? payment.invoiceUrl,
              boletoUrl: asaasPayment.bankSlipUrl ?? payment.boletoUrl,
              externalUrl: asaasPayment.invoiceUrl ?? payment.externalUrl,
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
              action: "PAYMENT_APPROVED_BY_STATUS_SYNC",
              entity: "Payment",
              entityId: payment.id,
              details:
                "Pagamento sincronizado como aprovado ao consultar status no Asaas.",
            },
          });
        });

        meetingUrl = await ensureGoogleMeetForAppointment(
          payment.appointmentId
        );

        const updatedPayment = await prisma.payment.findFirst({
          where: {
            id,
            patientId: patient.id,
          },
          include: {
            appointment: true,
          },
        });

        if (updatedPayment) {
          syncedPayment = updatedPayment;
          meetingUrl = updatedPayment.appointment.meetingUrl ?? meetingUrl;
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar status do pagamento no Asaas:", error);
    }
  }

  if (
    syncedPayment.status === PaymentStatus.PAID &&
    syncedPayment.appointment.status === AppointmentStatus.CONFIRMED &&
    !meetingUrl
  ) {
    meetingUrl = await ensureGoogleMeetForAppointment(
      syncedPayment.appointmentId
    );

    const updatedPayment = await prisma.payment.findFirst({
      where: {
        id,
        patientId: patient.id,
      },
      include: {
        appointment: true,
      },
    });

    if (updatedPayment) {
      syncedPayment = updatedPayment;
      meetingUrl = updatedPayment.appointment.meetingUrl ?? meetingUrl;
    }
  }

  return NextResponse.json({
    ok: true,
    paymentStatus: syncedPayment.status,
    appointmentStatus: syncedPayment.appointment.status,
    meetingUrl,
    paidAt: syncedPayment.paidAt,
  });
}