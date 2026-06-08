"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createPatientAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !password) {
    throw new Error("Preencha nome, e-mail e senha.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: "PATIENT",
      patient: {
        create: {},
      },
    },
  });

  redirect("/login");
}