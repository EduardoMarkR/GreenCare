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

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "COMPLETED") return "Concluída";
  if (status === "CANCELLED") return "Cancelada";

  return status;
}

function getStatusClass(status: string) {
  if (status === "COMPLETED") {
    return "bg-[#00CF7B]/15 text-[#08553F]";
  }

  if (status === "CONFIRMED") {
    return "bg-[#F3EFA1] text-[#08553F]";
  }

  if (status === "PENDING") {
    return "bg-white text-[#08553F]";
  }

  return "bg-[#C6C6C6]/30 text-[#878787]";
}

function calculateFinancialValues(price: number, platformFeePercent: number) {
  const platformFee = price * (platformFeePercent / 100);
  const doctorNet = price - platformFee;

  return {
    gross: price,
    platformFee,
    doctorNet,
  };
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

  const consultationPrice = Number(doctor.price);
  const platformFeePercent = Number(doctor.platformFeePercent);
  const consultationFinancials = calculateFinancialValues(
    consultationPrice,
    platformFeePercent
  );

  const appointmentsThisMonth = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const completedAppointmentsThisMonth = appointmentsThisMonth.filter(
    (appointment) => appointment.status === "COMPLETED"
  );

  const receivableAppointmentsThisMonth = appointmentsThisMonth.filter(
    (appointment) =>
      appointment.status === "PENDING" || appointment.status === "CONFIRMED"
  );

  const cancelledAppointmentsThisMonth = appointmentsThisMonth.filter(
    (appointment) => appointment.status === "CANCELLED"
  );

  const completedCount = completedAppointmentsThisMonth.length;
  const receivableCount = receivableAppointmentsThisMonth.length;
  const cancelledCount = cancelledAppointmentsThisMonth.length;

  const completedFinancials = {
    gross: completedCount * consultationFinancials.gross,
    platformFee: completedCount * consultationFinancials.platformFee,
    doctorNet: completedCount * consultationFinancials.doctorNet,
  };

  const receivableFinancials = {
    gross: receivableCount * consultationFinancials.gross,
    platformFee: receivableCount * consultationFinancials.platformFee,
    doctorNet: receivableCount * consultationFinancials.doctorNet,
  };

  const projectedFinancials = {
    gross: completedFinancials.gross + receivableFinancials.gross,
    platformFee: completedFinancials.platformFee + receivableFinancials.platformFee,
    doctorNet: completedFinancials.doctorNet + receivableFinancials.doctorNet,
  };

  const allCompletedAppointmentsCount = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: "COMPLETED",
    },
  });

  const lifetimeFinancials = {
    gross: allCompletedAppointmentsCount * consultationFinancials.gross,
    platformFee:
      allCompletedAppointmentsCount * consultationFinancials.platformFee,
    doctorNet: allCompletedAppointmentsCount * consultationFinancials.doctorNet,
  };

  const recentAppointmentsThisMonth = appointmentsThisMonth.slice(0, 6);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro médico"
          title="Dashboard financeiro profissional"
          description="Acompanhe receita bruta, comissão da plataforma, valor líquido, projeções e movimentações financeiras da sua rotina médica."
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
                Receita bruta realizada
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(completedFinancials.gross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {completedCount} consulta(s) concluída(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Líquido a receber
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(completedFinancials.doctorNet)}
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
                {formatCurrency(completedFinancials.platformFee)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Comissão aplicada: {platformFeePercent}%
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
                Realizado + pendente/confirmado
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor da consulta
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(consultationPrice)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Líquido por consulta:{" "}
                {formatCurrency(consultationFinancials.doctorNet)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                A receber em aberto
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(receivableFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {receivableCount} consulta(s) pendente(s)/confirmada(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Líquido histórico estimado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(lifetimeFinancials.doctorNet)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Todas as consultas concluídas
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Consultas no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {appointmentsThisMonth.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Canceladas no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {cancelledCount}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Comissão aplicada
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {platformFeePercent}%
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Últimos movimentos financeiros
                </h2>

                <p className="mt-2 text-[#878787]">
                  Exibindo os 6 movimentos mais recentes do mês com valor bruto,
                  comissão e líquido.
                </p>
              </div>

              <Link
                href="/medico/consultas?status=COMPLETED"
                className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
              >
                Ver histórico
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentAppointmentsThisMonth.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma movimentação financeira neste mês.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Consultas pendentes, confirmadas, concluídas ou canceladas
                    aparecerão aqui.
                  </p>
                </div>
              ) : (
                recentAppointmentsThisMonth.map((appointment) => {
                  const isCancelled = appointment.status === "CANCELLED";
                  const price = isCancelled ? 0 : consultationPrice;
                  const values = calculateFinancialValues(
                    price,
                    platformFeePercent
                  );

                  return (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {appointment.patient.user.name}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#08553F]">
                            {formatDate(appointment.date)}
                          </p>

                          <span
                            className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-bold ${getStatusClass(
                              appointment.status
                            )}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm font-semibold text-[#878787]">
                            Bruto: {formatCurrency(values.gross)}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#878787]">
                            Comissão {platformFeePercent}%:{" "}
                            {formatCurrency(values.platformFee)}
                          </p>

                          <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                            Líquido: {formatCurrency(values.doctorNet)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {appointmentsThisMonth.length > recentAppointmentsThisMonth.length ? (
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