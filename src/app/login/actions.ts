"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

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
    throw new Error("E-mail ou senha inválidos.");
  }

  const isBcryptHash = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");

  const passwordIsValid = isBcryptHash
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!passwordIsValid) {
    throw new Error("E-mail ou senha inválidos.");
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

  cookieStore.set("userId", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  cookieStore.set("userRole", user.role, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  const hasPatientProfile = Boolean(user.patient);
  const hasApprovedDoctorProfile =
    Boolean(user.doctor) && user.doctor?.approvalStatus === "APPROVED";

  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (hasPatientProfile && hasApprovedDoctorProfile) {
    redirect("/selecionar-perfil");
  }

  if (hasApprovedDoctorProfile || user.role === "DOCTOR") {
    redirect("/dashboard/medico");
  }

  redirect("/dashboard/paciente");
}