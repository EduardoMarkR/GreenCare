"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createDoctorReview(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "PATIENT") redirect("/");

  if (!appointmentId) {
    redirect("/dashboard/paciente/historico?erro=Consulta não informada.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect("/dashboard/paciente/historico?erro=Escolha uma nota de 1 a 5.");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId },
  });

  if (!patient) redirect("/login");

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
      status: "COMPLETED",
    },
    include: {
      review: true,
    },
  });

  if (!appointment) {
    redirect(
      "/dashboard/paciente/historico?erro=Só é possível avaliar consultas concluídas."
    );
  }

  if (appointment.review) {
    redirect("/dashboard/paciente/historico?erro=Esta consulta já foi avaliada.");
  }

  await prisma.doctorReview.create({
    data: {
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: patient.id,
      rating,
      comment: comment || null,
    },
  });

  revalidatePath("/dashboard/paciente/historico");
  revalidatePath("/medicos");
  revalidatePath(`/medicos/${appointment.doctorId}`);
  revalidatePath("/dashboard/medico/perfil");

  redirect("/dashboard/paciente/historico?sucesso=Avaliação enviada com sucesso.");
}