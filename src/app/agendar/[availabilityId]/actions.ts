"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createGoogleMeetEvent } from "@/lib/google-meet";

export async function createAppointment(formData: FormData) {
  const availabilityId = String(formData.get("availabilityId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  if (!availabilityId) {
    redirect("/medicos");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
    include: {
      doctor: true,
    },
  });

  if (!availability || availability.doctor.approvalStatus !== "APPROVED") {
    redirect("/medicos");
  }

  const now = new Date();

  if (availability.date < now) {
    redirect(
      `/medicos/${availability.doctorId}?erro=Este horário já passou e não está mais disponível.`
    );
  }

  const existingAppointmentForAvailability = await prisma.appointment.findFirst({
    where: {
      availabilityId: availability.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
  });

  if (existingAppointmentForAvailability) {
    redirect(
      `/agendar/${availability.id}?erro=Este horário já foi agendado por outro paciente.`
    );
  }

  const conflictingPatientAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      date: availability.date,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      availability: {
        startTime: {
          lt: availability.endTime,
        },
        endTime: {
          gt: availability.startTime,
        },
      },
    },
  });

  if (conflictingPatientAppointment) {
    redirect(
      `/agendar/${availability.id}?erro=Você já possui uma consulta nesse mesmo dia e horário.`
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: availability.doctorId,
      availabilityId: availability.id,
      date: availability.date,
      status: "PENDING",
      notes,
    },
  });

  try {
    await createGoogleMeetEvent({
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error("Erro ao criar Google Meet:", error);
  }

  redirect("/dashboard/paciente");
}