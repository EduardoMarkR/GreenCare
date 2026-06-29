import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expirePendingPayment } from "@/lib/payments/expiration";

type PaymentExpireRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: PaymentExpireRouteProps
) {
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
    select: {
      id: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const result = await expirePendingPayment(payment.id);

  return NextResponse.json(result);
}