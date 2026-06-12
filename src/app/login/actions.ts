"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  sameSite: "lax" as const,
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect("/login?erro=Informe seu e-mail e senha para entrar.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!user) {
    redirect("/login?erro=E-mail ou senha inválidos.");
  }

  const isBcryptHash =
    user.password.startsWith("$2a$") || user.password.startsWith("$2b$");

  const passwordIsValid = isBcryptHash
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!passwordIsValid) {
    redirect("/login?erro=E-mail ou senha inválidos.");
  }

  if (!isBcryptHash) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  const cookieStore = await cookies();

  cookieStore.set("userId", user.id, sessionCookieOptions);
  cookieStore.set("userRole", user.role, sessionCookieOptions);

  const hasPatientProfile = Boolean(user.patient);
  const hasApprovedDoctorProfile =
    Boolean(user.doctor) && user.doctor?.approvalStatus === "APPROVED";

  if (user.role === "ADMIN") {
    cookieStore.set("activeProfile", "ADMIN", sessionCookieOptions);
    redirect("/dashboard/admin");
  }

  if (hasPatientProfile && hasApprovedDoctorProfile) {
    redirect("/selecionar-perfil");
  }

  if (hasApprovedDoctorProfile || user.role === "DOCTOR") {
    cookieStore.set("activeProfile", "DOCTOR", sessionCookieOptions);
    redirect("/dashboard/medico");
  }

  cookieStore.set("activeProfile", "PATIENT", sessionCookieOptions);
  redirect("/dashboard/paciente");
}