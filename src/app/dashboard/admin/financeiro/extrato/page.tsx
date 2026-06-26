import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PaymentStatus, Prisma } from "@/generated/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams?: Promise<{
    period?: string;
    status?: string;
    doctorId?: string;
    q?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
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

function getExportHref(period: string, status: string, doctorId: string) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("status", status);
  params.set("doctorId", doctorId);

  return `/dashboard/admin/financeiro/exportar?${params.toString()}`;
}

export default async function AdminFinanceiroExtratoPage({
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

  const selectedPeriod = params?.period ?? "month";
  const selectedStatus = params?.status ?? "all";
  const selectedDoctorId = params?.doctorId ?? "all";
  const search = params?.q?.trim() ?? "";

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
    ...(search
      ? {
          OR: [
            {
              patient: {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              patient: {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              doctor: {
                user: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              doctor: {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              id: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              gatewayPaymentId: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [payments, doctors] = await Promise.all([
    prisma.payment.findMany({
      where,
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
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),

    prisma.doctor.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
  ]);

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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Extrato financeiro"
          title="Extrato financeiro detalhado"
          description="Consulte pagamentos, pacientes, médicos, status, gateway, comissões e valores repassáveis em uma visão operacional completa."
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
              href={getExportHref(
                selectedPeriod,
                selectedStatus,
                selectedDoctorId
              )}
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Exportar CSV filtrado
            </Link>
          </div>

          <form
            action="/dashboard/admin/financeiro/extrato"
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

                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="q" className="text-sm font-bold text-[#08553F]">
                Busca
              </label>

              <input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Paciente, médico ou ID"
                className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 font-semibold text-[#08553F] outline-none placeholder:text-[#878787]"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Filtrar
              </button>

              <Link
                href="/dashboard/admin/financeiro/extrato"
                className="rounded-2xl border border-[#08553F]/30 px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
              >
                Limpar
              </Link>
            </div>
          </form>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Total filtrado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalGross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {payments.length} pagamento(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Comissão filtrada
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(totalPlatformFee)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Receita da plataforma
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor médico filtrado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalDoctorAmount)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Valor bruto médico
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
            <div className="border-b border-[#C6C6C6]/60 p-6">
              <h2 className="text-2xl font-extrabold text-[#08553F]">
                Lançamentos financeiros
              </h2>

              <p className="mt-2 text-[#878787]">
                Exibindo até 100 registros mais recentes com os filtros
                aplicados.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1200px] w-full border-collapse text-left">
                <thead className="bg-[#F7F4E7] text-sm text-[#08553F]">
                  <tr>
                    <th className="px-5 py-4 font-extrabold">Data</th>
                    <th className="px-5 py-4 font-extrabold">Paciente</th>
                    <th className="px-5 py-4 font-extrabold">Médico</th>
                    <th className="px-5 py-4 font-extrabold">Consulta</th>
                    <th className="px-5 py-4 font-extrabold">Status</th>
                    <th className="px-5 py-4 font-extrabold">Método</th>
                    <th className="px-5 py-4 font-extrabold">Bruto</th>
                    <th className="px-5 py-4 font-extrabold">Comissão</th>
                    <th className="px-5 py-4 font-extrabold">Médico</th>
                    <th className="px-5 py-4 font-extrabold">Gateway</th>
                    <th className="px-5 py-4 font-extrabold">ID</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#C6C6C6]/50">
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-5 py-10 text-center font-bold text-[#878787]"
                      >
                        Nenhum pagamento encontrado com esses filtros.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="align-top">
                        <td className="px-5 py-4 text-sm text-[#878787]">
                          <p className="font-bold text-[#08553F]">
                            {formatDate(payment.createdAt)}
                          </p>

                          <p className="mt-1">
                            {formatDateTime(payment.createdAt)}
                          </p>

                          {payment.paidAt ? (
                            <p className="mt-2 text-xs">
                              Pago: {formatDate(payment.paidAt)}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-[#08553F]">
                            {payment.patient.user.name}
                          </p>

                          <p className="mt-1 text-xs text-[#878787]">
                            {payment.patient.user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-[#08553F]">
                            {payment.doctor.user.name}
                          </p>

                          <p className="mt-1 text-xs text-[#878787]">
                            {payment.doctor.specialty}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#878787]">
                          <p className="font-bold text-[#08553F]">
                            {formatDate(payment.appointment.date)}
                          </p>

                          <p className="mt-1">
                            {payment.appointment.availability?.startTime ??
                              "Horário não informado"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${getPaymentStatusClass(
                              payment.status
                            )}`}
                          >
                            {getPaymentStatusLabel(payment.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-[#08553F]">
                          {getMethodLabel(payment.method)}
                        </td>

                        <td className="px-5 py-4 text-sm font-extrabold text-[#08553F]">
                          {formatCurrency(Number(payment.amount))}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#878787]">
                          <p className="font-bold text-[#08553F]">
                            {formatCurrency(Number(payment.platformFee))}
                          </p>

                          <p className="mt-1">
                            {Number(payment.commissionRate)}%
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm font-extrabold text-[#08553F]">
                          {formatCurrency(Number(payment.doctorAmount))}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#878787]">
                          <p className="font-bold text-[#08553F]">
                            {payment.gateway ?? "Interno"}
                          </p>

                          {payment.gatewayPaymentId ? (
                            <p className="mt-1 max-w-[180px] truncate text-xs">
                              {payment.gatewayPaymentId}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[180px] truncate rounded-xl bg-[#F7F4E7] px-3 py-2 text-xs font-bold text-[#08553F]">
                            {payment.id}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}