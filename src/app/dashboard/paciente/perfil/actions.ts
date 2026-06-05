"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updatePatientProfile(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const birthDate = String(formData.get("birthDate") ?? "");

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
    },
  });

  await prisma.patient.update({
    where: {
      id: patient.id,
    },
    data: {
      phone,
      birthDate: birthDate
        ? new Date(`${birthDate}T12:00:00`)
        : null,
    },
  });

  revalidatePath("/dashboard/paciente");
  revalidatePath("/dashboard/paciente/perfil");
}