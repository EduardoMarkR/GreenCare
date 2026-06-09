import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function DoctorPage({ params }: Props) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      availabilities: {
        orderBy: [
          {
            date: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/60">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#00CF7B]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-10">
            <Link
              href="/medicos"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              ← Voltar para médicos
            </Link>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
              <div className="rounded-[2rem] bg-white p-8 shadow-xl">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#08553F] to-[#00CF7B] text-5xl text-white shadow-lg">
                    ⚕️
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
                      Médico aprovado
                    </span>

                    <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#08553F] md:text-5xl">
                      {doctor.user.name}
                    </h1>

                    <p className="mt-3 text-xl font-bold text-[#00CF7B]">
                      {doctor.specialty}
                    </p>

                    <p className="mt-3 text-[#878787]">
                      CRM {doctor.crm}/{doctor.crmUf}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-[#F7F4E7] p-5">
                    <p className="text-sm font-semibold text-[#878787]">
                      Consulta
                    </p>

                    <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                      {formatCurrency(Number(doctor.price))}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#F7F4E7] p-5">
                    <p className="text-sm font-semibold text-[#878787]">
                      Atendimento
                    </p>

                    <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                      {doctor.telemedicine ? "Telemedicina" : "Presencial"}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-[#F7F4E7] p-5">
                    <p className="text-sm font-semibold text-[#878787]">
                      Horários
                    </p>

                    <p className="mt-2 text-xl font-extrabold text-[#08553F]">
                      {doctor.availabilities.length}
                    </p>
                  </div>
                </div>

                <div className="mt-10 border-t border-[#C6C6C6]/50 pt-8">
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Sobre o profissional
                  </h2>

                  <p className="mt-4 max-w-3xl leading-8 text-[#878787]">
                    {doctor.bio ?? "Biografia não informada."}
                  </p>
                </div>
              </div>

              <aside className="rounded-[2rem] bg-[#08553F] p-6 text-white shadow-xl">
                <p className="text-sm font-semibold text-[#00CF7B]">
                  Agendamento online
                </p>

                <h2 className="mt-3 text-2xl font-extrabold">
                  Escolha um horário disponível
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/75">
                  Selecione um horário para continuar com o agendamento da sua
                  consulta.
                </p>

                <div className="mt-6 rounded-3xl bg-white/10 p-4">
                  <p className="text-sm text-white/70">Valor da consulta</p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {formatCurrency(Number(doctor.price))}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
              Agenda
            </span>

            <h2 className="mt-5 text-3xl font-extrabold text-[#08553F]">
              Horários disponíveis
            </h2>

            <p className="mt-3 text-[#878787]">
              Clique em um horário para avançar para a confirmação da consulta.
            </p>
          </div>

          {doctor.availabilities.length === 0 ? (
            <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
              <p className="text-xl font-bold text-[#08553F]">
                Nenhum horário disponível no momento.
              </p>

              <p className="mt-3 text-[#878787]">
                Volte mais tarde ou escolha outro médico disponível na
                plataforma.
              </p>

              <Link
                href="/medicos"
                className="mt-6 inline-flex rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Ver outros médicos
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {doctor.availabilities.map((availability) => (
                <Link
                  key={availability.id}
                  href={`/agendar/${availability.id}`}
                  className="group rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#00CF7B] hover:shadow-xl"
                >
                  <p className="text-sm font-bold text-[#00CF7B]">
                    Data disponível
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-[#08553F]">
                    {formatDate(availability.date)}
                  </p>

                  <p className="mt-3 text-[#878787]">
                    {availability.startTime} às {availability.endTime}
                  </p>

                  <div className="mt-5 inline-flex rounded-2xl bg-[#F7F4E7] px-4 py-2 text-sm font-bold text-[#08553F] transition group-hover:bg-[#F3EFA1]">
                    Agendar este horário →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}