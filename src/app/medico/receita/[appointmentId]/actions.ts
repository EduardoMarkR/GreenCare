"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function savePrescription(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const medication = String(formData.get("medication") ?? "").trim();
  const dosage = String(formData.get("dosage") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (!appointmentId) {
    redirect("/medico/historico?erro=Consulta não informada.");
  }

  if (!medication || !dosage) {
    redirect(
      `/medico/receita/${appointmentId}?erro=Medicamento e posologia são obrigatórios.`
    );
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
  });

  if (!appointment) {
    redirect("/medico/historico?erro=Consulta não encontrada.");
  }

  if (appointment.status !== "COMPLETED") {
    redirect(
      `/medico/receita/${appointmentId}?erro=A receita só pode ser emitida para consultas concluídas.`
    );
  }

  await prisma.prescription.upsert({
    where: {
      appointmentId: appointment.id,
    },
    update: {
      medication,
      dosage,
      quantity,
      instructions,
    },
    create: {
      appointmentId: appointment.id,
      doctorId: doctor.id,
      patientId: appointment.patientId,
      medication,
      dosage,
      quantity,
      instructions,
    },
  });

  revalidatePath(`/medico/receita/${appointment.id}`);
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/dashboard/medico");

  redirect(`/medico/receita/${appointment.id}?salvo=1`);
}