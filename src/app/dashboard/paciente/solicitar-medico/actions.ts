"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function solicitarCadastroMedico(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const crm = String(formData.get("crm") || "").trim();
  const crmUf = String(formData.get("crmUf") || "").trim().toUpperCase();
  const specialty = String(formData.get("specialty") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const priceRaw = String(formData.get("price") || "0").replace(",", ".");
  const telemedicine = formData.get("telemedicine") === "on";

  const price = Number(priceRaw);

  if (!crm || !crmUf || !specialty || !bio || !price || Number.isNaN(price)) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  const existingDoctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (existingDoctor) {
    redirect("/dashboard/medico/perfil");
  }

  await prisma.doctor.create({
    data: {
      userId,
      crm,
      crmUf,
      specialty,
      bio,
      price,
      telemedicine,
      approved: false,
      approvalStatus: "PENDING",
    },
  });

  redirect("/dashboard/paciente");
}