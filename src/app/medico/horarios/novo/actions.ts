"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createAvailability(formData: FormData) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!date || !startTime || !endTime) {
    throw new Error("Data, hora inicial e hora final são obrigatórias.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado para o usuário logado.");
  }

  await prisma.availability.create({
    data: {
      doctorId: doctor.id,
      date: new Date(`${date}T12:00:00`),
      startTime,
      endTime,
    },
  });

  redirect("/medico/horarios");
}