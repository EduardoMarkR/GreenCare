"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createAvailability(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!date || !startTime || !endTime) {
    redirect(
      "/medico/horarios/novo?erro=Data, hora inicial e hora final são obrigatórias."
    );
  }

  if (startTime >= endTime) {
    redirect(
      "/medico/horarios/novo?erro=A hora inicial precisa ser menor que a hora final."
    );
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const availabilityDate = new Date(`${date}T12:00:00`);

  const conflictingAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctor.id,
      date: availabilityDate,
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    },
  });

  if (conflictingAvailability) {
    redirect(
      "/medico/horarios/novo?erro=Já existe um horário cadastrado que conflita com esse intervalo."
    );
  }

  await prisma.availability.create({
    data: {
      doctorId: doctor.id,
      date: availabilityDate,
      startTime,
      endTime,
    },
  });

  redirect("/medico/horarios");
}