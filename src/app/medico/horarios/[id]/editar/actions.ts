"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updateAvailability(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const availabilityId = String(formData.get("availabilityId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!availabilityId || !date || !startTime || !endTime) {
    throw new Error("Todos os campos são obrigatórios.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId: doctor.id,
    },
  });

  if (!availability) {
    throw new Error(
      "Horário não encontrado ou não pertence a este médico."
    );
  }

  await prisma.availability.update({
    where: {
      id: availability.id,
    },
    data: {
      date: new Date(`${date}T12:00:00`),
      startTime,
      endTime,
    },
  });

  redirect("/medico/horarios");
}