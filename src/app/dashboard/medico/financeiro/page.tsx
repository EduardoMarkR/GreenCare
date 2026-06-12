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

  const completedAppointmentsThisMonth = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: "COMPLETED",
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

  const consultationPrice = Number(doctor.price);
  const completedCount = completedAppointmentsThisMonth.length;
  const estimatedMonthlyTotal = completedCount * consultationPrice;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Financeiro médico"
          title="Resumo financeiro"
          description="Acompanhe de forma simples suas consultas concluídas e o total estimado a receber no mês."
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
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Consultas concluídas no mês
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {completedCount}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor da consulta
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {formatCurrency(consultationPrice)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Total estimado no mês
              </p>

              <p className="mt-3 text-4xl font-extrabold text-white">
                {formatCurrency(estimatedMonthlyTotal)}
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Consultas concluídas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Lista das consultas concluídas neste mês.
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
              {completedAppointmentsThisMonth.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta concluída neste mês.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando consultas forem marcadas como concluídas, elas
                    aparecerão aqui.
                  </p>
                </div>
              ) : (
                completedAppointmentsThisMonth.map((appointment) => (
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
                      </div>

                      <p className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                        {formatCurrency(consultationPrice)}
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