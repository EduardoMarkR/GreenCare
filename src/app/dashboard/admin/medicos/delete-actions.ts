"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function deleteDoctor(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctorId = String(formData.get("doctorId") ?? "");

  if (!doctorId) {
    throw new Error("Médico não informado.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: true,
      appointments: true,
      availabilities: true,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const doctorName = doctor.user.name;
  const doctorEmail = doctor.user.email;
  const appointmentsCount = doctor.appointments.length;
  const availabilitiesCount = doctor.availabilities.length;

  await prisma.appointment.deleteMany({
    where: {
      doctorId,
    },
  });

  await prisma.availability.deleteMany({
    where: {
      doctorId,
    },
  });

  await prisma.doctor.delete({
    where: {
      id: doctorId,
    },
  });

  if (doctor.user.role === "DOCTOR") {
  await prisma.user.update({
    where: {
      id: doctor.userId,
    },
    data: {
      role: "PATIENT",
    },
  });
}

  await createAuditLog({
    userId,
    action: "DELETE_DOCTOR",
    entity: "Doctor",
    entityId: doctorId,
    details: `Admin excluiu o médico ${doctorName} (${doctorEmail}). Consultas removidas: ${appointmentsCount}. Horários removidos: ${availabilitiesCount}.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/medicos");
}