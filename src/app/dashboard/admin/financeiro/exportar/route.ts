import { PaymentStatus, Prisma } from "@/generated/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function formatNullableDate(date?: Date | null) {
  if (!date) return "";

  return formatDate(date);
}

function escapeCsv(value: string | number) {
  const stringValue = String(value).replace(/"/g, '""');

  return `"${stringValue}"`;
}

function getPeriodRange(period: string) {
  const now = new Date();

  if (period === "7d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);

    return {
      gte: start,
      lt: now,
    };
  }

  if (period === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);

    return {
      gte: start,
      lt: now,
    };
  }

  if (period === "all") {
    return undefined;
  }

  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  return {
    gte: startOfMonth,
    lt: startOfNextMonth,
  };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId || activeProfile !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);

  const period = url.searchParams.get("period") ?? "month";
  const status = url.searchParams.get("status") ?? "all";
  const doctorId = url.searchParams.get("doctorId") ?? "all";

  const createdAtRange = getPeriodRange(period);

  const payments = await prisma.payment.findMany({
    where: {
      ...(createdAtRange
        ? {
            createdAt: createdAtRange,
          }
        : {}),
      ...(status !== "all"
        ? {
            status: status as PaymentStatus,
          }
        : {}),
      ...(doctorId !== "all"
        ? {
            doctorId,
          }
        : {}),
    },
    include: {
      appointment: true,
      doctor: {
        include: {
          user: true,
        },
      },
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const header = [
    "Data do pagamento",
    "Data da consulta",
    "Médico",
    "Especialidade",
    "Paciente",
    "Status pagamento",
    "Status consulta",
    "Método",
    "Valor bruto",
    "Comissão %",
    "Comissão plataforma",
    "Valor médico",
    "Pago em",
    "Cancelado em",
  ];

  const rows = payments.map((payment) => [
    formatDate(payment.createdAt),
    formatDate(payment.appointment.date),
    payment.doctor.user.name,
    payment.doctor.specialty,
    payment.patient.user.name,
    payment.status,
    payment.appointment.status,
    payment.method ?? "",
    formatCurrency(Number(payment.amount)),
    Number(payment.commissionRate),
    formatCurrency(Number(payment.platformFee)),
    formatCurrency(Number(payment.doctorAmount)),
    formatNullableDate(payment.paidAt),
    formatNullableDate(payment.cancelledAt),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(";"))
    .join("\n");

  const now = new Date();

  const fileName = `financeiro-cannadoctor-${period}-${status}-${now
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}