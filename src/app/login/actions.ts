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

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "DOCTOR") {
    redirect("/medico/dashboard");
  }

  redirect("/paciente/dashboard");
}