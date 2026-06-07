"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateAppointmentStatus(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!appointmentId) {
    throw new Error("Consulta não informada.");
  }

  if (!["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
    throw new Error("Status inválido.");
  }

  await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    },
  });

  revalidatePath("/dashboard/admin/consultas");
  revalidatePath("/dashboard/admin");
}