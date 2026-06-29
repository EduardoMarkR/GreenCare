import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments";

const PAYMENT_EXPIRATION_MINUTES = 20;

export function getPaymentExpirationDate(createdAt: Date) {
  return new Date(
    createdAt.getTime() + PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );
}

export function isPaymentExpired(createdAt: Date) {
  return new Date() >= getPaymentExpirationDate(createdAt);
}

export async function expirePendingPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      appointment: true,
    },
  });

  if (!payment) {
    return {
      ok: false,
      expired: false,
      reason: "Pagamento não encontrado.",
    };
  }

  if (payment.status === PaymentStatus.PAID) {
    return {
      ok: true,
      expired: false,
      reason: "Pagamento já confirmado.",
    };
  }

  if (payment.status === PaymentStatus.CANCELLED) {
    return {
      ok: true,
      expired: true,
      reason: "Pagamento já cancelado.",
    };
  }

  if (!isPaymentExpired(payment.createdAt)) {
    return {
      ok: true,
      expired: false,
      reason: "Pagamento ainda dentro do prazo.",
      expiresAt: getPaymentExpirationDate(payment.createdAt),
    };
  }

  try {
    if (payment.gatewayPaymentId) {
      await paymentProvider.cancelCharge(payment.gatewayPaymentId);
    }
  } catch (error) {
    console.error("Erro ao cancelar cobrança expirada no Asaas:", error);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await tx.appointment.update({
      where: {
        id: payment.appointmentId,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_EXPIRED_AUTOMATICALLY",
        entity: "Payment",
        entityId: payment.id,
        details:
          "Pagamento expirado automaticamente após 20 minutos sem confirmação. Consulta cancelada e horário liberado.",
      },
    });
  });

  return {
    ok: true,
    expired: true,
    reason: "Pagamento expirado com sucesso.",
  };
}

export async function expireAllOverduePendingPayments() {
  const expirationLimit = new Date(
    Date.now() - PAYMENT_EXPIRATION_MINUTES * 60 * 1000
  );

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      createdAt: {
        lte: expirationLimit,
      },
    },
    select: {
      id: true,
    },
  });

  const results = await Promise.allSettled(
    payments.map((payment) => expirePendingPayment(payment.id))
  );

  const expired = results.filter(
    (result) =>
      result.status === "fulfilled" && result.value.ok && result.value.expired
  ).length;

  const failed = results.filter((result) => result.status === "rejected").length;

  return {
    ok: true,
    checked: payments.length,
    expired,
    failed,
  };
}