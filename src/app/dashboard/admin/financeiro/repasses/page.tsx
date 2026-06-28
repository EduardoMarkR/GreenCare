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
    erro?: string;
    previewDoctorId?: string;
    previewStartDate?: string;
    previewEndDate?: string;
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
    return "Fechamento de repasse criado com sucesso.";
  }

  return null;
}

function getErrorMessage(erro?: string) {
  if (erro === "medico-nao-informado") {
    return "Selecione um médico antes de gerar o fechamento.";
  }

  if (erro === "periodo-nao-informado") {
    return "Informe a data inicial e a data final do período.";
  }

  if (erro === "periodo-invalido") {
    return "O período informado é inválido. A data inicial não pode ser maior que a data final.";
  }

  if (erro === "medico-nao-encontrado") {
    return "O médico selecionado não foi encontrado.";
  }

  if (erro === "sem-pagamentos") {
    return "Nenhum pagamento pago e ainda não repassado foi encontrado para este médico no período informado.";
  }

  return null;
}

export default async function AdminRepassesPage({
  searchParams,
}: AdminRepassesPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;
  const successMessage = getSuccessMessage(params?.success);
  const errorMessage = getErrorMessage(params?.erro);

  const previewDoctorId = params?.previewDoctorId ?? "";
  const previewStartDate = params?.previewStartDate ?? "";
  const previewEndDate = params?.previewEndDate ?? "";

  const hasPreview = Boolean(
    previewDoctorId && previewStartDate && previewEndDate
  );

  const previewStart = previewStartDate
    ? new Date(`${previewStartDate}T00:00:00.000Z`)
    : null;

  const previewEnd = previewEndDate
    ? new Date(`${previewEndDate}T23:59:59.999Z`)
    : null;

  const [approvedDoctors, payouts, unpaidPaidPayments, previewPayments] =
    await Promise.all([
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

      prisma.payment.findMany({
        where: {
          status: "PAID",
          payoutId: null,
        },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          appointment: {
            include: {
              availability: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      hasPreview && previewStart && previewEnd
        ? prisma.payment.findMany({
            where: {
              doctorId: previewDoctorId,
              status: "PAID",
              payoutId: null,
              paidAt: {
                gte: previewStart,
                lte: previewEnd,
              },
            },
            include: {
              patient: {
                include: {
                  user: true,
                },
              },
              appointment: {
                include: {
                  availability: true,
                },
              },
            },
            orderBy: {
              paidAt: "asc",
            },
          })
        : Promise.resolve([]),
    ]);

  const recentPayouts = payouts.slice(0, 20);

  const totalPayoutAmount = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const totalAvailableForPayout = unpaidPaidPayments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const doctorFinancialSummary = approvedDoctors
    .map((doctor) => {
      const doctorPayments = unpaidPaidPayments.filter(
        (payment) => payment.doctorId === doctor.id
      );

      const doctorPayouts = payouts.filter(
        (payout) => payout.doctorId === doctor.id
      );

      const grossAmount = doctorPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      const platformFee = doctorPayments.reduce(
        (sum, payment) => sum + Number(payment.platformFee),
        0
      );

      const availableAmount = doctorPayments.reduce(
        (sum, payment) => sum + Number(payment.doctorAmount),
        0
      );

      const paidAmount = doctorPayouts.reduce(
        (sum, payout) => sum + Number(payout.amount),
        0
      );

      const lastPayout = doctorPayouts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      return {
        id: doctor.id,
        name: doctor.user.name,
        specialty: doctor.specialty,
        crm: `${doctor.crm}/${doctor.crmUf}`,
        grossAmount,
        platformFee,
        generatedAmount: availableAmount,
        paidAmount,
        availableAmount,
        paidConsultations: doctorPayments.length,
        payoutCount: doctorPayouts.length,
        lastPayoutDate: lastPayout?.createdAt ?? null,
      };
    })
    .sort((a, b) => b.availableAmount - a.availableAmount);

  const doctorsWithAvailableBalance = doctorFinancialSummary.filter(
    (doctor) => doctor.availableAmount > 0
  );

  const topAvailableDoctors = doctorsWithAvailableBalance.slice(0, 5);

  const previewDoctor = approvedDoctors.find(
    (doctor) => doctor.id === previewDoctorId
  );

  const previewGrossAmount = previewPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const previewPlatformFee = previewPayments.reduce(
    (sum, payment) => sum + Number(payment.platformFee),
    0
  );

  const previewDoctorAmount = previewPayments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro admin"
          title="Gestão de repasses médicos"
          description="Acompanhe o saldo disponível por médico, valores já repassados, comissões da plataforma e histórico financeiro da operação."
          backHref="/dashboard/admin/financeiro"
          backLabel="Voltar ao financeiro"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {successMessage ? (
            <div className="mb-8 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-4 text-sm font-bold text-[#08553F] shadow-sm">
              ✅ {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
              ⚠️ {errorMessage}
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao financeiro
            </Link>

            <Link
              href="/dashboard/admin/financeiro/extrato"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Ver extrato
            </Link>

            <Link
              href="/dashboard/admin/financeiro/graficos"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Ver gráficos
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Disponível para repasse
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalAvailableForPayout)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pagamentos pagos ainda não vinculados a repasse
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Total já repassado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(totalPayoutAmount)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Soma de todos os repasses registrados
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Pagamentos pendentes de repasse
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {unpaidPaidPayments.length}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Pagamentos PAID sem payoutId
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Médicos com saldo
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {doctorsWithAvailableBalance.length}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                De {approvedDoctors.length} médicos aprovados
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Gerar fechamento de repasse
                </h2>

                <p className="mt-2 text-[#878787]">
                  Informe o médico e o período. O sistema calculará
                  automaticamente os pagamentos pagos e ainda não repassados.
                </p>

                <form
                  action="/dashboard/admin/financeiro/repasses"
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="text-sm font-bold text-[#08553F]">
                      Médico
                    </label>

                    <select
                      name="previewDoctorId"
                      required
                      defaultValue={previewDoctorId}
                      className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    >
                      <option value="">Selecione um médico</option>

                      {doctorFinancialSummary.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} — saldo:{" "}
                          {formatCurrency(doctor.availableAmount)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-[#08553F]">
                        Início do período
                      </label>

                      <input
                        type="date"
                        name="previewStartDate"
                        required
                        defaultValue={previewStartDate}
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-[#08553F]">
                        Fim do período
                      </label>

                      <input
                        type="date"
                        name="previewEndDate"
                        required
                        defaultValue={previewEndDate}
                        className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Calcular prévia do repasse
                  </button>
                </form>

                {hasPreview ? (
                  <div className="mt-6 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-5">
                    <h3 className="text-xl font-extrabold text-[#08553F]">
                      Prévia do fechamento
                    </h3>

                    <p className="mt-2 text-sm text-[#08553F]/80">
                      {previewDoctor
                        ? `Médico: ${previewDoctor.user.name}`
                        : "Médico não encontrado"}
                    </p>

                    {previewPayments.length === 0 ? (
                      <p className="mt-4 font-bold text-[#08553F]">
                        Nenhum pagamento pago e ainda não repassado foi
                        encontrado neste período.
                      </p>
                    ) : (
                      <>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-[#878787]">
                              Consultas pagas
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {previewPayments.length}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-[#878787]">
                              Valor bruto
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {formatCurrency(previewGrossAmount)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-[#878787]">
                              Comissão plataforma
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {formatCurrency(previewPlatformFee)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-[#878787]">
                              Valor médico
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {formatCurrency(previewDoctorAmount)}
                            </p>
                          </div>
                        </div>

                        <form action={createDoctorPayout} className="mt-5">
                          <input
                            type="hidden"
                            name="doctorId"
                            value={previewDoctorId}
                          />
                          <input
                            type="hidden"
                            name="startDate"
                            value={previewStartDate}
                          />
                          <input
                            type="hidden"
                            name="endDate"
                            value={previewEndDate}
                          />

                          <SubmitButton
                            loadingText="Gerando fechamento..."
                            className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Confirmar fechamento de{" "}
                            {formatCurrency(previewDoctorAmount)}
                          </SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Maiores saldos disponíveis
                </h2>

                <div className="mt-6 space-y-4">
                  {topAvailableDoctors.length === 0 ? (
                    <div className="rounded-2xl bg-[#F7F4E7] p-5">
                      <p className="font-bold text-[#08553F]">
                        Nenhum saldo pendente no momento.
                      </p>
                    </div>
                  ) : (
                    topAvailableDoctors.map((doctor, index) => (
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
                              {doctor.paidConsultations} pagamento(s) pendente(s)
                            </p>
                          </div>

                          <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                            {formatCurrency(doctor.availableAmount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
                <div className="border-b border-[#C6C6C6]/60 p-6">
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Saldos por médico
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse text-left">
                    <thead className="bg-[#F7F4E7] text-sm text-[#08553F]">
                      <tr>
                        <th className="px-5 py-4 font-extrabold">Médico</th>
                        <th className="px-5 py-4 font-extrabold">Pendentes</th>
                        <th className="px-5 py-4 font-extrabold">Bruto</th>
                        <th className="px-5 py-4 font-extrabold">Comissão</th>
                        <th className="px-5 py-4 font-extrabold">Disponível</th>
                        <th className="px-5 py-4 font-extrabold">
                          Já repassado
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#C6C6C6]/50">
                      {doctorFinancialSummary.map((doctor) => (
                        <tr key={doctor.id}>
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-[#08553F]">
                              Dr(a). {doctor.name}
                            </p>
                            <p className="mt-1 text-xs text-[#878787]">
                              {doctor.specialty} • {doctor.crm}
                            </p>
                            {doctor.lastPayoutDate ? (
                              <p className="mt-1 text-xs text-[#878787]">
                                Último repasse:{" "}
                                {formatDate(doctor.lastPayoutDate)}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-4 font-bold text-[#08553F]">
                            {doctor.paidConsultations}
                          </td>

                          <td className="px-5 py-4 font-bold text-[#08553F]">
                            {formatCurrency(doctor.grossAmount)}
                          </td>

                          <td className="px-5 py-4 text-[#878787]">
                            {formatCurrency(doctor.platformFee)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-4 py-2 text-sm font-bold ${
                                doctor.availableAmount > 0
                                  ? "bg-[#00CF7B]/15 text-[#08553F]"
                                  : "bg-[#C6C6C6]/30 text-[#878787]"
                              }`}
                            >
                              {formatCurrency(doctor.availableAmount)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-[#878787]">
                            {formatCurrency(doctor.paidAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Histórico de repasses
                </h2>

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
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                              {formatCurrency(Number(payout.amount))}
                            </p>

                            <Link
                              href={`/dashboard/admin/financeiro/repasses/${payout.id}`}
                              className="rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                            >
                              Ver detalhes
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}