"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function updateDoctorProfile(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const crm = String(formData.get("crm") ?? "").trim();
  const crmUf = String(formData.get("crmUf") ?? "").trim().toUpperCase();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const priceValue = String(formData.get("price") ?? "").replace(",", ".");
  const price = new Prisma.Decimal(priceValue || 0);
  const telemedicine = formData.get("telemedicine") === "on";

  if (!name || !crm || !crmUf || !specialty || price.lte(0)) {
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

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
      },
    }),

    prisma.doctor.update({
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
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/medicos");
  revalidatePath(`/medicos/${doctor.id}`);
  revalidatePath("/dashboard/medico");
  revalidatePath("/dashboard/medico/perfil");

  redirect("/dashboard/medico/perfil?success=perfil-atualizado");
}