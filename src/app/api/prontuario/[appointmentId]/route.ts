import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{
    appointmentId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

async function getAppointmentWithMedicalRecord(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      availability: true,
      medicalRecord: true,
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
}

function addSection(
  doc: jsPDF,
  title: string,
  content: string | null | undefined,
  startY: number
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const maxWidth = 170;
  let y = startY;

  if (y > pageHeight - 35) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, marginX, y);

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const text = content?.trim() || "Não informado.";
  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, marginX, y);
    y += 6;
  });

  return y + 8;
}

async function createPdfBuffer(
  appointment: NonNullable<
    Awaited<ReturnType<typeof getAppointmentWithMedicalRecord>>
  >
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setProperties({
    title: "Prontuário Eletrônico",
    author: "CannaDoctor",
    creator: "CannaDoctor",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Prontuário Eletrônico", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("CannaDoctor - Cannabis Medicinal", 105, 28, {
    align: "center",
  });

  let currentY = 42;

  currentY = addSection(
    doc,
    "Dados da consulta",
    [
      `Paciente: ${appointment.patient.user.name}`,
      `Médico(a): Dr(a). ${appointment.doctor.user.name}`,
      `Especialidade: ${appointment.doctor.specialty}`,
      `CRM: ${appointment.doctor.crm}/${appointment.doctor.crmUf}`,
      `Data: ${formatDate(appointment.date)}`,
      appointment.availability
        ? `Horário: ${appointment.availability.startTime} às ${appointment.availability.endTime}`
        : "Horário: Não informado",
    ].join("\n"),
    currentY
  );

  currentY = addSection(
    doc,
    "Queixa principal",
    appointment.medicalRecord?.complaint,
    currentY
  );

  currentY = addSection(
    doc,
    "Conduta médica",
    appointment.medicalRecord?.conduct,
    currentY
  );

  currentY = addSection(
    doc,
    "Observações clínicas",
    appointment.medicalRecord?.notes,
    currentY
  );

  addSection(
    doc,
    "Prescrição / orientação terapêutica",
    appointment.medicalRecord?.prescription,
    currentY
);

  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Documento gerado eletronicamente pela plataforma CannaDoctor.",
    105,
    pageHeight - 12,
    { align: "center" }
  );

  const arrayBuffer = doc.output("arraybuffer");

  return Buffer.from(arrayBuffer);
}

export async function GET(_request: Request, { params }: RouteProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { appointmentId } = await params;

  const appointment = await getAppointmentWithMedicalRecord(appointmentId);

  if (!appointment || !appointment.medicalRecord) {
    return NextResponse.json(
      { error: "Prontuário não encontrado." },
      { status: 404 }
    );
  }

  const isPatientOwner =
    activeProfile === "PATIENT" && appointment.patient.userId === userId;

  const isAdmin = activeProfile === "ADMIN";

  if (!isPatientOwner && !isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const pdfBuffer = await createPdfBuffer(appointment);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="prontuario-${appointment.id}.pdf"`,
    },
  });
}