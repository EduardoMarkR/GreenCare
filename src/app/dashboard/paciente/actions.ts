"use server";

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

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: "CANCELLED",
    },
  });

  revalidatePath("/dashboard/paciente");
  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/medico");

  redirect("/dashboard/paciente");
}