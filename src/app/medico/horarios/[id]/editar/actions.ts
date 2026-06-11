"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updateAvailability(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const availabilityId = String(formData.get("availabilityId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!availabilityId || !date || !startTime || !endTime) {
    redirect(
      `/medico/horarios/${availabilityId}/editar?erro=Todos os campos são obrigatórios.`
    );
  }

  if (startTime >= endTime) {
    redirect(
      `/medico/horarios/${availabilityId}/editar?erro=A hora inicial precisa ser menor que a hora final.`
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

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId: doctor.id,
    },
    include: {
      appointments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      },
    },
  });

  if (!availability) {
    redirect("/medico/horarios");
  }

  if (availability.appointments.length > 0) {
    redirect(
      `/medico/horarios/${availability.id}/editar?erro=Não é possível editar um horário que já possui consulta pendente ou confirmada.`
    );
  }

  const availabilityDate = new Date(`${date}T12:00:00`);

  const conflictingAvailability = await prisma.availability.findFirst({
    where: {
      id: {
        not: availability.id,
      },
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
      `/medico/horarios/${availability.id}/editar?erro=Já existe outro horário cadastrado que conflita com esse intervalo.`
    );
  }

  await prisma.availability.update({
    where: {
      id: availability.id,
    },
    data: {
      date: availabilityDate,
      startTime,
      endTime,
    },
  });

  redirect("/medico/horarios");
}