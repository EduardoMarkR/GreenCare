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
  if (status === "FAILED") return "bg-red-100 text-red-700";
  if (status === "REFUNDED") return "bg-blue-100 text-blue-700";
  if (status === "CANCELLED") return "bg-[#C6C6C6]/30 text-[#878787]";

  return "bg-white text-[#08553F]";
}

export default async function FinanceiroMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "DOCTOR") redirect("/");

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

  const [paymentsThisMonth, allPaidPayments, payouts] = await Promise.all([
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
      take: 8,
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
      include: {
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const paidPaymentsThisMonth = paymentsThisMonth.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingPaymentsThisMonth = paymentsThisMonth.filter(
    (payment) => payment.status === "PENDING"
  );

  const monthFinancials = paidPaymentsThisMonth.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    {
      gross: 0,
      platformFee: 0,
      doctorNet: 0,
    }
  );

  const lifetimeDoctorNet = allPaidPayments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const totalPayouts = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const availableForPayout = Math.max(lifetimeDoctorNet - totalPayouts, 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro médico"
          title="Meu financeiro"
          description="Acompanhe seus recebimentos, repasses e pagamentos recentes."
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
              Perfil profissional
            </Link>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Líquido do mês
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(monthFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {paidPaymentsThisMonth.length} pagamento(s) pago(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Disponível para repasse
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(availableForPayout)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Pagamentos pagos ainda não repassados
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Total já repassado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPayouts)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {payouts.length} repasse(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pendentes no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {pendingPaymentsThisMonth.length}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pagamentos aguardando confirmação
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Repasses recentes
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Últimos fechamentos realizados pelo financeiro.
                  </p>
                </div>
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
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {formatDate(payout.startDate)} até{" "}
                            {formatDate(payout.endDate)}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Criado em {formatDate(payout.createdAt)}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            {payout.payments.length} pagamento(s) vinculado(s)
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-2xl font-extrabold text-[#08553F]">
                            {formatCurrency(Number(payout.amount))}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                            <Link
                              href={`/dashboard/medico/financeiro/repasses/${payout.id}`}
                              className="rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                            >
                              Ver detalhes
                            </Link>

                            <Link
                              href={`/dashboard/medico/financeiro/repasses/${payout.id}/pdf`}
                              className="rounded-xl border border-[#08553F]/30 bg-white px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                            >
                              PDF
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Pagamentos recentes
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Movimentações financeiras deste mês.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {paymentsThisMonth.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhum pagamento neste mês.
                    </p>
                  </div>
                ) : (
                  paymentsThisMonth.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {payment.patient.user.name}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Consulta em {formatDate(payment.appointment.date)}
                          </p>

                          <span
                            className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-bold ${getPaymentStatusClass(
                              payment.status
                            )}`}
                          >
                            {getPaymentStatusLabel(payment.status)}
                          </span>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm font-semibold text-[#878787]">
                            Bruto: {formatCurrency(Number(payment.amount))}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#878787]">
                            Comissão:{" "}
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
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}