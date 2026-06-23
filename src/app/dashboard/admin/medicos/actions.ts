"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

function getApprovalStatusLabel(status: string) {
  if (status === "PENDING") return "pendente";
  if (status === "APPROVED") return "aprovado";
  if (status === "REJECTED") return "reprovado";

  return status;
}

function getSuccessParam(status: string) {
  if (status === "APPROVED") return "medico-aprovado";
  if (status === "REJECTED") return "medico-reprovado";
  if (status === "PENDING") return "medico-pendente";

  return "status-atualizado";
}

export async function updateDoctorApproval(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctorId = String(formData.get("doctorId") ?? "");
  const approvalStatus = String(formData.get("approvalStatus") ?? "");

  if (!doctorId) {
    throw new Error("Médico não informado.");
  }

  if (!["PENDING", "APPROVED", "REJECTED"].includes(approvalStatus)) {
    throw new Error("Status inválido.");
  }

  const doctorBeforeUpdate = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: true,
    },
  });

  if (!doctorBeforeUpdate) {
    throw new Error("Médico não encontrado.");
  }

  await prisma.doctor.update({
    where: {
      id: doctorId,
    },
    data: {
      approvalStatus: approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
      approved: approvalStatus === "APPROVED",
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE_DOCTOR_APPROVAL",
    entity: "Doctor",
    entityId: doctorId,
    details: `Admin alterou status do médico ${doctorBeforeUpdate.user.name} (${doctorBeforeUpdate.user.email}) de ${getApprovalStatusLabel(
      doctorBeforeUpdate.approvalStatus
    )} para ${getApprovalStatusLabel(approvalStatus)}.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/medicos");
  revalidatePath("/medicos");

  redirect(`/dashboard/admin/medicos?success=${getSuccessParam(approvalStatus)}`);
}

export async function updateDoctorPlatformFee(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctorId = String(formData.get("doctorId") ?? "");
  const platformFeePercent = Number(formData.get("platformFeePercent") ?? 10);

  if (!doctorId) {
    throw new Error("Médico não informado.");
  }

  if (Number.isNaN(platformFeePercent)) {
    throw new Error("Comissão inválida.");
  }

  const normalizedFee = Math.min(Math.max(platformFeePercent, 0), 100);

  const doctorBeforeUpdate = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: true,
    },
  });

  if (!doctorBeforeUpdate) {
    throw new Error("Médico não encontrado.");
  }

  await prisma.doctor.update({
    where: {
      id: doctorId,
    },
    data: {
      platformFeePercent: normalizedFee,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE_DOCTOR_PLATFORM_FEE",
    entity: "Doctor",
    entityId: doctorId,
    details: `Admin alterou comissão da plataforma do médico ${
      doctorBeforeUpdate.user.name
    } (${doctorBeforeUpdate.user.email}) de ${Number(
      doctorBeforeUpdate.platformFeePercent
    )}% para ${normalizedFee}%.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/medicos");
  revalidatePath("/dashboard/admin/financeiro");
  revalidatePath("/dashboard/medico/financeiro");

  redirect("/dashboard/admin/medicos?success=comissao-atualizada");
}