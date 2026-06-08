"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { createAuditLog } from "@/lib/audit";

function getFilePathFromPublicUrl(fileUrl: string) {
  const marker = "/patient-documents/";

  if (!fileUrl.includes(marker)) {
    return null;
  }

  return decodeURIComponent(fileUrl.split(marker)[1]);
}

export async function deletePatient(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const patientId = String(formData.get("patientId") ?? "");

  if (!patientId) {
    throw new Error("Paciente não informado.");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
    include: {
      user: true,
      documents: true,
      appointments: true,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  const patientName = patient.user.name;
  const patientEmail = patient.user.email;
  const documentsCount = patient.documents.length;
  const appointmentsCount = patient.appointments.length;

  const filePaths = patient.documents
    .map((document) => getFilePathFromPublicUrl(document.fileUrl))
    .filter((filePath): filePath is string => Boolean(filePath));

  if (filePaths.length > 0) {
    await supabase.storage.from("patient-documents").remove(filePaths);
  }

  await prisma.document.deleteMany({
    where: {
      patientId,
    },
  });

  await prisma.appointment.deleteMany({
    where: {
      patientId,
    },
  });

  await prisma.patient.delete({
    where: {
      id: patientId,
    },
  });

  await createAuditLog({
    userId,
    action: "DELETE_PATIENT",
    entity: "Patient",
    entityId: patientId,
    details: `Admin excluiu o paciente ${patientName} (${patientEmail}). Consultas removidas: ${appointmentsCount}. Documentos removidos: ${documentsCount}. Arquivos removidos do Storage: ${filePaths.length}.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/pacientes");
  revalidatePath("/dashboard/admin/documentos");
  revalidatePath("/dashboard/admin/consultas");
}