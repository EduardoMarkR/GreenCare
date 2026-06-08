"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

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
      documents: true,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

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

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/pacientes");
  revalidatePath("/dashboard/admin/documentos");
  revalidatePath("/dashboard/admin/consultas");
}