"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateUserRole(formData: FormData) {
  const cookieStore = await cookies();

  const currentUserId = cookieStore.get("userId")?.value;
  const currentUserRole = cookieStore.get("userRole")?.value;

  if (!currentUserId || currentUserRole !== "ADMIN") {
    redirect("/login");
  }

  const targetUserId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!targetUserId) {
    throw new Error("Usuário não informado.");
  }

  if (!["PATIENT", "DOCTOR", "ADMIN"].includes(role)) {
    throw new Error("Perfil inválido.");
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!targetUser) {
    throw new Error("Usuário não encontrado.");
  }

  if (targetUser.role === "ADMIN" && role !== "ADMIN") {
    const totalAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
      },
    });

    if (totalAdmins <= 1) {
      throw new Error("Não é possível remover o último administrador.");
    }
  }

  await prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      role: role as "PATIENT" | "DOCTOR" | "ADMIN",
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/usuarios");
}