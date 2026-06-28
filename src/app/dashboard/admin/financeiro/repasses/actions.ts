"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const REPASSES_PATH = "/dashboard/admin/financeiro/repasses";

function getStartDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getEndDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function redirectWithError(error: string): never {
  redirect(`${REPASSES_PATH}?erro=${error}`);
}

export async function createDoctorPayout(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "ADMIN") redirect("/");

  const doctorId = String(formData.get("doctorId") ?? "");
  const startDateValue = String(formData.get("startDate") ?? "");
  const endDateValue = String(formData.get("endDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!doctorId) {
    redirectWithError("medico-nao-informado");
  }

  if (!startDateValue || !endDateValue) {
    redirectWithError("periodo-nao-informado");
  }

  const startDate = getStartDate(startDateValue);
  const endDate = getEndDate(endDateValue);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    redirectWithError("periodo-invalido");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: true },
  });

  if (!doctor) {
    redirectWithError("medico-nao-encontrado");
  }

  const doctorName = doctor.user.name;

  const eligiblePayments = await prisma.payment.findMany({
    where: {
      doctorId,
      status: "PAID",
      payoutId: null,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      paidAt: "asc",
    },
  });

  if (eligiblePayments.length === 0) {
    redirectWithError("sem-pagamentos");
  }

  const amount = eligiblePayments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const grossAmount = eligiblePayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const platformFee = eligiblePayments.reduce(
    (sum, payment) => sum + Number(payment.platformFee),
    0
  );

  const paymentIds = eligiblePayments.map((payment) => payment.id);

  const payout = await prisma.$transaction(async (tx) => {
    const createdPayout = await tx.doctorPayout.create({
      data: {
        doctorId,
        amount,
        startDate,
        endDate,
        notes:
          notes ||
          `Fechamento automático de ${eligiblePayments.length} pagamento(s).`,
      },
    });

    await tx.payment.updateMany({
      where: {
        id: {
          in: paymentIds,
        },
        payoutId: null,
      },
      data: {
        payoutId: createdPayout.id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_DOCTOR_PAYOUT",
        entity: "DoctorPayout",
        entityId: createdPayout.id,
        details: `Repasse automático criado para ${doctorName}. Período: ${startDateValue} até ${endDateValue}. Pagamentos: ${eligiblePayments.length}. Bruto: R$ ${grossAmount.toFixed(
          2
        )}. Comissão: R$ ${platformFee.toFixed(2)}. Médico: R$ ${amount.toFixed(
          2
        )}.`,
      },
    });

    return createdPayout;
  });

  await createAuditLog({
    userId,
    action: "LINK_PAYMENTS_TO_DOCTOR_PAYOUT",
    entity: "Payment",
    entityId: payout.id,
    details: `Pagamentos vinculados ao repasse ${payout.id}: ${paymentIds.join(
      ", "
    )}.`,
  });

  revalidatePath(REPASSES_PATH);
  revalidatePath("/dashboard/admin/financeiro");
  revalidatePath("/dashboard/admin/financeiro/extrato");
  revalidatePath("/dashboard/admin/financeiro/graficos");
  revalidatePath("/dashboard/medico/financeiro");
  revalidatePath("/dashboard/medico/extrato");

  redirect(`${REPASSES_PATH}?success=repasse-criado`);
}