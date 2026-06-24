import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import SubmitButton from "@/components/SubmitButton";
import { prisma } from "@/lib/prisma";
import { createDoctorPayout } from "./actions";

type AdminRepassesPageProps = {
  searchParams?: Promise<{
    success?: string;
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

function getSuccessMessage(success?: string) {
  if (success === "repasse-criado") {
    return "Repasse médico registrado com sucesso.";
  }

  return null;
}

export default async function AdminRepassesPage({
  searchParams,
}: AdminRepassesPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const successMessage = getSuccessMessage(params?.success);

  const [approvedDoctors, payouts] = await Promise.all([
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
    }),
  ]);

  const recentPayouts = payouts.slice(0, 20);

  const totalPayoutAmount = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const averagePayout =
    payouts.length > 0 ? totalPayoutAmount / payouts.length : 0;

  const paidDoctorIds = new Set(payouts.map((payout) => payout.doctorId));

  const doctorRanking = approvedDoctors
    .map((doctor) => {
      const doctorPayouts = payouts.filter(
        (payout) => payout.doctorId === doctor.id
      );

      const total = doctorPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount),
        0
      );

      return {
        id: doctor.id,
        name: doctor.user.name,
        specialty: doctor.specialty,
        total,
        count: doctorPayouts.length,
      };
    })
    .filter((doctor) => doctor.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro admin"
          title="Gestão de repasses médicos"
          description="Registre pagamentos feitos aos médicos, acompanhe valores repassados e monitore o histórico financeiro da operação."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel admin"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {successMessage ? (
            <div className="mb-8 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-4 text-sm font-bold text-[#08553F] shadow-sm">
              ✅ {successMessage}
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
              href="/dashboard/admin/financeiro"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Ver financeiro
            </Link>

            <Link
              href="/dashboard/admin/medicos"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Ver médicos
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Total repassado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPayoutAmount)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Soma de todos os repasses registrados
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Repasses registrados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-white">
                {payouts.length}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Histórico total da plataforma
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Médicos já pagos
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paidDoctorIds.size}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                De {approvedDoctors.length} médicos aprovados
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Média por repasse
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(averagePayout)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Ticket médio de pagamento médico
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Registrar novo repasse
                </h2>

                <p className="mt-2 text-[#878787]">
                  Informe o médico, período de referência e valor pago.
                </p>

                <form action={createDoctorPayout} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-[#08553F]">
                      Médico
                    </label>

                    <select
                      name="doctorId"
                      required
                      className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    >
                      <option value="">Selecione um médico</option>

                      {approvedDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.user.name} — {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#08553F]">
                      Valor do repasse
                    </label>

                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Ex: 1250.00"
                      className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-[#08553F]">
                        Início do período
                      </label>

                      <input
                        type="date"
                        name="startDate"
                        required
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-[#08553F]">
                        Fim do período
                      </label>

                      <input
                        type="date"
                        name="endDate"
                        required
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#08553F]">
                      Observação
                    </label>

                    <textarea
                      name="notes"
                      rows={4}
                      placeholder="Ex: Repasse referente à primeira quinzena."
                      className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <SubmitButton
                    loadingText="Registrando..."
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Registrar repasse
                  </SubmitButton>
                </form>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Top médicos pagos
                </h2>

                <p className="mt-2 text-[#878787]">
                  Ranking por valor total recebido.
                </p>

                <div className="mt-6 space-y-4">
                  {doctorRanking.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum médico recebeu repasses ainda.
                      </p>
                    </div>
                  ) : (
                    doctorRanking.map((doctor, index) => (
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
                              Dr(a). {doctor.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              {doctor.specialty}
                            </p>

                            <p className="mt-2 text-xs font-bold text-[#08553F]">
                              {doctor.count} repasse(s)
                            </p>
                          </div>

                          <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                            {formatCurrency(doctor.total)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-[#08553F]">
                Histórico de repasses
              </h2>

              <p className="mt-2 text-[#878787]">
                Exibindo os 20 repasses mais recentes registrados.
              </p>

              <div className="mt-6 space-y-4">
                {recentPayouts.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhum repasse registrado ainda.
                    </p>
                  </div>
                ) : (
                  recentPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            Dr(a). {payout.doctor.user.name}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            {payout.doctor.specialty}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#08553F]">
                            Período: {formatDate(payout.startDate)} até{" "}
                            {formatDate(payout.endDate)}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Registrado em {formatDate(payout.createdAt)}
                          </p>

                          {payout.notes ? (
                            <p className="mt-2 text-sm text-[#878787]">
                              {payout.notes}
                            </p>
                          ) : null}
                        </div>

                        <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                          {formatCurrency(Number(payout.amount))}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {payouts.length > recentPayouts.length ? (
                <div className="mt-6 rounded-2xl bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                  Exibindo 20 de {payouts.length} repasses registrados.
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