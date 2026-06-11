"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteAvailability(formData: FormData) {
  const availabilityId = String(formData.get("availabilityId") ?? "");

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  if (!availabilityId) {
    redirect("/medico/horarios");
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
  });

  if (!availability) {
    redirect("/medico/horarios");
  }

  await prisma.availability.delete({
    where: {
      id: availability.id,
    },
  });

  revalidatePath("/medico/horarios");
  redirect("/medico/horarios");
}