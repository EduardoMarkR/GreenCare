import { NextResponse } from "next/server";
import { expireAllOverduePendingPayments } from "@/lib/payments/expiration";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  const result = await expireAllOverduePendingPayments();

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}