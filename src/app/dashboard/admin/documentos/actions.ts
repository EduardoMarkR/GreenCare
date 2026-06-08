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

export async function deleteDocument(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) {
    throw new Error("Documento não informado.");
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  const filePath = getFilePathFromPublicUrl(document.fileUrl);
  const patientId = document.patientId;
  const documentName = document.name;
  const documentType = document.fileType || "tipo não informado";
  const patientName = document.patient.user.name;
  const patientEmail = document.patient.user.email;

  if (filePath) {
    await supabase.storage.from("patient-documents").remove([filePath]);
  }

  await prisma.document.delete({
    where: {
      id: documentId,
    },
  });

  await createAuditLog({
    userId,
    action: "DELETE_DOCUMENT",
    entity: "Document",
    entityId: documentId,
    details: `Admin excluiu o documento "${documentName}" (${documentType}) do paciente ${patientName} (${patientEmail}). Arquivo removido do Storage: ${
      filePath || "não identificado"
    }.`,
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/documentos");
  revalidatePath("/dashboard/admin/pacientes");
  revalidatePath(`/dashboard/admin/pacientes/${patientId}`);
}