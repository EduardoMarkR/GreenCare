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

export async function saveMedicalRecord(formData: FormData) {
  const doctor = await getAuthenticatedDoctor();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const complaint = String(formData.get("complaint") ?? "").trim();
  const conduct = String(formData.get("conduct") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const prescription = String(formData.get("prescription") ?? "").trim();

  if (!appointmentId) {
    redirect("/medico/consultas?erro=Consulta não informada.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
    include: {
      patient: true,
    },
  });

  if (!appointment) {
    redirect(
      "/medico/consultas?erro=Consulta não encontrada ou não pertence a este médico."
    );
  }

  if (appointment.status === "CANCELLED") {
    redirect(
      `/medico/prontuario/${appointmentId}?erro=Não é possível editar prontuário de consulta cancelada.`
    );
  }

  await prisma.medicalRecord.upsert({
    where: {
      appointmentId: appointment.id,
    },
    update: {
      complaint,
      conduct,
      notes,
      prescription,
    },
    create: {
      appointmentId: appointment.id,
      doctorId: doctor.id,
      patientId: appointment.patientId,
      complaint,
      conduct,
      notes,
      prescription,
    },
  });

  revalidatePath(`/medico/prontuario/${appointment.id}`);
  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/dashboard/medico");

  redirect(`/medico/prontuario/${appointment.id}?salvo=1`);
}