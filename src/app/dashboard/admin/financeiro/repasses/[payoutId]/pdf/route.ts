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

function getFinalY(doc: jsPDF, fallback: number) {
  return (
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? fallback
  );
}

function addFooter(doc: jsPDF, payoutId: string) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `CannaDoctor - Repasse ${payoutId} - Pagina ${page} de ${pageCount}`,
      14,
      288
    );
  }
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

  const isBalanced = Number(payout.amount) === doctorAmount;
  const doc = new jsPDF();

  doc.setFillColor(8, 85, 63);
  doc.rect(0, 0, 210, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("CannaDoctor", 14, 16);

  doc.setFontSize(10);
  doc.text("Relatorio oficial de repasse medico", 14, 24);

  doc.setFontSize(9);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 150, 16);
  doc.text(`Status: ${isBalanced ? "Conciliado" : "Divergencia"}`, 150, 23);

  doc.setTextColor(8, 85, 63);
  doc.setFontSize(15);
  doc.text("Resumo do fechamento", 14, 48);

  autoTable(doc, {
    startY: 54,
    theme: "grid",
    head: [["Indicador", "Valor"]],
    body: [
      ["ID do repasse", payout.id],
      ["Periodo", `${formatDate(payout.startDate)} ate ${formatDate(payout.endDate)}`],
      ["Medico", payout.doctor.user.name],
      ["CRM", `${payout.doctor.crm}/${payout.doctor.crmUf}`],
      ["Pagamentos vinculados", String(payout.payments.length)],
      ["Valor bruto", formatCurrency(grossAmount)],
      ["Comissao plataforma", formatCurrency(platformFee)],
      ["Valor medico calculado", formatCurrency(doctorAmount)],
      ["Valor do repasse", formatCurrency(Number(payout.amount))],
      ["Conciliacao", isBalanced ? "Conciliado" : "Divergencia encontrada"],
    ],
    headStyles: {
      fillColor: [8, 85, 63],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [247, 244, 231],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const summaryFinalY = getFinalY(doc, 110);

  doc.setTextColor(8, 85, 63);
  doc.setFontSize(15);
  doc.text("Dados do medico", 14, summaryFinalY + 14);

  autoTable(doc, {
    startY: summaryFinalY + 20,
    theme: "grid",
    head: [["Campo", "Valor"]],
    body: [
      ["Nome", payout.doctor.user.name],
      ["E-mail", payout.doctor.user.email],
      ["Especialidade", payout.doctor.specialty],
      ["CRM", `${payout.doctor.crm}/${payout.doctor.crmUf}`],
      ["Observacao", payout.notes ?? "Sem observacoes"],
    ],
    headStyles: {
      fillColor: [8, 85, 63],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [247, 244, 231],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const doctorFinalY = getFinalY(doc, 155);

  doc.setTextColor(8, 85, 63);
  doc.setFontSize(15);
  doc.text("Pagamentos vinculados", 14, doctorFinalY + 14);

  autoTable(doc, {
    startY: doctorFinalY + 20,
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
    headStyles: {
      fillColor: [8, 85, 63],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [247, 244, 231],
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
  });

  const paymentsFinalY = getFinalY(doc, 230);

  if (paymentsFinalY < 250) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text(
      "Documento gerado automaticamente pelo modulo financeiro do CannaDoctor.",
      14,
      paymentsFinalY + 14
    );
  }

  addFooter(doc, payout.id);

  const pdfArrayBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="repasse-${payout.id}.pdf"`,
    },
  });
}