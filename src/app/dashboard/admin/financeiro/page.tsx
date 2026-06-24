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
  if (status === "COMPLETED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "PENDING") return "bg-white text-[#08553F]";

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

export default async function FinanceiroAdminPage() {
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

  const [appointmentsThisMonth, allCompletedAppointments, approvedDoctors, payouts] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          date: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        include: {
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
          date: "desc",
        },
      }),
      prisma.appointment.findMany({
        where: {
          status: "COMPLETED",
        },
        include: {
          doctor: true,
        },
      }),
      prisma.doctor.findMany({
        where: {
          approvalStatus: "APPROVED",
        },
        include: {
          user: true,
          appointments: {
            where: {
              status: "COMPLETED",
              date: {
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
    ]);

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

  const completedFinancials = completedAppointmentsThisMonth.reduce(
    (totals, appointment) => {
      const values = calculateFinancialValues(
        Number(appointment.doctor.price),
        Number(appointment.doctor.platformFeePercent)
      );

      return {
        gross: totals.gross + values.gross,
        platformFee: totals.platformFee + values.platformFee,
        doctorNet: totals.doctorNet + values.doctorNet,
      };
    },
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const receivableFinancials = receivableAppointmentsThisMonth.reduce(
    (totals, appointment) => {
      const values = calculateFinancialValues(
        Number(appointment.doctor.price),
        Number(appointment.doctor.platformFeePercent)
      );

      return {
        gross: totals.gross + values.gross,
        platformFee: totals.platformFee + values.platformFee,
        doctorNet: totals.doctorNet + values.doctorNet,
      };
    },
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const projectedFinancials = {
    gross: completedFinancials.gross + receivableFinancials.gross,
    platformFee:
      completedFinancials.platformFee + receivableFinancials.platformFee,
    doctorNet: completedFinancials.doctorNet + receivableFinancials.doctorNet,
  };

  const lifetimeFinancials = allCompletedAppointments.reduce(
    (totals, appointment) => {
      const values = calculateFinancialValues(
        Number(appointment.doctor.price),
        Number(appointment.doctor.platformFeePercent)
      );

      return {
        gross: totals.gross + values.gross,
        platformFee: totals.platformFee + values.platformFee,
        doctorNet: totals.doctorNet + values.doctorNet,
      };
    },
    { gross: 0, platformFee: 0, doctorNet: 0 }
  );

  const allPayouts = await prisma.doctorPayout.findMany();

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
      const completedCount = doctor.appointments.length;
      const price = Number(doctor.price);
      const feePercent = Number(doctor.platformFeePercent);
      const gross = completedCount * price;
      const platformFee = gross * (feePercent / 100);
      const doctorNet = gross - platformFee;

      return {
        id: doctor.id,
        name: doctor.user.name,
        specialty: doctor.specialty,
        completedCount,
        gross,
        platformFee,
        doctorNet,
        feePercent,
      };
    })
    .sort((a, b) => b.gross - a.gross)
    .slice(0, 5);

  const recentAppointmentsThisMonth = appointmentsThisMonth.slice(0, 6);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro admin"
          title="Dashboard financeiro da plataforma"
          description="Acompanhe receita bruta, comissão da plataforma, repasses médicos, saldo pendente e desempenho financeiro dos profissionais."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
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

            <Link
              href="/dashboard/admin/financeiro/exportar"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Exportar CSV
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
                {completedAppointmentsThisMonth.length} consulta(s) concluída(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Comissão da plataforma
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(completedFinancials.platformFee)}
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
                Líquido médico histórico - repasses
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
                Comissão projetada do mês
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.platformFee)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Repasse projetado aos médicos
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(projectedFinancials.doctorNet)}
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
                {cancelledAppointmentsThisMonth.length}
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
                  Top médicos por receita bruta concluída neste mês.
                </p>

                <div className="mt-6 space-y-4">
                  {doctorsFinancialRanking.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum médico com faturamento neste mês.
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
                              {doctor.completedCount} consulta(s) • Comissão{" "}
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
                    Últimos movimentos financeiros
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Exibindo os 6 movimentos mais recentes do mês.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/admin/financeiro/exportar"
                    className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                  >
                    Exportar CSV
                  </Link>

                  <Link
                    href="/dashboard/admin/consultas"
                    className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Ver todas
                  </Link>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {recentAppointmentsThisMonth.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhuma movimentação financeira neste mês.
                    </p>
                  </div>
                ) : (
                  recentAppointmentsThisMonth.map((appointment) => {
                    const isCancelled = appointment.status === "CANCELLED";
                    const price = isCancelled
                      ? 0
                      : Number(appointment.doctor.price);
                    const feePercent = Number(
                      appointment.doctor.platformFeePercent
                    );
                    const values = calculateFinancialValues(price, feePercent);

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-extrabold text-[#08553F]">
                              Dr(a). {appointment.doctor.user.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              Paciente: {appointment.patient.user.name}
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
                              Comissão {feePercent}%:{" "}
                              {formatCurrency(values.platformFee)}
                            </p>

                            <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                              Médico: {formatCurrency(values.doctorNet)}
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
                    href="/dashboard/admin/consultas"
                    className="inline-flex w-full justify-center rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1] sm:w-auto"
                  >
                    Ver todos os movimentos financeiros
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}