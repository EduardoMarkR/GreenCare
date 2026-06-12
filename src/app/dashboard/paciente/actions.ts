"use server";

import { sendEmail } from "@/lib/email";
import { appointmentCancelledEmail } from "@/lib/email-templates";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function cancelPatientAppointment(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  if (!appointmentId) {
    redirect("/dashboard/paciente?erro=Consulta não informada.");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
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
      "/dashboard/paciente?erro=Consulta não encontrada ou não pertence a este paciente."
    );
  }

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    redirect(
      "/dashboard/paciente?erro=Esta consulta não pode mais ser cancelada."
    );
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED",
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

    const date = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
    }).format(updatedAppointment.date);

    const time = updatedAppointment.availability?.startTime ?? "";

    await sendEmail({
      to: updatedAppointment.doctor.user.email,
      subject: "Consulta cancelada pelo paciente | CannaDoctor",
      html: appointmentCancelledEmail({
        title: "Consulta cancelada pelo paciente",
        name: updatedAppointment.doctor.user.name,
        message: `${updatedAppointment.patient.user.name} cancelou a consulta agendada.`,
        date,
        time,
        dashboardUrl: `${appUrl}/medico/consultas`,
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de cancelamento para o médico:", error);
  }

  revalidatePath("/dashboard/paciente");
  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/medico");

  redirect("/dashboard/paciente");
}