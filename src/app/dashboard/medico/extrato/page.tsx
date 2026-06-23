import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function ExtratoFinanceiroMedicoPage() {
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

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: "COMPLETED",
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

  const rows = completedAppointments.map((appointment) => {
    const gross = Number(doctor.price);
    const feePercent = Number(doctor.platformFeePercent);
    const feeValue = gross * (feePercent / 100);
    const net = gross - feeValue;

    return {
      appointment,
      gross,
      feePercent,
      feeValue,
      net,
    };
  });

  const grossTotal = rows.reduce((sum, row) => sum + row.gross, 0);
  const feeTotal = rows.reduce((sum, row) => sum + row.feeValue, 0);
  const netTotal = rows.reduce((sum, row) => sum + row.net, 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Extrato financeiro"
          title="Extrato financeiro médico"
          description="Consulte seu histórico de consultas concluídas, receita bruta, comissão da plataforma e valor líquido estimado."
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
              Ver dashboard financeiro
            </Link>

            <Link
              href="/medico/consultas?status=COMPLETED"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Ver consultas concluídas
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Receita bruta total
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(grossTotal)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                {rows.length} consulta(s) concluída(s)
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Comissão da plataforma
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(feeTotal)}
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Comissão atual: {Number(doctor.platformFeePercent)}%
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Receita líquida total
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(netTotal)}
              </p>

              <p className="mt-2 text-sm text-white/70">
                Valor estimado líquido ao médico
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Histórico de ganhos
                </h2>

                <p className="mt-2 text-[#878787]">
                  Todas as consultas concluídas aparecem abaixo com o cálculo
                  financeiro aplicado.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] px-5 py-3 text-sm font-bold text-[#08553F]">
                Comissão aplicada: {Number(doctor.platformFeePercent)}%
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {rows.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta concluída ainda.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando consultas forem concluídas, seu extrato financeiro
                    será exibido aqui.
                  </p>
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.appointment.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                  >
                    <div className="grid gap-4 md:grid-cols-5 md:items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Paciente
                        </p>

                        <p className="mt-1 font-extrabold text-[#08553F]">
                          {row.appointment.patient.user.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Data
                        </p>

                        <p className="mt-1 font-semibold text-[#08553F]">
                          {formatDate(row.appointment.date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Bruto
                        </p>

                        <p className="mt-1 font-semibold text-[#08553F]">
                          {formatCurrency(row.gross)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Comissão
                        </p>

                        <p className="mt-1 font-semibold text-[#08553F]">
                          {row.feePercent}% ({formatCurrency(row.feeValue)})
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Líquido
                        </p>

                        <p className="mt-1 text-xl font-extrabold text-[#08553F]">
                          {formatCurrency(row.net)}
                        </p>
                      </div>
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