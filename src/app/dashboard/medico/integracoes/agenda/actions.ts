"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function getBooleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getStringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumberValue(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));

  if (Number.isNaN(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export async function saveDoctorScheduleSettings(formData: FormData) {
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

  const workStartTime = getStringValue(formData, "workStartTime");
  const workEndTime = getStringValue(formData, "workEndTime");
  const lunchStartTime = getStringValue(formData, "lunchStartTime");
  const lunchEndTime = getStringValue(formData, "lunchEndTime");

  if (!workStartTime || !workEndTime) {
    redirect(
      "/dashboard/medico/integracoes/agenda?erro=Informe o horário inicial e final de atendimento."
    );
  }

  await prisma.doctorScheduleSettings.upsert({
    where: {
      doctorId: doctor.id,
    },
    update: {
      monday: getBooleanValue(formData, "monday"),
      tuesday: getBooleanValue(formData, "tuesday"),
      wednesday: getBooleanValue(formData, "wednesday"),
      thursday: getBooleanValue(formData, "thursday"),
      friday: getBooleanValue(formData, "friday"),
      saturday: getBooleanValue(formData, "saturday"),
      sunday: getBooleanValue(formData, "sunday"),
      workStartTime,
      workEndTime,
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
      slotDurationMinutes: getNumberValue(
        formData,
        "slotDurationMinutes",
        60
      ),
      intervalMinutes: getNumberValue(formData, "intervalMinutes", 0),
      daysToSync: getNumberValue(formData, "daysToSync", 30),
    },
    create: {
      doctorId: doctor.id,
      monday: getBooleanValue(formData, "monday"),
      tuesday: getBooleanValue(formData, "tuesday"),
      wednesday: getBooleanValue(formData, "wednesday"),
      thursday: getBooleanValue(formData, "thursday"),
      friday: getBooleanValue(formData, "friday"),
      saturday: getBooleanValue(formData, "saturday"),
      sunday: getBooleanValue(formData, "sunday"),
      workStartTime,
      workEndTime,
      lunchStartTime: lunchStartTime || null,
      lunchEndTime: lunchEndTime || null,
      slotDurationMinutes: getNumberValue(
        formData,
        "slotDurationMinutes",
        60
      ),
      intervalMinutes: getNumberValue(formData, "intervalMinutes", 0),
      daysToSync: getNumberValue(formData, "daysToSync", 30),
    },
  });

  revalidatePath("/dashboard/medico/integracoes");
  revalidatePath("/dashboard/medico/integracoes/agenda");

  redirect("/dashboard/medico/integracoes/agenda?success=1");
}