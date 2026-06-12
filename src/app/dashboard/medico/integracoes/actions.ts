"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  generateFreeSlotsFromGoogleCalendar,
  getSlotKey,
} from "@/lib/google-calendar";

function getDefaultScheduleSettings() {
  return {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    workStartTime: "08:00",
    workEndTime: "18:00",
    lunchStartTime: null,
    lunchEndTime: null,
    slotDurationMinutes: 60,
    intervalMinutes: 0,
    daysToSync: 30,
  };
}

function normalizeDateToUtcMidnight(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

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
    include: {
      googleCalendarConnection: true,
      scheduleSettings: true,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  return doctor;
}

export async function syncGoogleCalendarAvailabilities() {
  const doctor = await getAuthenticatedDoctor();

  if (!doctor.googleCalendarConnection) {
    redirect(
      `/dashboard/medico/integracoes?erro=${encodeURIComponent(
        "Google Agenda não conectada."
      )}`
    );
  }

  const settings = doctor.scheduleSettings ?? getDefaultScheduleSettings();

  const startDate = normalizeDateToUtcMidnight(new Date());

  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + settings.daysToSync);

  const slots = await generateFreeSlotsFromGoogleCalendar({
    connection: doctor.googleCalendarConnection,
    startDate,
    settings,
  });

  const validSlotKeys = new Set(slots.map((slot) => getSlotKey(slot)));

  const existingFutureAvailabilities = await prisma.availability.findMany({
    where: {
      doctorId: doctor.id,
      date: {
        gte: startDate,
      },
    },
    include: {
      appointments: true,
    },
  });

  let removed = 0;

  for (const availability of existingFutureAvailabilities) {
    const key = getSlotKey({
      date: availability.date,
      startTime: availability.startTime,
      endTime: availability.endTime,
    });

    const hasAppointment = availability.appointments.length > 0;
    const belongsToCurrentSyncWindow =
      availability.date >= startDate && availability.date < endDate;
    const belongsToValidGeneratedSlots = validSlotKeys.has(key);

    const shouldRemove =
      !hasAppointment &&
      (!belongsToCurrentSyncWindow || !belongsToValidGeneratedSlots);

    if (shouldRemove) {
      await prisma.availability.delete({
        where: {
          id: availability.id,
        },
      });

      removed += 1;
    }
  }

  let created = 0;

  for (const slot of slots) {
    const existing = await prisma.availability.findFirst({
      where: {
        doctorId: doctor.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.availability.create({
      data: {
        doctorId: doctor.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });

    created += 1;
  }

  revalidatePath("/dashboard/medico/integracoes");
  revalidatePath("/medico/horarios");
  revalidatePath("/medicos");

  redirect(
    `/dashboard/medico/integracoes?created=${created}&removed=${removed}`
  );
}

export async function disconnectGoogleCalendar() {
  const doctor = await getAuthenticatedDoctor();

  if (!doctor.googleCalendarConnection) {
    redirect("/dashboard/medico/integracoes");
  }

  await prisma.googleCalendarConnection.delete({
    where: {
      doctorId: doctor.id,
    },
  });

  revalidatePath("/dashboard/medico/integracoes");
  revalidatePath("/dashboard/medico/integracoes/agenda");

  redirect("/dashboard/medico/integracoes?disconnected=1");
}