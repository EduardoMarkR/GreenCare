"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

  await prisma.doctor.update({
    where: {
      id: doctorId,
    },
    data: {
      approvalStatus: approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
      approved: approvalStatus === "APPROVED",
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/medicos");
  revalidatePath("/medicos");
}