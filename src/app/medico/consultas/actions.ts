"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  appointmentCancelledEmail,
  appointmentConfirmedPatientEmail,
} from "@/lib/email-templates";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

const allowedStatuses: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

async function getAuthenticatedDoctor() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  return doctor;
}

function validateMeetingUrl(url: string) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:") {
      redirect(
        "/medico/consultas?erro=O link da teleconsulta precisa começar com https://."
      );
    }

    return parsedUrl.toString();
  } catch {
    redirect("/medico/consultas?erro=Link da teleconsulta inválido.");
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export async function updateAppointmentStatus(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;

  if (!appointmentId || !status) {
    redirect("/medico/consultas?erro=Consulta e status são obrigatórios.");
  }

  if (!allowedStatuses.includes(status)) {
    redirect("/medico/consultas?erro=Status inválido.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
    include: {
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
      availability: true,
    },
  });

  if (!appointment) {
    redirect(
      "/medico/consultas?erro=Consulta não encontrada ou não pertence a este médico."
    );
  }

  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    redirect(
      "/medico/consultas?erro=Essa consulta já está encerrada e não pode ser alterada."
    );
  }

  if (appointment.status === status) {
    redirect("/medico/consultas");
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status,
    },
    include: {
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
      availability: true,
    },
  });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const date = formatDate(updatedAppointment.date);
    const time = updatedAppointment.availability?.startTime ?? "";

    if (status === "CONFIRMED") {
      await sendEmail({
        to: updatedAppointment.patient.user.email,
        subject: "Sua consulta foi confirmada | CannaDoctor",
        html: appointmentConfirmedPatientEmail({
          patientName: updatedAppointment.patient.user.name,
          doctorName: updatedAppointment.doctor.user.name,
          date,
          time,
          meetUrl: updatedAppointment.meetingUrl,
          dashboardUrl: `${appUrl}/dashboard/paciente`,
        }),
      });
    }

    if (status === "CANCELLED") {
      await sendEmail({
        to: updatedAppointment.patient.user.email,
        subject: "Sua consulta foi cancelada | CannaDoctor",
        html: appointmentCancelledEmail({
          title: "Sua consulta foi cancelada",
          name: updatedAppointment.patient.user.name,
          message:
            "Sua consulta foi cancelada pelo médico. Acesse seu painel para verificar outras opções de agendamento.",
          date,
          time,
          dashboardUrl: `${appUrl}/dashboard/paciente`,
        }),
      });
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail de atualização da consulta:", error);
  }

  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/paciente");

  redirect("/medico/consultas");
}

export async function saveMeetingUrl(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();

  if (!appointmentId) {
    redirect("/medico/consultas?erro=Consulta não informada.");
  }

  const safeMeetingUrl = validateMeetingUrl(meetingUrl);

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    redirect(
      "/medico/consultas?erro=Consulta não encontrada ou não pertence a este médico."
    );
  }

  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    redirect(
      "/medico/consultas?erro=Não é possível alterar link de consulta encerrada."
    );
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      meetingUrl: safeMeetingUrl,
    },
  });

  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/paciente");

  redirect("/medico/consultas");
}