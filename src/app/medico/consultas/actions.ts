"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

    const allowedProtocols = ["https:"];

    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      throw new Error("O link da teleconsulta precisa começar com https://.");
    }

    return parsedUrl.toString();
  } catch {
    throw new Error("Link da teleconsulta inválido.");
  }
}

export async function updateAppointmentStatus(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;

  if (!appointmentId || !status) {
    throw new Error("Consulta e status são obrigatórios.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Status inválido.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    throw new Error("Consulta não encontrada ou não pertence a este médico.");
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status,
    },
  });

  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/paciente");
}

export async function saveMeetingUrl(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");

  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();

  if (!appointmentId) {
    throw new Error("Consulta não informada.");
  }

  const safeMeetingUrl = validateMeetingUrl(meetingUrl);

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    throw new Error("Consulta não encontrada ou não pertence a este médico.");
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
}