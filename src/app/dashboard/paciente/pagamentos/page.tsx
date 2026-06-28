import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppointmentStatus, PaymentStatus } from "@/generated/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { asaasRequest } from "@/lib/payments/asaas";
import { createGoogleMeetEvent } from "@/lib/google-meet";

type AsaasPaymentResponse = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
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

function isAsaasPaymentPaid(status?: string | null) {
  return (
    status === "RECEIVED" ||
    status === "CONFIRMED" ||
    status === "RECEIVED_IN_CASH"
  );
}

function getAsaasPaidAt(asaasPayment: AsaasPaymentResponse) {
  if (asaasPayment.paymentDate) return new Date(asaasPayment.paymentDate);
  if (asaasPayment.clientPaymentDate) {
    return new Date(asaasPayment.clientPaymentDate);
  }
  if (asaasPayment.confirmedDate) return new Date(asaasPayment.confirmedDate);

  return new Date();
}

function getPaymentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "PAID") return "Pago";
  if (status === "FAILED") return "Falhou";
  if (status === "REFUNDED") return "Reembolsado";
  if (status === "CANCELLED") return "Cancelado";

  return status;
}

function getPaymentStatusClass(status: string) {
  if (status === "PAID") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CANCELLED") return "bg-[#C6C6C6]/30 text-[#878787]";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  if (status === "REFUNDED") return "bg-blue-100 text-blue-700";

  return "bg-white text-[#08553F]";
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Consulta pendente";
  if (status === "CONFIRMED") return "Consulta confirmada";
  if (status === "CANCELLED") return "Consulta cancelada";
  if (status === "COMPLETED") return "Consulta concluída";

  return status;
}

async function ensureGoogleMeetForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    select: {
      id: true,
      meetingUrl: true,
      googleEventId: true,
    },
  });

  if (!appointment || appointment.meetingUrl) {
    return;
  }

  try {
    await createGoogleMeetEvent({
      appointmentId: appointment.id,
    });

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATED_BY_PAYMENT_LIST_SYNC",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Google Meet criado automaticamente após sincronização do pagamento aprovado.",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao criar Google Meet após sincronizar pagamento:",
      error
    );

    await prisma.auditLog.create({
      data: {
        action: "GOOGLE_MEET_CREATION_FAILED_BY_PAYMENT_LIST_SYNC",
        entity: "Appointment",
        entityId: appointment.id,
        details:
          "Falha ao criar Google Meet automaticamente após sincronização do pagamento aprovado.",
      },
    });
  }
}

async function syncPendingPaymentWithAsaas(payment: {
  id: string;
  gatewayPaymentId: string | null;
  status: PaymentStatus;
  appointmentId: string;
  invoiceUrl: string | null;
  boletoUrl: string | null;
  externalUrl: string | null;
}) {
  if (payment.status === PaymentStatus.PAID || !payment.gatewayPaymentId) {
    return;
  }

  try {
    const asaasPayment = await asaasRequest<AsaasPaymentResponse>(
      `/payments/${payment.gatewayPaymentId}`
    );

    if (!isAsaasPaymentPaid(asaasPayment.status)) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: getAsaasPaidAt(asaasPayment),
          gatewayPaymentId: asaasPayment.id,
          externalId: asaasPayment.id,
          invoiceUrl: asaasPayment.invoiceUrl ?? payment.invoiceUrl,
          boletoUrl: asaasPayment.bankSlipUrl ?? payment.boletoUrl,
          externalUrl: asaasPayment.invoiceUrl ?? payment.externalUrl,
        },
      });

      await tx.appointment.update({
        where: {
          id: payment.appointmentId,
        },
        data: {
          status: AppointmentStatus.CONFIRMED,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "PAYMENT_APPROVED_BY_PAYMENT_LIST_SYNC",
          entity: "Payment",
          entityId: payment.id,
          details:
            "Pagamento sincronizado como aprovado ao carregar a lista financeira do paciente.",
        },
      });
    });

    await ensureGoogleMeetForAppointment(payment.appointmentId);
  } catch (error) {
    console.error("Erro ao sincronizar pagamento pendente com Asaas:", error);
  }
}

async function syncConfirmedAppointmentWithoutMeet(payment: {
  status: PaymentStatus;
  appointmentId: string;
  appointmentStatus: AppointmentStatus;
  meetingUrl: string | null;
}) {
  if (
    payment.status !== PaymentStatus.PAID ||
    payment.appointmentStatus !== AppointmentStatus.CONFIRMED ||
    payment.meetingUrl
  ) {
    return;
  }

  await ensureGoogleMeetForAppointment(payment.appointmentId);
}

export default async function PagamentosPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const initialPayments = await prisma.payment.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      appointment: {
        include: {
          availability: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  await Promise.all(
    initialPayments.map(async (payment) => {
      if (payment.status === PaymentStatus.PENDING) {
        await syncPendingPaymentWithAsaas({
          id: payment.id,
          gatewayPaymentId: payment.gatewayPaymentId,
          status: payment.status,
          appointmentId: payment.appointmentId,
          invoiceUrl: payment.invoiceUrl,
          boletoUrl: payment.boletoUrl,
          externalUrl: payment.externalUrl,
        });

        return;
      }

      await syncConfirmedAppointmentWithoutMeet({
        status: payment.status,
        appointmentId: payment.appointmentId,
        appointmentStatus: payment.appointment.status,
        meetingUrl: payment.appointment.meetingUrl,
      });
    })
  );

  const payments = await prisma.payment.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      appointment: {
        include: {
          availability: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.PENDING
  );

  const paidPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.PAID
  );

  const cancelledPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.CANCELLED
  );

  const totalPending = pendingPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalPaid = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro do paciente"
          title="Meus pagamentos"
          description="Acompanhe os pagamentos das suas consultas, valores pendentes, pagamentos aprovados e histórico financeiro."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/paciente"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao painel
            </Link>

            <Link
              href="/medicos"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Agendar consulta
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagamentos pendentes
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {pendingPayments.length}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Total: {formatCurrency(totalPending)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">Total pago</p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(totalPaid)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                {paidPayments.length} pagamento(s) aprovado(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Cancelados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {cancelledPayments.length}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pagamentos ou consultas canceladas.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Histórico financeiro
            </h2>

            <p className="mt-2 text-[#878787]">
              Todos os pagamentos vinculados às suas consultas.
            </p>

            <div className="mt-6 space-y-4">
              {payments.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhum pagamento encontrado.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando você agendar uma consulta, o pagamento aparecerá aqui.
                  </p>
                </div>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-extrabold text-[#08553F]">
                          Dr(a). {payment.doctor.user.name}
                        </p>

                        <p className="mt-1 text-sm text-[#878787]">
                          {payment.doctor.specialty}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#08553F]">
                          Consulta: {formatDate(payment.appointment.date)}
                        </p>

                        {payment.appointment.availability ? (
                          <p className="mt-1 text-sm font-semibold text-[#08553F]">
                            {payment.appointment.availability.startTime} às{" "}
                            {payment.appointment.availability.endTime}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-bold ${getPaymentStatusClass(
                              payment.status
                            )}`}
                          >
                            {getPaymentStatusLabel(payment.status)}
                          </span>

                          <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#08553F]">
                            {getAppointmentStatusLabel(
                              payment.appointment.status
                            )}
                          </span>
                        </div>

                        {payment.paidAt ? (
                          <p className="mt-2 text-xs text-[#878787]">
                            Pago em: {formatDate(payment.paidAt)}
                          </p>
                        ) : null}

                        {payment.appointment.meetingUrl ? (
                          <Link
                            href={payment.appointment.meetingUrl}
                            target="_blank"
                            className="mt-4 inline-flex rounded-2xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                          >
                            Acessar Google Meet
                          </Link>
                        ) : null}
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm font-semibold text-[#878787]">
                          Valor da consulta
                        </p>

                        <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                          {formatCurrency(Number(payment.amount))}
                        </p>

                        {payment.status === PaymentStatus.PENDING ? (
                          <div className="mt-4 rounded-2xl bg-[#F3EFA1] p-4 text-sm font-bold text-[#08553F]">
                            Pagamento aguardando aprovação.
                          </div>
                        ) : null}

                        {payment.status === PaymentStatus.PAID ? (
                          <div className="mt-4 rounded-2xl bg-[#00CF7B]/15 p-4 text-sm font-bold text-[#08553F]">
                            Pagamento confirmado.
                          </div>
                        ) : null}

                        {payment.status === PaymentStatus.PAID &&
                        !payment.appointment.meetingUrl ? (
                          <div className="mt-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#878787]">
                            Link do Google Meet em processamento.
                          </div>
                        ) : null}

                        {payment.status === PaymentStatus.CANCELLED ? (
                          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-[#878787]">
                            Pagamento cancelado.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}