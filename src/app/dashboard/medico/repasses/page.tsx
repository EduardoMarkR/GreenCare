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

function calculateFinancialValues(price: number, platformFeePercent: number) {
  const platformFee = price * (platformFeePercent / 100);
  const doctorNet = price - platformFee;

  return {
    gross: price,
    platformFee,
    doctorNet,
  };
}

export default async function RepassesMedicoPage() {
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

  const [completedAppointments, payouts] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
      },
    }),
    prisma.doctorPayout.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const consultationPrice = Number(doctor.price);
  const platformFeePercent = Number(doctor.platformFeePercent);

  const financialsPerAppointment = calculateFinancialValues(
    consultationPrice,
    platformFeePercent
  );

  const totalGross = completedAppointments.length * financialsPerAppointment.gross;
  const totalPlatformFee =
    completedAppointments.length * financialsPerAppointment.platformFee;
  const totalNetGenerated =
    completedAppointments.length * financialsPerAppointment.doctorNet;

  const totalPaid = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const pendingPayout = Math.max(totalNetGenerated - totalPaid, 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Repasses médicos"
          title="Meus repasses"
          description="Acompanhe quanto já foi gerado, quanto já foi repassado e o saldo líquido pendente de pagamento."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel médico"
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
              href="/dashboard/medico/financeiro"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Ver financeiro
            </Link>

            <Link
              href="/dashboard/medico/extrato"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Ver extrato
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita bruta gerada
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalGross)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {completedAppointments.length} consulta(s) concluída(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Comissão da plataforma
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPlatformFee)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Comissão aplicada: {platformFeePercent}%
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Total líquido gerado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(totalNetGenerated)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Valor líquido após comissão
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Já repassado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(totalPaid)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {payouts.length} repasse(s) registrado(s)
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Saldo pendente de repasse
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {formatCurrency(pendingPayout)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] px-5 py-4 text-sm font-bold text-[#08553F]">
                Este valor é estimado com base nas consultas concluídas e nos
                repasses já registrados pelo admin.
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Histórico de repasses recebidos
                </h2>

                <p className="mt-2 text-[#878787]">
                  Lista de repasses registrados pela administração.
                </p>
              </div>

              <Link
                href="/dashboard/medico/extrato"
                className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
              >
                Ver extrato financeiro
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {payouts.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhum repasse registrado ainda.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando a administração registrar pagamentos, eles aparecerão
                    aqui.
                  </p>
                </div>
              ) : (
                payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-extrabold text-[#08553F]">
                          Repasse recebido
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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}