"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createAppointment(formData: FormData) {
  const availabilityId = String(formData.get("availabilityId") ?? "");
  const notes = String(formData.get("notes") ?? "");

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

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
  });

  if (!availability) {
    throw new Error("Horário não encontrado.");
  }

  const existingActiveAppointment = await prisma.appointment.findFirst({
    where: {
      availabilityId: availability.id,
      status: {
        in: ["PENDING", "CONFIRMED", "COMPLETED"],
      },
    },
  });

  if (existingActiveAppointment) {
    throw new Error("Este horário já foi agendado.");
  }

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: availability.doctorId,
      availabilityId: availability.id,
      date: availability.date,
      status: "PENDING",
      notes,
    },
  });

  redirect("/dashboard/paciente");
}