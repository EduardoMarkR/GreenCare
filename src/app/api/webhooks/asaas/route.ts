import { NextResponse } from "next/server";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/google-meet";
import { sendEmail } from "@/lib/email";
import {
  appointmentConfirmedPatientEmail,
  paymentApprovedDoctorEmail,
} from "@/lib/email-templates";
import {
  type AsaasWebhookEvent,
  isPaymentCancelledEvent,
  isPaymentConfirmedEvent,
} from "@/lib/payments";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function findPaymentByAsaasEvent(event: AsaasWebhookEvent) {
  const gatewayPaymentId = event.payment?.id;
  const externalReference = event.payment?.externalReference;

  if (!gatewayPaymentId && !externalReference) {
    return null;
  }

  return prisma.payment.findFirst({
    where: {
      OR: [
        {
          gatewayPaymentId: gatewayPaymentId ?? "",
        },
        {
          externalId: gatewayPaymentId ?? "",
        },
        {
          id: externalReference ?? "",
        },
      ],
    },
    include: {
      appointment: {
        include: {
          availability: true,
          patient: {
            include: {
              user: true,
            },
          },
          doctor: {
            include: {
              user: true,
            },
          },
        },
      },
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });
}

async function handleConfirmedPayment(event: AsaasWebhookEvent) {
  const gatewayPaymentId = event.payment?.id;

  if (!gatewayPaymentId) {
    return;
  }

  const payment = await findPaymentByAsaasEvent(event);

  if (!payment) {
    console.warn("Webhook Asaas: pagamento não encontrado", {
      gatewayPaymentId,
      externalReference: event.payment?.externalReference,
    });

    return;
  }

  if (payment.status === PaymentStatus.PAID) {
    return;
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.PAID,
      paidAt: event.payment?.paymentDate
        ? new Date(event.payment.paymentDate)
        : new Date(),
      gatewayPaymentId,
      externalId: gatewayPaymentId,
      invoiceUrl: event.payment?.invoiceUrl ?? payment.invoiceUrl,
      boletoUrl: event.payment?.bankSlipUrl ?? payment.boletoUrl,
      externalUrl: event.payment?.invoiceUrl ?? payment.externalUrl,
      webhookPayload: event,
    },
  });

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: payment.appointmentId,
    },
    data: {
      status: AppointmentStatus.CONFIRMED,
    },
    include: {
      availability: true,
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  let meetUrl = updatedAppointment.meetingUrl;

  try {
    if (!meetUrl) {
      const meet = await createGoogleMeetEvent({
        appointmentId: updatedAppointment.id,
      });

      meetUrl = meet.meetingUrl;
    }
  } catch (error) {
    console.error("Webhook Asaas: erro ao criar Google Meet", error);
  }

  const appUrl = getAppUrl();
  const time = updatedAppointment.availability?.startTime ?? "Não informado";

  try {
    await sendEmail({
      to: updatedAppointment.patient.user.email,
      subject: "Pagamento aprovado e consulta confirmada | CannaDoctor",
      html: appointmentConfirmedPatientEmail({
        patientName: updatedAppointment.patient.user.name,
        doctorName: updatedAppointment.doctor.user.name,
        date: formatDate(updatedAppointment.date),
        time,
        meetUrl,
        dashboardUrl: `${appUrl}/dashboard/paciente`,
      }),
    });
  } catch (error) {
    console.error("Webhook Asaas: erro ao enviar e-mail ao paciente", error);
  }

  try {
    await sendEmail({
      to: updatedAppointment.doctor.user.email,
      subject: "Consulta confirmada após pagamento | CannaDoctor",
      html: paymentApprovedDoctorEmail({
        doctorName: updatedAppointment.doctor.user.name,
        patientName: updatedAppointment.patient.user.name,
        date: formatDate(updatedAppointment.date),
        time,
        meetUrl,
        dashboardUrl: `${appUrl}/dashboard/medico/consultas`,
      }),
    });
  } catch (error) {
    console.error("Webhook Asaas: erro ao enviar e-mail ao médico", error);
  }

  await prisma.auditLog.create({
    data: {
      action: "PAYMENT_APPROVED_BY_ASAAS_WEBHOOK",
      entity: "Payment",
      entityId: updatedPayment.id,
      details: `Pagamento aprovado via webhook Asaas. Consulta ${updatedAppointment.id} confirmada.`,
    },
  });
}

async function handleCancelledPayment(event: AsaasWebhookEvent) {
  const gatewayPaymentId = event.payment?.id;

  if (!gatewayPaymentId) {
    return;
  }

  const payment = await findPaymentByAsaasEvent(event);

  if (!payment) {
    console.warn("Webhook Asaas: pagamento cancelado não encontrado", {
      gatewayPaymentId,
      externalReference: event.payment?.externalReference,
    });

    return;
  }

  if (payment.status === PaymentStatus.PAID) {
    return;
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.CANCELLED,
      cancelledAt: new Date(),
      gatewayPaymentId,
      externalId: gatewayPaymentId,
      webhookPayload: event,
    },
  });

  await prisma.appointment.update({
    where: {
      id: payment.appointmentId,
    },
    data: {
      status: AppointmentStatus.CANCELLED,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "PAYMENT_CANCELLED_BY_ASAAS_WEBHOOK",
      entity: "Payment",
      entityId: payment.id,
      details: "Pagamento cancelado via webhook Asaas.",
    },
  });
}

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as AsaasWebhookEvent;

    if (!event.event) {
      return NextResponse.json(
        {
          ok: false,
          message: "Evento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (isPaymentConfirmedEvent(event.event)) {
      await handleConfirmedPayment(event);
    }

    if (isPaymentCancelledEvent(event.event)) {
      await handleCancelledPayment(event);
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Erro no webhook Asaas:", error);

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook Asaas CannaDoctor ativo.",
  });
}