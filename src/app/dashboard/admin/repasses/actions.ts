"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function createDoctorPayout(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctorId = String(formData.get("doctorId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!doctorId) {
    throw new Error("Médico não informado.");
  }

  if (!amount || amount <= 0 || Number.isNaN(amount)) {
    throw new Error("Valor de repasse inválido.");
  }

  if (!startDate || !endDate) {
    throw new Error("Período do repasse não informado.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: true,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  await prisma.doctorPayout.create({
    data: {
      doctorId,
      amount,
      startDate: new Date(`${startDate}T00:00:00.000Z`),
      endDate: new Date(`${endDate}T00:00:00.000Z`),
      notes: notes || null,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE_DOCTOR_PAYOUT",
    entity: "DoctorPayout",
    entityId: doctorId,
    details: `Admin registrou repasse médico para ${doctor.user.name} (${doctor.user.email}) no valor de R$ ${amount.toFixed(
      2
    )}, referente ao período de ${startDate} até ${endDate}.`,
  });

  revalidatePath("/dashboard/admin/repasses");
  revalidatePath("/dashboard/admin/financeiro");
  revalidatePath("/dashboard/medico/financeiro");
  revalidatePath("/dashboard/medico/extrato");

  redirect("/dashboard/admin/repasses?success=repasse-criado");
}