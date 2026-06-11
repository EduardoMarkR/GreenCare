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

const mutedColor = "#666666";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getRecordNumber(appointmentId: string, date: Date) {
  const datePart = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("/")
    .reverse()
    .join("");

  const shortId = appointmentId.slice(0, 8).toUpperCase();

  return `PR-${datePart}-${shortId}`;
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

function addFooter(doc: jsPDF, generatedAt: Date) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220, 220, 220);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedColor);
  doc.text(
    `Documento gerado eletronicamente pela plataforma CannaDoctor em ${formatDateTime(
      generatedAt
    )}.`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );

  doc.setTextColor("#000000");
}

function addHeader(doc: jsPDF, recordNumber: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(8, 85, 63);
  doc.roundedRect(20, 16, pageWidth - 40, 28, 4, 4, "F");

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CannaDoctor", 28, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Cannabis Medicinal", 28, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Prontuário Eletrônico", pageWidth - 28, 28, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(recordNumber, pageWidth - 28, 36, {
    align: "right",
  });

  doc.setTextColor("#000000");
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

  if (y > pageHeight - 45) {
    doc.addPage();
    y = 24;
  }

  doc.setFillColor(247, 244, 231);
  doc.roundedRect(marginX, y - 6, 170, 10, 2, 2, "F");

  doc.setTextColor(8, 85, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, marginX + 3, y);

  y += 10;

  doc.setTextColor("#000000");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const text = content?.trim() || "Não informado.";
  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line: string) => {
    if (y > pageHeight - 32) {
      doc.addPage();
      y = 24;
    }

    doc.text(line, marginX, y);
    y += 6;
  });

  return y + 8;
}

function addSignature(
  doc: jsPDF,
  doctorName: string,
  crm: string,
  crmUf: string
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight - 55;

  doc.setDrawColor(120, 120, 120);
  doc.line(55, y, 155, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#000000");
  doc.text(`Dr(a). ${doctorName}`, 105, y, { align: "center" });

  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`CRM ${crm}/${crmUf}`, 105, y, { align: "center" });
}

async function createPdfBuffer(
  appointment: NonNullable<
    Awaited<ReturnType<typeof getAppointmentWithMedicalRecord>>
  >
) {
  const generatedAt = new Date();
  const recordNumber = getRecordNumber(appointment.id, appointment.date);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setProperties({
    title: `Prontuário Eletrônico - ${recordNumber}`,
    author: "CannaDoctor",
    creator: "CannaDoctor",
  });

  addHeader(doc, recordNumber);

  doc.setTextColor(8, 85, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Prontuário Eletrônico", 105, 58, { align: "center" });

  doc.setTextColor(mutedColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Número do prontuário: ${recordNumber}`, 105, 66, {
    align: "center",
  });

  let currentY = 82;

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

  addSignature(
    doc,
    appointment.doctor.user.name,
    appointment.doctor.crm,
    appointment.doctor.crmUf
  );

  addFooter(doc, generatedAt);

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

  const isDoctorOwner =
    activeProfile === "DOCTOR" && appointment.doctor.userId === userId;

  const isAdmin = activeProfile === "ADMIN";

  if (!isPatientOwner && !isDoctorOwner && !isAdmin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const pdfBuffer = await createPdfBuffer(appointment);
  const recordNumber = getRecordNumber(appointment.id, appointment.date);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${recordNumber}.pdf"`,
    },
  });
}