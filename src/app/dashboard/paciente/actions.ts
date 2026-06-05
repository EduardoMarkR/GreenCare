"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function cancelPatientAppointment(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
    },
  });

  if (!appointment) {
    throw new Error("Consulta não encontrada ou não pertence a este paciente.");
  }

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    throw new Error("Esta consulta não pode mais ser cancelada.");
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  revalidatePath("/dashboard/paciente");
}