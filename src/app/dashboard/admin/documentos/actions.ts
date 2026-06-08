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
  });

  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  const filePath = getFilePathFromPublicUrl(document.fileUrl);

  if (filePath) {
    await supabase.storage.from("patient-documents").remove([filePath]);
  }

  await prisma.document.delete({
    where: {
      id: documentId,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/documentos");
  revalidatePath("/dashboard/admin/pacientes");
  revalidatePath(`/dashboard/admin/pacientes/${document.patientId}`);
}