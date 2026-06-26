import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PaymentStatus, Prisma } from "@/generated/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import FinanceCharts from "./FinanceCharts";

type Props = {
  searchParams?: Promise<{
    period?: string;
    status?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
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

  if (period === "90d") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 90);

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

export default async function AdminFinanceiroGraficosPage({
  searchParams,
}: Props) {
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

  const selectedPeriod = params?.period ?? "30d";
  const selectedStatus = params?.status ?? "all";
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
  };

  const payments = await prisma.payment.findMany({
    where,
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totalGross = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalPlatformFee = payments.reduce(
    (sum, payment) => sum + Number(payment.platformFee),
    0
  );

  const totalDoctorAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const paidPayments = payments.filter((payment) => payment.status === "PAID");
  const conversionRate =
    payments.length > 0 ? (paidPayments.length / payments.length) * 100 : 0;
  const averageTicket =
    paidPayments.length > 0
      ? paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) /
        paidPayments.length
      : 0;

  const dailyMap = new Map<
    string,
    {
      date: string;
      receita: number;
      comissao: number;
      medico: number;
    }
  >();

  payments.forEach((payment) => {
    const key = formatShortDate(payment.createdAt);
    const current = dailyMap.get(key) ?? {
      date: key,
      receita: 0,
      comissao: 0,
      medico: 0,
    };

    current.receita += Number(payment.amount);
    current.comissao += Number(payment.platformFee);
    current.medico += Number(payment.doctorAmount);

    dailyMap.set(key, current);
  });

  const statusMap = new Map<string, number>();

  payments.forEach((payment) => {
    const label = getPaymentStatusLabel(payment.status);
    statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
  });

  const methodMap = new Map<string, number>();

  payments.forEach((payment) => {
    const label = getMethodLabel(payment.method);
    methodMap.set(label, (methodMap.get(label) ?? 0) + 1);
  });

  const doctorMap = new Map<
    string,
    {
      name: string;
      receita: number;
      comissao: number;
    }
  >();

  payments.forEach((payment) => {
    const doctorName = payment.doctor.user.name;
    const current = doctorMap.get(payment.doctorId) ?? {
      name: doctorName,
      receita: 0,
      comissao: 0,
    };

    current.receita += Number(payment.amount);
    current.comissao += Number(payment.platformFee);

    doctorMap.set(payment.doctorId, current);
  });

  const dailyRevenue = Array.from(dailyMap.values());
  const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));
  const methodData = Array.from(methodMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));
  const doctorRevenue = Array.from(doctorMap.values())
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 10);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Gráficos financeiros"
          title="Indicadores visuais do financeiro"
          description="Acompanhe receita, comissão, métodos de pagamento, conversão e desempenho financeiro por médico."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao financeiro
            </Link>

            <Link
              href="/dashboard/admin/financeiro/extrato"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Ver extrato
            </Link>
          </div>

          <form
            action="/dashboard/admin/financeiro/graficos"
            className="mb-8 grid gap-4 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm md:grid-cols-3"
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
                <option value="90d">Últimos 90 dias</option>
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

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Atualizar gráficos
              </button>

              <Link
                href="/dashboard/admin/financeiro/graficos"
                className="rounded-2xl border border-[#08553F]/30 px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
              >
                Limpar
              </Link>
            </div>
          </form>

          <div className="mb-8 grid gap-6 md:grid-cols-5">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita bruta
              </p>

              <p className="mt-3 text-2xl font-extrabold text-[#08553F]">
                {formatCurrency(totalGross)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">Comissão</p>

              <p className="mt-3 text-2xl font-extrabold text-white">
                {formatCurrency(totalPlatformFee)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor médico
              </p>

              <p className="mt-3 text-2xl font-extrabold text-[#08553F]">
                {formatCurrency(totalDoctorAmount)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Ticket médio
              </p>

              <p className="mt-3 text-2xl font-extrabold text-[#08553F]">
                {formatCurrency(averageTicket)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">Conversão</p>

              <p className="mt-3 text-2xl font-extrabold text-[#08553F]">
                {conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Nenhum pagamento encontrado para gerar gráficos.
              </p>

              <p className="mt-2 text-[#878787]">
                Ajuste os filtros ou aguarde novos pagamentos.
              </p>
            </div>
          ) : (
            <FinanceCharts
              dailyRevenue={dailyRevenue}
              statusData={statusData}
              methodData={methodData}
              doctorRevenue={doctorRevenue}
            />
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}