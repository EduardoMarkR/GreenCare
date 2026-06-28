import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    payoutId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export async function GET(_: Request, { params }: Props) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId || activeProfile !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { payoutId } = await params;

  const payout = await prisma.doctorPayout.findUnique({
    where: { id: payoutId },
    include: {
      doctor: { include: { user: true } },
      payments: {
        include: {
          patient: { include: { user: true } },
          appointment: { include: { availability: true } },
        },
        orderBy: { paidAt: "asc" },
      },
    },
  });

  if (!payout) {
    return NextResponse.json(
      { error: "Repasse não encontrado." },
      { status: 404 }
    );
  }

  const grossAmount = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const platformFee = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.platformFee),
    0
  );

  const doctorAmount = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("CannaDoctor - Relatorio de Repasse Medico", 14, 18);

  doc.setFontSize(10);
  doc.text(`Repasse: ${payout.id}`, 14, 28);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 34);

  doc.setFontSize(13);
  doc.text("Dados do medico", 14, 48);

  autoTable(doc, {
    startY: 54,
    theme: "grid",
    head: [["Campo", "Valor"]],
    body: [
      ["Nome", payout.doctor.user.name],
      ["E-mail", payout.doctor.user.email],
      ["Especialidade", payout.doctor.specialty],
      ["CRM", `${payout.doctor.crm}/${payout.doctor.crmUf}`],
      ["Periodo", `${formatDate(payout.startDate)} ate ${formatDate(payout.endDate)}`],
      ["Observacao", payout.notes ?? "Sem observacoes"],
    ],
  });

  const firstTableFinalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 90;

  doc.setFontSize(13);
  doc.text("Resumo financeiro", 14, firstTableFinalY + 14);

  autoTable(doc, {
    startY: firstTableFinalY + 20,
    theme: "grid",
    head: [["Indicador", "Valor"]],
    body: [
      ["Pagamentos vinculados", String(payout.payments.length)],
      ["Valor bruto", formatCurrency(grossAmount)],
      ["Comissao plataforma", formatCurrency(platformFee)],
      ["Valor medico calculado", formatCurrency(doctorAmount)],
      ["Valor do repasse", formatCurrency(Number(payout.amount))],
    ],
  });

  const secondTableFinalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 130;

  doc.setFontSize(13);
  doc.text("Pagamentos vinculados", 14, secondTableFinalY + 14);

  autoTable(doc, {
    startY: secondTableFinalY + 20,
    theme: "striped",
    head: [["Pago em", "Paciente", "Consulta", "Bruto", "Comissao", "Medico"]],
    body: payout.payments.map((payment) => [
      payment.paidAt ? formatDate(payment.paidAt) : "Nao informado",
      payment.patient.user.name,
      `${formatDate(payment.appointment.date)} ${
        payment.appointment.availability?.startTime ?? ""
      }`,
      formatCurrency(Number(payment.amount)),
      formatCurrency(Number(payment.platformFee)),
      formatCurrency(Number(payment.doctorAmount)),
    ]),
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fontSize: 8,
    },
  });

  const pdfArrayBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="repasse-${payout.id}.pdf"`,
    },
  });
}