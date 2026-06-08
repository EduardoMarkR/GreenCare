"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

function getRoleLabel(role: string) {
  if (role === "PATIENT") return "Paciente";
  if (role === "DOCTOR") return "Médico";
  if (role === "ADMIN") return "Administrador";

  return role;
}

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

  if (!["PATIENT", "ADMIN"].includes(role)) {
  throw new Error(
    "Não é permitido transformar usuário em médico pela gestão de usuários. Use o fluxo de candidatura médica."
  );
}

  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!targetUser) {
    throw new Error("Usuário não encontrado.");
  }

  const previousRole = targetUser.role;

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
      role: role as "PATIENT" | "ADMIN",
    },
  });

  await createAuditLog({
    userId: currentUserId,
    action: "UPDATE_USER_ROLE",
    entity: "User",
    entityId: targetUserId,
    details: `Admin alterou o perfil do usuário ${targetUser.name} (${targetUser.email}) de ${getRoleLabel(
      previousRole
    )} para ${getRoleLabel(role)}.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/usuarios");
}