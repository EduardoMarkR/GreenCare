"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
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

  if (!user || user.password !== password) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const cookieStore = await cookies();

  cookieStore.set("userId", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("userRole", user.role, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
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