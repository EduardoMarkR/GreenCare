"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(cpf: string) {
  const cleanCpf = onlyNumbers(cpf);

  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;

  for (let index = 0; index < 9; index++) {
    sum += Number(cleanCpf[index]) * (10 - index);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== Number(cleanCpf[9])) return false;

  sum = 0;

  for (let index = 0; index < 10; index++) {
    sum += Number(cleanCpf[index]) * (11 - index);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cleanCpf[10]);
}

export async function createPatientAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const cpfCnpj = onlyNumbers(String(formData.get("cpfCnpj") ?? ""));
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !cpfCnpj || !password) {
    redirect(
      "/cadastro?erro=Preencha nome, e-mail, CPF e senha para criar sua conta."
    );
  }

  if (!isValidCpf(cpfCnpj)) {
    redirect("/cadastro?erro=Informe um CPF válido para continuar.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    redirect("/cadastro?erro=Já existe uma conta cadastrada com este e-mail.");
  }

  const existingPatientCpf = await prisma.patient.findFirst({
    where: {
      cpfCnpj,
    },
  });

  if (existingPatientCpf) {
    redirect("/cadastro?erro=Já existe uma conta cadastrada com este CPF.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "PATIENT",
      patient: {
        create: {
          cpfCnpj,
        },
      },
    },
  });

  redirect("/login?sucesso=Conta criada com sucesso. Faça login para continuar.");
}