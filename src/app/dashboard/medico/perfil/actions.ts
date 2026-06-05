"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateDoctorProfile(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "");
  const crm = String(formData.get("crm") ?? "");
  const crmUf = String(formData.get("crmUf") ?? "");
  const specialty = String(formData.get("specialty") ?? "");
  const bio = String(formData.get("bio") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const telemedicine = formData.get("telemedicine") === "on";

  if (!name || !crm || !crmUf || !specialty || !price) {
    throw new Error("Nome, CRM, UF, especialidade e valor são obrigatórios.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
    },
  });

  await prisma.doctor.update({
    where: {
      id: doctor.id,
    },
    data: {
      crm,
      crmUf,
      specialty,
      bio,
      price,
      telemedicine,
    },
  });

  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/medico/perfil");
  revalidatePath("/medicos");
}