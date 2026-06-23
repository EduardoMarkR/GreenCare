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

function escapeCsv(value: string | number) {
  const stringValue = String(value).replace(/"/g, '""');

  return `"${stringValue}"`;
}

export async function GET() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId || activeProfile !== "ADMIN") {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const now = new Date();

  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
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
      date: "desc",
    },
  });

  const header = [
    "Data",
    "Médico",
    "Especialidade",
    "Paciente",
    "Status",
    "Valor estimado",
  ];

  const rows = appointments.map((appointment) => {
    const value =
      appointment.status === "CANCELLED"
        ? 0
        : Number(appointment.doctor.price);

    return [
      formatDate(appointment.date),
      appointment.doctor.user.name,
      appointment.doctor.specialty,
      appointment.patient.user.name,
      appointment.status,
      formatCurrency(value),
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(";"))
    .join("\n");

  const fileName = `financeiro-cannadoctor-${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}