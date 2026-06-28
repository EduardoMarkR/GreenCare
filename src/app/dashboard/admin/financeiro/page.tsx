import { PaymentMethod, PaymentStatus, Prisma } from "@/generated/prisma";
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
    period?: string;
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


function getMethodLabel(method?: string | null) {
  if (method === "PIX") return "PIX";
  if (method === "CREDIT_CARD") return "Cartão de crédito";
  if (method === "DEBIT_CARD") return "Cartão de débito";
  if (method === "BOLETO") return "Boleto";
  if (method === "BANK_TRANSFER") return "Transferência";
  if (method === "MANUAL") return "Manual";

  return "Não informado";
}

function getPeriodRange(period: string) {
  const now = new Date();

  if (period === "7d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);

    return {
      gte: start,
      lt: now,
    };
  }

  if (period === "30d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);

    return {
      gte: start,
      lt: now,
    };
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

function getExportHref(
  period: string,
  status: string,
  doctorId: string,
  method: string
) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("status", status);
  params.set("doctorId", doctorId);
  params.set("method", method);

  return `/dashboard/admin/financeiro/exportar?${params.toString()}`;
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

  const selectedPeriod = params?.period ?? "month";
  const selectedStatus = params?.status ?? "all";
  const selectedDoctorId = params?.doctorId ?? "all";
  const selectedMethod = params?.method ?? "all";

  const createdAtRange = getPeriodRange(selectedPeriod);

  const where: Prisma.PaymentWhereInput = {
    ...(createdAtRange
      ? {
          createdAt: createdAtRange,
        }
      : {}),
    ...(selectedStatus !== "all"
      ? {
          status: selectedStatus as PaymentStatus,
        }
      : {}),
    ...(selectedDoctorId !== "all"
      ? {
          doctorId: selectedDoctorId,
        }
      : {}),
    ...(selectedMethod !== "all"
      ? {
          method: selectedMethod as PaymentMethod,
        }
      : {}),
  };

  const [
    filteredPayments,
    allPayments,
    allPaidPayments,
    approvedDoctors,
    payouts,
    allPayouts,
  ] = await Promise.all([
    prisma.payment.findMany({
      where,
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

    prisma.payment.findMany(),

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
            ...(createdAtRange
              ? {
                  createdAt: createdAtRange,
                }
              : {}),
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

  const paidPayments = filteredPayments.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingPayments = filteredPayments.filter(
    (payment) => payment.status === "PENDING"
  );

  const cancelledPayments = filteredPayments.filter(
    (payment) => payment.status === "CANCELLED"
  );

  const failedPayments = filteredPayments.filter(
    (payment) => payment.status === "FAILED"
  );

  const paidFinancials = paidPayments.reduce(
    (totals, payment) => ({
      gross: totals.gross + Number(payment.amount),
      platformFee: totals.platformFee + Number(payment.platformFee),
      doctorNet: totals.doctorNet + Number(payment.doctorAmount),
    }),
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const pendingFinancials = pendingPayments.reduce(
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

  const averageTicket =
    paidPayments.length > 0 ? paidFinancials.gross / paidPayments.length : 0;

  const paymentConversionRate =
    filteredPayments.length > 0
      ? (paidPayments.length / filteredPayments.length) * 100
      : 0;

  const platformTakeRate =
    paidFinancials.gross > 0
      ? (paidFinancials.platformFee / paidFinancials.gross) * 100
      : 0;

  const doctorsFinancialRanking = approvedDoctors
    .filter((doctor) =>
      selectedDoctorId === "all" ? true : doctor.id === selectedDoctorId
    )
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

  const recentPayments = filteredPayments.slice(0, 8);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro Enterprise"
          title="Dashboard financeiro da plataforma"
          description="Filtre receitas, pagamentos, médicos, conversão, ticket médio e repasses em uma visão profissional."
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

          <div className="mb-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#08553F]">
              Gestão financeira
            </h2>

    <div className="mt-5 grid gap-3">
      <Link
        href="/dashboard/admin/financeiro/extrato"
        className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
      >
        Extrato financeiro
      </Link>

      <Link
        href="/dashboard/admin/financeiro/graficos"
        className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
      >
        Gráficos financeiros
      </Link>

      <Link
        href={getExportHref(
          selectedPeriod,
          selectedStatus,
          selectedDoctorId,
          selectedMethod
        )}
        className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
      >
        Exportar CSV filtrado
      </Link>
    </div>
  </div>

      <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#08553F]">
          Operações
        </h2>

        <div className="mt-5 grid gap-3">
          <Link
            href="/dashboard/admin/financeiro/repasses"
            className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Repasses médicos
          </Link>

          <Link
            href="/dashboard/admin/financeiro/conciliacao"
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center font-bold text-red-700 transition hover:bg-red-100"
          >
            Central de conciliação
          </Link>

          <Link
            href="/dashboard/admin/consultas"
            className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Gerenciar consultas
          </Link>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#08553F]">
          Administração
        </h2>

        <div className="mt-5 grid gap-3">
          <Link
            href="/dashboard/admin"
            className="rounded-2xl bg-white px-5 py-3 text-center font-bold text-[#08553F] ring-1 ring-[#08553F]/20 transition hover:bg-[#F3EFA1]"
          >
            Voltar ao painel admin
          </Link>

          <Link
            href="/dashboard/admin/medicos"
            className="rounded-2xl bg-white px-5 py-3 text-center font-bold text-[#08553F] ring-1 ring-[#08553F]/20 transition hover:bg-[#F3EFA1]"
          >
            Ver médicos
          </Link>
        </div>
      </div>
    </div>

          <form
            action="/dashboard/admin/financeiro"
            className="mb-8 grid gap-4 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm lg:grid-cols-5"
          >
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
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todo o período</option>
              </select>
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
                <option value="all">Todos os médicos</option>

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

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Aplicar filtros
              </button>

              <Link
                href="/dashboard/admin/financeiro"
                className="rounded-2xl border border-[#08553F]/30 px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
              >
                Limpar
              </Link>
            </div>
          </form>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita bruta paga
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(paidFinancials.gross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {paidPayments.length} pagamento(s) aprovado(s)
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
                Take rate: {formatPercent(platformTakeRate)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita histórica
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(lifetimeFinancials.gross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Total já pago na plataforma
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

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Ticket médio pago
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(averageTicket)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Conversão de pagamentos
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatPercent(paymentConversionRate)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Repasses realizados
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPaidToDoctors)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Total de pagamentos
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {allPayments.length}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Projeção bruta
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

          <div className="mt-6 grid gap-6 md:grid-cols-5">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagamentos filtrados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {filteredPayments.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">Pagos</p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paidPayments.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pendentes
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {pendingPayments.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Cancelados/Falhos
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {cancelledPayments.length + failedPayments.length}
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
                  Top médicos por pagamentos aprovados no período filtrado.
                </p>

                <div className="mt-6 space-y-4">
                  {doctorsFinancialRanking.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum médico com pagamento aprovado neste filtro.
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
                    href="/dashboard/admin/financeiro/repasses"
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
                    Movimentos financeiros de acordo com os filtros aplicados.
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
                {recentPayments.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhum pagamento encontrado com esses filtros.
                    </p>
                  </div>
                ) : (
                  recentPayments.map((payment) => (
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

                            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-[#08553F]">
                              {getMethodLabel(payment.method)}
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