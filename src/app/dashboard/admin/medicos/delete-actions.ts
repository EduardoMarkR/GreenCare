"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
      appointments: true,
      availabilities: true,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

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

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/medicos");
}