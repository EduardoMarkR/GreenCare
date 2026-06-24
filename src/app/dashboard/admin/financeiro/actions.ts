"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "ADMIN") {
    redirect("/");
  }

  return userId;
}

export async function markPaymentAsPaid(formData: FormData) {
  const userId = await requireAdmin();

  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) {
    redirect("/dashboard/admin/financeiro?erro=Pagamento não encontrado.");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
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
  });

  if (!payment) {
    redirect("/dashboard/admin/financeiro?erro=Pagamento não encontrado.");
  }

  if (payment.status === "PAID") {
    redirect("/dashboard/admin/financeiro?erro=Este pagamento já está marcado como pago.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    if (payment.appointment.status !== "COMPLETED") {
      await tx.appointment.update({
        where: {
          id: payment.appointmentId,
        },
        data: {
          status: "CONFIRMED",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "MARK_PAYMENT_AS_PAID",
        entity: "Payment",
        entityId: payment.id,
        details: `Pagamento marcado como pago. Paciente: ${payment.patient.user.name}. Médico: ${payment.doctor.user.name}. Valor: R$ ${Number(
          payment.amount
        ).toFixed(2)}.`,
      },
    });
  });

  revalidatePath("/dashboard/admin/financeiro");
  revalidatePath("/dashboard/admin/consultas");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/dashboard/medico");

  redirect("/dashboard/admin/financeiro?sucesso=Pagamento marcado como pago.");
}

export async function cancelPayment(formData: FormData) {
  const userId = await requireAdmin();

  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) {
    redirect("/dashboard/admin/financeiro?erro=Pagamento não encontrado.");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
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
  });

  if (!payment) {
    redirect("/dashboard/admin/financeiro?erro=Pagamento não encontrado.");
  }

  if (payment.status === "PAID") {
    redirect("/dashboard/admin/financeiro?erro=Pagamento pago não pode ser cancelado por aqui.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await tx.appointment.update({
      where: {
        id: payment.appointmentId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CANCEL_PAYMENT",
        entity: "Payment",
        entityId: payment.id,
        details: `Pagamento cancelado. Paciente: ${payment.patient.user.name}. Médico: ${payment.doctor.user.name}.`,
      },
    });
  });

  revalidatePath("/dashboard/admin/financeiro");
  revalidatePath("/dashboard/admin/consultas");
  revalidatePath("/dashboard/paciente");
  revalidatePath("/dashboard/medico");

  redirect("/dashboard/admin/financeiro?sucesso=Pagamento cancelado.");
}