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

export async function updateAppointmentStatus(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(
    formData.get("status") ?? ""
  ) as AppointmentStatus;

  if (!appointmentId || !status) {
    throw new Error("Consulta e status são obrigatórios.");
  }

  const allowedStatuses: AppointmentStatus[] = [
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Status inválido.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    throw new Error(
      "Consulta não encontrada ou não pertence a este médico."
    );
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
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/paciente");
}

export async function saveMeetingUrl(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const appointmentId = String(
    formData.get("appointmentId") ?? ""
  );

  const meetingUrl = String(
    formData.get("meetingUrl") ?? ""
  ).trim();

  if (!appointmentId) {
    throw new Error("Consulta não informada.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    throw new Error(
      "Consulta não encontrada ou não pertence a este médico."
    );
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      meetingUrl: meetingUrl || null,
    },
  });

  revalidatePath("/medico/consultas");
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/paciente");
}