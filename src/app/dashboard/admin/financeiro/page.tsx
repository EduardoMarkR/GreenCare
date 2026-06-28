import type { ReactNode } from "react";
import { PaymentMethod, PaymentStatus, Prisma } from "@/generated/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams?: Promise<{
    erro?: string;
    sucesso?: string;
    period?: string;
    competence?: string;
    status?: string;
    doctorId?: string;
    method?: string;
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

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function getCurrentCompetence() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getCompetenceLabel(competence: string) {
  const [year, month] = competence.split("-").map(Number);

  if (!year || !month) return "Competência inválida";

  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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

function getMethodLabel(method?: string | null) {
  if (method === "PIX") return "PIX";
  if (method === "CREDIT_CARD") return "Cartão de crédito";
  if (method === "DEBIT_CARD") return "Cartão de débito";
  if (method === "BOLETO") return "Boleto";
  if (method === "BANK_TRANSFER") return "Transferência";
  if (method === "MANUAL") return "Manual";

  return "Não informado";
}

function getPeriodRange(period: string, competence: string) {
  const now = new Date();

  if (period === "competence") {
    const [year, month] = competence.split("-").map(Number);

    if (!year || !month) return undefined;

    const startOfCompetence = new Date(Date.UTC(year, month - 1, 1));
    const startOfNextCompetence = new Date(Date.UTC(year, month, 1));

    return {
      gte: startOfCompetence,
      lt: startOfNextCompetence,
    };
  }

  if (period === "7d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);
    return { gte: start, lt: now };
  }

  if (period === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);
    return { gte: start, lt: now };
  }

  if (period === "all") {
    return undefined;
  }

  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  return {
    gte: startOfMonth,
    lt: startOfNextMonth,
  };
}

function getExportHref({
  period,
  competence,
  status,
  doctorId,
  method,
}: {
  period: string;
  competence: string;
  status: string;
  doctorId: string;
  method: string;
}) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("competence", competence);
  params.set("status", status);
  params.set("doctorId", doctorId);
  params.set("method", method);

  return `/dashboard/admin/financeiro/exportar?${params.toString()}`;
}

function MetricCard({
  icon,
  title,
  value,
  helper,
  dark = false,
}: {
  icon: string;
  title: string;
  value: string;
  helper: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[2rem] p-6 shadow-sm ${
        dark ? "bg-[#08553F] text-white" : "bg-white text-[#08553F]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-semibold ${
              dark ? "text-white/70" : "text-[#878787]"
            }`}
          >
            {title}
          </p>

          <p className="mt-3 text-3xl font-extrabold md:text-4xl">{value}</p>

          <p
            className={`mt-2 text-sm ${
              dark ? "text-white/70" : "text-[#878787]"
            }`}
          >
            {helper}
          </p>
        </div>

        <span
          className={`grid size-12 place-items-center rounded-2xl text-2xl ${
            dark ? "bg-white/10" : "bg-[#F7F4E7]"
          }`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function ModuleCard({
  icon,
  title,
  href,
  variant = "default",
}: {
  icon: string;
  title: string;
  href: string;
  variant?: "default" | "dark" | "warning" | "accent";
}) {
  const className =
    variant === "dark"
      ? "bg-[#08553F] text-white hover:bg-[#00CF7B] hover:text-[#08553F]"
      : variant === "warning"
        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        : variant === "accent"
          ? "bg-[#F3EFA1] text-[#08553F] hover:bg-[#00CF7B]"
          : "border border-[#C6C6C6]/60 bg-white text-[#08553F] hover:bg-[#F7F4E7]";

  return (
    <Link
      href={href}
      className={`rounded-[1.5rem] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <span className="text-3xl">{icon}</span>
      <p className="mt-3 font-extrabold">{title}</p>
    </Link>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-extrabold text-[#08553F]">{title}</h2>
        {action}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function FinanceiroAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "ADMIN") redirect("/");

  const selectedPeriod = params?.period ?? "month";
  const selectedCompetence = params?.competence ?? getCurrentCompetence();
  const selectedStatus = params?.status ?? "all";
  const selectedDoctorId = params?.doctorId ?? "all";
  const selectedMethod = params?.method ?? "all";

  const createdAtRange = getPeriodRange(selectedPeriod, selectedCompetence);

  const where: Prisma.PaymentWhereInput = {
    ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    ...(selectedStatus !== "all"
      ? { status: selectedStatus as PaymentStatus }
      : {}),
    ...(selectedDoctorId !== "all" ? { doctorId: selectedDoctorId } : {}),
    ...(selectedMethod !== "all"
      ? { method: selectedMethod as PaymentMethod }
      : {}),
  };

  const [
    filteredPayments,
    allPaidPayments,
    approvedDoctors,
    allPayouts,
    paidWithoutPayoutCount,
    paidWithoutMeetCount,
    payoutsWithoutPaymentsCount,
  ] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        appointment: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),

    prisma.payment.findMany({
      where: { status: "PAID" },
    }),

    prisma.doctor.findMany({
      where: { approvalStatus: "APPROVED" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),

    prisma.doctorPayout.findMany(),

    prisma.payment.count({
      where: {
        status: "PAID",
        payoutId: null,
      },
    }),

    prisma.payment.count({
      where: {
        status: "PAID",
        appointment: {
          meetingUrl: null,
        },
      },
    }),

    prisma.doctorPayout.count({
      where: {
        payments: {
          none: {},
        },
      },
    }),
  ]);

  const paidPayments = filteredPayments.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingPayments = filteredPayments.filter(
    (payment) => payment.status === "PENDING"
  );

  const paidFinancials = paidPayments.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

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

  const averageTicket =
    paidPayments.length > 0 ? paidFinancials.gross / paidPayments.length : 0;

  const paymentConversionRate =
    filteredPayments.length > 0
      ? (paidPayments.length / filteredPayments.length) * 100
      : 0;

  const totalConciliationAlerts =
    paidWithoutPayoutCount + paidWithoutMeetCount + payoutsWithoutPaymentsCount;

  const activePeriodLabel =
    selectedPeriod === "competence"
      ? `Competência: ${getCompetenceLabel(selectedCompetence)}`
      : selectedPeriod === "7d"
        ? "Últimos 7 dias"
        : selectedPeriod === "30d"
          ? "Últimos 30 dias"
          : selectedPeriod === "all"
            ? "Todo o período"
            : "Mês atual";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro Enterprise"
          title="Painel financeiro"
          description="Indicadores, filtros e módulos financeiros do CannaDoctor."
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

          <div className="mb-8 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Módulos financeiros
                </h2>

                <p className="mt-2 text-sm font-semibold text-[#878787]">
                  Filtro ativo: {activePeriodLabel}
                </p>
              </div>

              <Link
                href="/dashboard/admin"
                className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Voltar ao admin
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <ModuleCard
                icon="📄"
                title="Extrato"
                href="/dashboard/admin/financeiro/extrato"
                variant="dark"
              />

              <ModuleCard
                icon="📊"
                title="Gráficos"
                href="/dashboard/admin/financeiro/graficos"
                variant="accent"
              />

              <ModuleCard
                icon="🏦"
                title="Repasses"
                href="/dashboard/admin/financeiro/repasses"
              />

              <ModuleCard
                icon="⚠️"
                title="Conciliação"
                href="/dashboard/admin/financeiro/conciliacao"
                variant="warning"
              />

              <ModuleCard
                icon="📦"
                title="Exportar CSV"
                href={getExportHref({
                  period: selectedPeriod,
                  competence: selectedCompetence,
                  status: selectedStatus,
                  doctorId: selectedDoctorId,
                  method: selectedMethod,
                })}
              />

              <ModuleCard
                icon="📅"
                title="Consultas"
                href="/dashboard/admin/consultas"
              />
            </div>
          </div>

          <form
            action="/dashboard/admin/financeiro"
            className="mb-8 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-extrabold text-[#08553F]">
                Filtros
              </h2>

              <Link
                href="/dashboard/admin/financeiro"
                className="rounded-2xl border border-[#08553F]/30 px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
              >
                Limpar filtros
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-6">
              <div>
                <label
                  htmlFor="period"
                  className="text-sm font-bold text-[#08553F]"
                >
                  Período
                </label>

                <select
                  id="period"
                  name="period"
                  defaultValue={selectedPeriod}
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none"
                >
                  <option value="month">Mês atual</option>
                  <option value="competence">Competência</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="all">Todo o período</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="competence"
                  className="text-sm font-bold text-[#08553F]"
                >
                  Competência
                </label>

                <input
                  id="competence"
                  type="month"
                  name="competence"
                  defaultValue={selectedCompetence}
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="text-sm font-bold text-[#08553F]"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue={selectedStatus}
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="PAID">Pagos</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="CANCELLED">Cancelados</option>
                  <option value="FAILED">Falhos</option>
                  <option value="REFUNDED">Reembolsados</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="doctorId"
                  className="text-sm font-bold text-[#08553F]"
                >
                  Médico
                </label>

                <select
                  id="doctorId"
                  name="doctorId"
                  defaultValue={selectedDoctorId}
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none"
                >
                  <option value="all">Todos</option>

                  {approvedDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="method"
                  className="text-sm font-bold text-[#08553F]"
                >
                  Método
                </label>

                <select
                  id="method"
                  name="method"
                  defaultValue={selectedMethod}
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão de crédito</option>
                  <option value="DEBIT_CARD">Cartão de débito</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="BANK_TRANSFER">Transferência</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </form>

          <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="💰"
              title="Receita paga"
              value={formatCurrency(paidFinancials.gross)}
              helper={`${paidPayments.length} pagamento(s) no filtro`}
            />

            <MetricCard
              icon="🌿"
              title="Comissão"
              value={formatCurrency(paidFinancials.platformFee)}
              helper="Receita da plataforma"
              dark
            />

            <MetricCard
              icon="🎯"
              title="Ticket médio"
              value={formatCurrency(averageTicket)}
              helper="Pagamentos pagos"
            />

            <MetricCard
              icon="📈"
              title="Conversão"
              value={formatPercent(paymentConversionRate)}
              helper="Pagos sobre filtrados"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionCard
              title="Saúde financeira"
              action={
                <Link
                  href="/dashboard/admin/financeiro/conciliacao"
                  className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                >
                  Abrir conciliação
                </Link>
              }
            >
              <div className="grid gap-4">
                <Link
                  href="/dashboard/admin/financeiro/repasses"
                  className="rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-extrabold text-[#08553F]">
                      Saldo pendente de repasse
                    </p>

                    <p className="text-right text-xl font-extrabold text-[#08553F]">
                      {formatCurrency(pendingDoctorPayout)}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/financeiro/conciliacao"
                  className="rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-extrabold text-[#08553F]">
                      Alertas de conciliação
                    </p>

                    <p className="text-3xl font-extrabold text-[#08553F]">
                      {totalConciliationAlerts}
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/financeiro/extrato?status=PENDING"
                  className="rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-extrabold text-[#08553F]">
                      Pagamentos pendentes
                    </p>

                    <p className="text-3xl font-extrabold text-[#08553F]">
                      {pendingPayments.length}
                    </p>
                  </div>
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              title="Pagamentos recentes"
              action={
                <Link
                  href="/dashboard/admin/financeiro/extrato"
                  className="rounded-2xl bg-[#08553F] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Ver extrato
                </Link>
              }
            >
              <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhum pagamento encontrado com esses filtros.
                    </p>
                  </div>
                ) : (
                  filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {payment.patient.user.name}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Dr(a). {payment.doctor.user.name} •{" "}
                            {formatDate(payment.appointment.date)}
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
                              {getMethodLabel(payment.method)}
                            </span>
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xl font-extrabold text-[#08553F]">
                            {formatCurrency(Number(payment.amount))}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Comissão:{" "}
                            {formatCurrency(Number(payment.platformFee))}
                          </p>

                          <Link
                            href={`/dashboard/admin/financeiro/${payment.id}`}
                            className="mt-4 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#08553F] ring-1 ring-[#08553F]/20 transition hover:bg-[#F3EFA1]"
                          >
                            Ver pagamento
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}