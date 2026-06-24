import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
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

function getPaymentStatusLabel(status: string) {
  if (status === "PENDING") return "Pagamento pendente";
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
  if (status === "COMPLETED") return "Consulta concluída";
  if (status === "CANCELLED") return "Consulta cancelada";

  return status;
}

export default async function FinanceiroMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const now = new Date();

  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const [
    paymentsThisMonth,
    allPaidPayments,
    payouts,
    paymentsCountThisMonth,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      include: {
        appointment: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.payment.findMany({
      where: {
        doctorId: doctor.id,
        status: "PAID",
      },
    }),
    prisma.doctorPayout.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.payment.count({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    }),
  ]);

  const paidPaymentsThisMonth = paymentsThisMonth.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingPaymentsThisMonth = paymentsThisMonth.filter(
    (payment) => payment.status === "PENDING"
  );

  const cancelledPaymentsThisMonth = paymentsThisMonth.filter(
    (payment) => payment.status === "CANCELLED"
  );

  const paidFinancials = paidPaymentsThisMonth.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const pendingFinancials = pendingPaymentsThisMonth.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const projectedFinancials = {
    gross: paidFinancials.gross + pendingFinancials.gross,
    platformFee: paidFinancials.platformFee + pendingFinancials.platformFee,
    doctorNet: paidFinancials.doctorNet + pendingFinancials.doctorNet,
  };

  const lifetimeFinancials = allPaidPayments.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const totalPayouts = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const availableForPayout = Math.max(
    lifetimeFinancials.doctorNet - totalPayouts,
    0
  );

  const recentPaymentsThisMonth = paymentsThisMonth.slice(0, 8);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro médico"
          title="Dashboard financeiro profissional"
          description="Acompanhe pagamentos reais, comissão da plataforma, valor líquido, saldo para repasse e histórico financeiro das suas consultas."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/medico"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao painel
            </Link>

            <Link
              href="/medico/consultas"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Ver consultas
            </Link>

            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Ajustar valor da consulta
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita bruta paga
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(paidFinancials.gross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {paidPaymentsThisMonth.length} pagamento(s) aprovado(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Líquido a receber
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(paidFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Após comissão da plataforma
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Comissão da plataforma
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(paidFinancials.platformFee)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Comissão média dos pagamentos aprovados
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Saldo disponível para repasse
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(availableForPayout)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pagamentos pagos - repasses realizados
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                A receber em aberto
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(pendingFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {pendingPaymentsThisMonth.length} pagamento(s) pendente(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Projeção líquida do mês
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pago + pendente
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Líquido histórico pago
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(lifetimeFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Todos os pagamentos aprovados
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagamentos no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paymentsCountThisMonth}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pendentes
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {pendingPaymentsThisMonth.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagos
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paidPaymentsThisMonth.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Cancelados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {cancelledPaymentsThisMonth.length}
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Extrato financeiro
                </h2>

                <p className="mt-2 text-[#878787]">
                  Exibindo os 8 pagamentos mais recentes do mês com valor bruto,
                  comissão, líquido e status financeiro.
                </p>
              </div>

              <Link
                href="/medico/consultas"
                className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
              >
                Ver consultas
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentPaymentsThisMonth.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma movimentação financeira neste mês.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando pacientes agendarem consultas, os pagamentos
                    aparecerão aqui.
                  </p>
                </div>
              ) : (
                recentPaymentsThisMonth.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-extrabold text-[#08553F]">
                          {payment.patient.user.name}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#08553F]">
                          Consulta: {formatDate(payment.appointment.date)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${getPaymentStatusClass(
                              payment.status
                            )}`}
                          >
                            {getPaymentStatusLabel(payment.status)}
                          </span>

                          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-[#08553F]">
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
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm font-semibold text-[#878787]">
                          Bruto: {formatCurrency(Number(payment.amount))}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#878787]">
                          Comissão {Number(payment.commissionRate)}%:{" "}
                          {formatCurrency(Number(payment.platformFee))}
                        </p>

                        <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                          Líquido:{" "}
                          {formatCurrency(Number(payment.doctorAmount))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {paymentsThisMonth.length > recentPaymentsThisMonth.length ? (
              <div className="mt-6">
                <Link
                  href="/medico/consultas"
                  className="inline-flex w-full justify-center rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1] sm:w-auto"
                >
                  Ver todos os movimentos financeiros
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}