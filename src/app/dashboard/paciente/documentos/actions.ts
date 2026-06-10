"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

function getStoragePathFromPublicUrl(fileUrl: string) {
  const marker = "/patient-documents/";
  const index = fileUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(fileUrl.slice(index + marker.length));
}

export async function createDocument(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "");
  const file = formData.get("file");

  if (!name) {
    throw new Error("Nome do documento é obrigatório.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Arquivo é obrigatório.");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "file";
  const filePath = `${patient.id}-${crypto.randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from("patient-documents")
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Erro ao enviar arquivo: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("patient-documents")
    .getPublicUrl(filePath);

  await prisma.document.create({
    data: {
      patientId: patient.id,
      name,
      fileUrl: data.publicUrl,
      fileType: file.type || extension,
    },
  });

  revalidatePath("/dashboard/paciente/documentos");
  revalidatePath("/dashboard/paciente");
}

export async function deletePatientDocument(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) {
    throw new Error("Documento não informado.");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      patientId: patient.id,
    },
  });

  if (!document) {
    throw new Error("Documento não encontrado.");
  }

  const storagePath = getStoragePathFromPublicUrl(document.fileUrl);

  if (storagePath) {
    await supabase.storage.from("patient-documents").remove([storagePath]);
  }

  await prisma.document.delete({
    where: {
      id: document.id,
    },
  });

  revalidatePath("/dashboard/paciente/documentos");
  revalidatePath("/dashboard/paciente");
}