import Link from "next/link";
import { notFound } from "next/navigation";
import { createAppointment } from "./actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    availabilityId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AgendarPage({ params }: Props) {
  const { availabilityId } = await params;

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!availability) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Agendamento online"
          title="Confirmar consulta"
          description="Revise os dados do atendimento e informe brevemente o motivo da consulta antes de confirmar o agendamento."
          backHref={`/medicos/${availability.doctor.id}`}
          backLabel="Voltar para o médico"
        />

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Agendar consulta
                </h2>

                <p className="mt-2 text-[#878787]">
                  Conte o motivo principal da consulta para ajudar o médico a se
                  preparar para o atendimento.
                </p>

                <form action={createAppointment} className="mt-8 space-y-6">
                  <input
                    type="hidden"
                    name="availabilityId"
                    value={availability.id}
                  />

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Motivo da consulta
                    </label>

                    <textarea
                      name="notes"
                      placeholder="Conte brevemente o motivo da consulta"
                      rows={5}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-6 py-4 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Confirmar agendamento
                  </button>
                </form>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[2rem] bg-[#08553F] p-7 text-white shadow-sm">
              <div className="absolute -bottom-10 -right-10 text-[9rem] leading-none opacity-10">
                🌿
              </div>

              <div className="relative">
                <span className="inline-flex rounded-full bg-[#00CF7B]/20 px-4 py-2 text-sm font-bold text-[#00CF7B]">
                  Consulta selecionada
                </span>

                <h3 className="mt-6 text-2xl font-extrabold">
                  {availability.doctor.user.name}
                </h3>

                <p className="mt-2 font-bold text-[#00CF7B]">
                  {availability.doctor.specialty}
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">Data</p>

                    <p className="mt-1 text-xl font-extrabold">
                      {formatDate(availability.date)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Horário
                    </p>

                    <p className="mt-1 text-xl font-extrabold">
                      {availability.startTime} às {availability.endTime}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Valor da consulta
                    </p>

                    <p className="mt-1 text-2xl font-extrabold">
                      {formatCurrency(Number(availability.doctor.price))}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/medicos/${availability.doctor.id}`}
                  className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver perfil do médico
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}