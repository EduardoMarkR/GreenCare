import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { cancelPayment, markPaymentAsPaid } from "./actions";

type Props = {
  searchParams?: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
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

  return "bg-white text-[#08553F]";
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Consulta pendente";
  if (status === "CONFIRMED") return "Consulta confirmada";
  if (status === "COMPLETED") return "Consulta concluída";
  if (status === "CANCELLED") return "Consulta cancelada";

  return status;
}

export default async function FinanceiroAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "ADMIN") {
    redirect("/");
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
    approvedDoctors,
    payouts,
    allPayouts,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
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
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
      },
    }),
    prisma.doctor.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      include: {
        user: true,
        payments: {
          where: {
            status: "PAID",
            createdAt: {
              gte: startOfMonth,
              lt: startOfNextMonth,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.doctorPayout.findMany({
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
    prisma.doctorPayout.findMany(),
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

  const totalPaidToDoctors = allPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const pendingDoctorPayout = Math.max(
    lifetimeFinancials.doctorNet - totalPaidToDoctors,
    0
  );

  const doctorsFinancialRanking = approvedDoctors
    .map((doctor) => {
      const gross = doctor.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const platformFee = doctor.payments.reduce(
        (sum, payment) => sum + Number(payment.platformFee),
        0
      );

      const doctorNet = doctor.payments.reduce(
        (sum, payment) => sum + Number(payment.doctorAmount),
        0
      );

      return {
        id: doctor.id,
        name: doctor.user.name,
        specialty: doctor.specialty,
        completedCount: doctor.payments.length,
        gross,
        platformFee,
        doctorNet,
        feePercent: Number(doctor.platformFeePercent),
      };
    })
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 5);

  const recentPaymentsThisMonth = paymentsThisMonth.slice(0, 8);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro admin"
          title="Dashboard financeiro da plataforma"
          description="Acompanhe pagamentos, comissão da plataforma, repasses médicos e liberação financeira das consultas."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {params?.sucesso ? (
            <div className="mb-6 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-5 font-bold text-[#08553F]">
              {params.sucesso}
            </div>
          ) : null}

          {params?.erro ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {params.erro}
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao painel admin
            </Link>

            <Link
              href="/dashboard/admin/repasses"
              className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Gerenciar repasses
            </Link>

            <Link
              href="/dashboard/admin/consultas"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Gerenciar consultas
            </Link>

            <Link
              href="/dashboard/admin/medicos"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Ver médicos
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
                Comissão da plataforma
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(paidFinancials.platformFee)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Receita líquida da CannaDoctor
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Repasses realizados
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPaidToDoctors)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Total já pago aos médicos
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Saldo pendente de repasse
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(pendingDoctorPayout)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Líquido médico pago - repasses
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Projeção bruta do mês
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.gross)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Comissão projetada
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.platformFee)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Repasse médico projetado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.doctorNet)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagamentos no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paymentsThisMonth.length}
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
                Cancelados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {cancelledPaymentsThisMonth.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Médicos aprovados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {approvedDoctors.length}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Ranking financeiro médico
                </h2>

                <p className="mt-2 text-[#878787]">
                  Top médicos por pagamentos aprovados neste mês.
                </p>

                <div className="mt-6 space-y-4">
                  {doctorsFinancialRanking.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum médico com pagamento aprovado neste mês.
                      </p>
                    </div>
                  ) : (
                    doctorsFinancialRanking.map((doctor, index) => (
                      <div
                        key={doctor.id}
                        className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-[#00CF7B]">
                              #{index + 1}
                            </p>

                            <p className="mt-1 font-extrabold text-[#08553F]">
                              {doctor.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              {doctor.specialty}
                            </p>

                            <p className="mt-2 text-xs font-bold text-[#08553F]">
                              {doctor.completedCount} pagamento(s) • Comissão{" "}
                              {doctor.feePercent}%
                            </p>

                            <p className="mt-2 text-xs text-[#878787]">
                              Plataforma: {formatCurrency(doctor.platformFee)} •
                              Médico: {formatCurrency(doctor.doctorNet)}
                            </p>
                          </div>

                          <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                            {formatCurrency(doctor.gross)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Repasses recentes
                    </h2>

                    <p className="mt-2 text-[#878787]">
                      Últimos repasses registrados aos médicos.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/admin/repasses"
                    className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                  >
                    Ver repasses
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {payouts.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum repasse registrado ainda.
                      </p>
                    </div>
                  ) : (
                    payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-extrabold text-[#08553F]">
                              Dr(a). {payout.doctor.user.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              {formatDate(payout.startDate)} até{" "}
                              {formatDate(payout.endDate)}
                            </p>
                          </div>

                          <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                            {formatCurrency(Number(payout.amount))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Pagamentos recentes
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Movimentos financeiros reais criados pela tabela Payment.
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/consultas"
                  className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Ver consultas
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {recentPaymentsThisMonth.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhum pagamento criado neste mês.
                    </p>
                  </div>
                ) : (
                  recentPaymentsThisMonth.map((payment) => (
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
                            Paciente: {payment.patient.user.name}
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
                            Médico:{" "}
                            {formatCurrency(Number(payment.doctorAmount))}
                          </p>

                          {payment.status === "PENDING" ? (
                            <div className="mt-4 flex flex-col gap-2">
                              <form action={markPaymentAsPaid}>
                                <input
                                  type="hidden"
                                  name="paymentId"
                                  value={payment.id}
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-2xl bg-[#00CF7B] px-5 py-3 text-sm font-extrabold text-[#08553F] transition hover:bg-[#F3EFA1]"
                                >
                                  Marcar como pago
                                </button>
                              </form>

                              <form action={cancelPayment}>
                                <input
                                  type="hidden"
                                  name="paymentId"
                                  value={payment.id}
                                />

                                <button
                                  type="submit"
                                  className="w-full rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-50"
                                >
                                  Cancelar pagamento
                                </button>
                              </form>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}