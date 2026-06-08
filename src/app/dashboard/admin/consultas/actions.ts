"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

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

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Consulta não encontrada.");
  }

  const previousStatus = appointment.status;

  await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: status as
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED"
        | "COMPLETED",
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE_APPOINTMENT_STATUS",
    entity: "Appointment",
    entityId: appointmentId,
    details: `Admin alterou a consulta do paciente ${appointment.patient.user.name} (${appointment.patient.user.email}) com o médico ${appointment.doctor.user.name} de ${getStatusLabel(
      previousStatus
    )} para ${getStatusLabel(status)}.`,
  });

  revalidatePath("/dashboard/admin/consultas");
  revalidatePath("/dashboard/admin");
}