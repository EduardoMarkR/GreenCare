"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleFavoriteDoctor(formData: FormData) {
  const doctorId = String(formData.get("doctorId") ?? "");

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect(`/medicos/${doctorId}`);
  }

  if (!doctorId) {
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

  const doctor = await prisma.doctor.findFirst({
    where: {
      id: doctorId,
      approvalStatus: "APPROVED",
    },
  });

  if (!doctor) {
    redirect("/medicos");
  }

  const existingFavorite = await prisma.favoriteDoctor.findUnique({
    where: {
      patientId_doctorId: {
        patientId: patient.id,
        doctorId: doctor.id,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favoriteDoctor.delete({
      where: {
        id: existingFavorite.id,
      },
    });
  } else {
    await prisma.favoriteDoctor.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
      },
    });
  }

  revalidatePath(`/medicos/${doctor.id}`);
  revalidatePath("/medicos");
  revalidatePath("/dashboard/paciente/favoritos");

  redirect(`/medicos/${doctor.id}`);
}