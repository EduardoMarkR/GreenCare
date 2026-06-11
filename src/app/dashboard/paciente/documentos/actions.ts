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

function isAllowedFile(file: File) {
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  return allowedTypes.includes(file.type);
}

export async function createDocument(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("file");

  if (!appointmentId) {
    redirect(
      "/dashboard/paciente/documentos?erro=Selecione uma consulta para vincular o documento."
    );
  }

  if (!name) {
    redirect(
      "/dashboard/paciente/documentos?erro=Nome do documento é obrigatório."
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard/paciente/documentos?erro=Arquivo é obrigatório.");
  }

  if (!isAllowedFile(file)) {
    redirect(
      "/dashboard/paciente/documentos?erro=Formato inválido. Envie PDF, PNG, JPG, JPEG ou WEBP."
    );
  }

  const maxFileSize = 10 * 1024 * 1024;

  if (file.size > maxFileSize) {
    redirect(
      "/dashboard/paciente/documentos?erro=Arquivo muito grande. O limite é 10MB."
    );
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
      status: {
        in: ["PENDING", "CONFIRMED", "COMPLETED"],
      },
    },
  });

  if (!appointment) {
    redirect(
      "/dashboard/paciente/documentos?erro=Consulta não encontrada para vincular o documento."
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "file";
  const filePath = `${patient.id}/${appointment.id}/${crypto.randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from("patient-documents")
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    redirect(
      `/dashboard/paciente/documentos?erro=${encodeURIComponent(
        `Erro ao enviar arquivo: ${error.message}`
      )}`
    );
  }

  const { data } = supabase.storage
    .from("patient-documents")
    .getPublicUrl(filePath);

  await prisma.document.create({
    data: {
      patientId: patient.id,
      appointmentId: appointment.id,
      name,
      fileUrl: data.publicUrl,
      fileType: file.type || extension,
    },
  });

  revalidatePath("/dashboard/paciente/documentos");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");

  redirect("/dashboard/paciente/documentos");
}

export async function deletePatientDocument(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) {
    redirect("/dashboard/paciente/documentos?erro=Documento não informado.");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      patientId: patient.id,
    },
  });

  if (!document) {
    redirect("/dashboard/paciente/documentos?erro=Documento não encontrado.");
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
  revalidatePath("/medico/consultas");
  revalidatePath("/medico/historico");

  redirect("/dashboard/paciente/documentos");
}