"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteAvailability(formData: FormData) {
  const availabilityId = String(formData.get("availabilityId"));

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const availability = await prisma.availability.findFirst({
    where: {
      id: availabilityId,
      doctorId: doctor.id,
    },
  });

  if (!availability) {
    throw new Error("Horário não encontrado ou não pertence a este médico.");
  }

  await prisma.availability.delete({
    where: {
      id: availability.id,
    },
  });

  revalidatePath("/medico/horarios");
}