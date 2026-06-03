"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createAppointment(
  availabilityId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !email || !phone) {
    throw new Error("Nome, e-mail e telefone são obrigatórios.");
  }

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
  });

  if (!availability) {
    throw new Error("Horário não encontrado.");
  }

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
    },
    create: {
      name,
      email,
      password: "senha-temporaria",
      role: "PATIENT",
    },
  });

  const patient = await prisma.patient.upsert({
    where: {
      userId: user.id,
    },
    update: {
      phone,
    },
    create: {
      userId: user.id,
      phone,
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: availability.doctorId,
      date: availability.date,
      notes,
      status: "PENDING",
    },
  });

  redirect("/agendamento-confirmado");
}