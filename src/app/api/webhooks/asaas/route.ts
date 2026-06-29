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

function getPaidAt(event: AsaasWebhookEvent) {
  if (event.payment?.paymentDate) {
    return new Date(event.payment.paymentDate);
  }

  if (event.payment?.clientPaymentDate) {
    return new Date(event.payment.clientPaymentDate);
  }

  return new Date();
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
        action: "GOOGLE_MEET_CREATED_BY_ASAAS_WEBHOOK",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Google Meet criado automaticamente após confirmação de pagamento via webhook Asaas.",
      },
    });

    return meet.meetingUrl;
  } catch (error) {
    console.error("Webhook Asaas: erro ao criar Google Meet", error);

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATION_FAILED_BY_ASAAS_WEBHOOK",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Falha ao criar Google Meet automaticamente após confirmação de pagamento via webhook Asaas.",
      },
    });

    return null;
  }
}

async function sendConfirmationEmails(params: {
  patientEmail: string;
  patientName: string;
  doctorEmail: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: string;
  meetUrl: string | null;
}) {
  const appUrl = getAppUrl();

  try {
    await sendEmail({
      to: params.patientEmail,
      subject: "Pagamento aprovado e consulta confirmada | CannaDoctor",
      html: appointmentConfirmedPatientEmail({
        patientName: params.patientName,
        doctorName: params.doctorName,
        date: formatDate(params.appointmentDate),
        time: params.appointmentTime,
        meetUrl: params.meetUrl,
        dashboardUrl: `${appUrl}/dashboard/paciente`,
      }),
    });
  } catch (error) {
    console.error("Webhook Asaas: erro ao enviar e-mail ao paciente", error);
  }

  try {
    await sendEmail({
      to: params.doctorEmail,
      subject: "Consulta confirmada após pagamento | CannaDoctor",
      html: paymentApprovedDoctorEmail({
        doctorName: params.doctorName,
        patientName: params.patientName,
        date: formatDate(params.appointmentDate),
        time: params.appointmentTime,
        meetUrl: params.meetUrl,
        dashboardUrl: `${appUrl}/dashboard/medico/consultas`,
      }),
    });
  } catch (error) {
    console.error("Webhook Asaas: erro ao enviar e-mail ao médico", error);
  }
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

  let meetUrl = payment.appointment.meetingUrl;

  if (payment.status !== PaymentStatus.PAID) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: getPaidAt(event),
          gatewayPaymentId,
          externalId: gatewayPaymentId,
          invoiceUrl: event.payment?.invoiceUrl ?? payment.invoiceUrl,
          boletoUrl: event.payment?.bankSlipUrl ?? payment.boletoUrl,
          externalUrl: event.payment?.invoiceUrl ?? payment.externalUrl,
          webhookPayload: event,
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
          action: "PAYMENT_APPROVED_BY_ASAAS_WEBHOOK",
          entity: "Payment",
          entityId: payment.id,
          details: `Pagamento aprovado via webhook Asaas. Consulta ${payment.appointmentId} confirmada.`,
        },
      });
    });
  }

  meetUrl = await ensureGoogleMeetForAppointment(payment.appointmentId);

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: payment.appointmentId,
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

  if (!appointment) {
    return;
  }

  const time = appointment.availability?.startTime ?? "Não informado";

  await sendConfirmationEmails({
    patientEmail: appointment.patient.user.email,
    patientName: appointment.patient.user.name,
    doctorEmail: appointment.doctor.user.email,
    doctorName: appointment.doctor.user.name,
    appointmentDate: appointment.date,
    appointmentTime: time,
    meetUrl,
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

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
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

    await tx.appointment.update({
      where: {
        id: payment.appointmentId,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_CANCELLED_BY_ASAAS_WEBHOOK",
        entity: "Payment",
        entityId: payment.id,
        details: "Pagamento cancelado via webhook Asaas.",
      },
    });
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