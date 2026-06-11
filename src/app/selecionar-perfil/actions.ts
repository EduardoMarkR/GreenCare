"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ActiveProfile = "PATIENT" | "DOCTOR";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  sameSite: "lax" as const,
};

export async function selectProfile(formData: FormData) {
  const selectedProfile = String(
    formData.get("profile") ?? ""
  ) as ActiveProfile;

  if (selectedProfile !== "PATIENT" && selectedProfile !== "DOCTOR") {
    redirect("/selecionar-perfil");
  }

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (selectedProfile === "PATIENT") {
    if (!user.patient) {
      redirect("/");
    }

    cookieStore.set("activeProfile", "PATIENT", cookieOptions);
    redirect("/dashboard/paciente");
  }

  if (selectedProfile === "DOCTOR") {
    if (!user.doctor || user.doctor.approvalStatus !== "APPROVED") {
      redirect("/");
    }

    cookieStore.set("activeProfile", "DOCTOR", cookieOptions);
    redirect("/dashboard/medico");
  }

  redirect("/");
}