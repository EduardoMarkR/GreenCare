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

  const isBcryptHash =
    user.password.startsWith("$2a$") || user.password.startsWith("$2b$");

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

  const cookieOptions = {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
  };

  cookieStore.set("userId", user.id, cookieOptions);
  cookieStore.set("userRole", user.role, cookieOptions);

  const hasPatientProfile = Boolean(user.patient);
  const hasApprovedDoctorProfile =
    Boolean(user.doctor) && user.doctor?.approvalStatus === "APPROVED";

  if (user.role === "ADMIN") {
    cookieStore.set("activeProfile", "ADMIN", cookieOptions);
    redirect("/dashboard/admin");
  }

  if (hasPatientProfile && hasApprovedDoctorProfile) {
    redirect("/selecionar-perfil");
  }

  if (hasApprovedDoctorProfile || user.role === "DOCTOR") {
    cookieStore.set("activeProfile", "DOCTOR", cookieOptions);
    redirect("/dashboard/medico");
  }

  cookieStore.set("activeProfile", "PATIENT", cookieOptions);
  redirect("/dashboard/paciente");
}