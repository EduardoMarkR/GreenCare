"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function removeFavoriteDoctor(formData: FormData) {
  const favoriteId = String(formData.get("favoriteId") ?? "");

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  if (!favoriteId) {
    redirect("/dashboard/paciente/favoritos");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const favorite = await prisma.favoriteDoctor.findFirst({
    where: {
      id: favoriteId,
      patientId: patient.id,
    },
  });

  if (favorite) {
    await prisma.favoriteDoctor.delete({
      where: {
        id: favorite.id,
      },
    });
  }

  revalidatePath("/dashboard/paciente/favoritos");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/medicos");

  redirect("/dashboard/paciente/favoritos");
}