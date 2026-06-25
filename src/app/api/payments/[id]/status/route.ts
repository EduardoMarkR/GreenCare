import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PaymentStatusRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: PaymentStatusRouteProps) {
  const { id } = await params;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId || activeProfile !== "PATIENT") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      patientId: patient.id,
    },
    include: {
      appointment: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    paymentStatus: payment.status,
    appointmentStatus: payment.appointment.status,
    meetingUrl: payment.appointment.meetingUrl,
    paidAt: payment.paidAt,
  });
}