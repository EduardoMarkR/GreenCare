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

function formatTimeFromAvailability(
  availability?: {
    startTime: string;
    endTime: string;
  } | null
) {
  if (!availability) return "Horário não informado";

  return `${availability.startTime} às ${availability.endTime}`;
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-800";
}

function getStartOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function getStartOfTomorrowUtc() {
  const today = getStartOfTodayUtc();

  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

function getStartOfAfterTomorrowUtc() {
  const tomorrow = getStartOfTomorrowUtc();

  return new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
}

export default async function DashboardMedicoPage() {
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

  const todayStart = getStartOfTodayUtc();
  const tomorrowStart = getStartOfTomorrowUtc();
  const afterTomorrowStart = getStartOfAfterTomorrowUtc();

  const totalHorarios = await prisma.availability.count({
    where: {
      doctorId: doctor.id,
    },
  });

  const consultasPendentes = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: "PENDING",
    },
  });

  const consultasHoje = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      date: {
        gte: todayStart,
        lt: tomorrowStart,
      },
    },
  });

  const consultasAmanha = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      date: {
        gte: tomorrowStart,
        lt: afterTomorrowStart,
      },
    },
  });

  const pacientesAtendidos = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: "COMPLETED",
    },
    distinct: ["patientId"],
    select: {
      patientId: true,
    },
  });

  const proximaConsulta = await prisma.appointment.findFirst({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      date: {
        gte: todayStart,
      },
    },
    include: {
      availability: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        availability: {
          startTime: "asc",
        },
      },
    ],
  });

  const proximasConsultas = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      date: {
        gte: todayStart,
      },
    },
    include: {
      availability: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        availability: {
          startTime: "asc",
        },
      },
    ],
    take: 5,
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Área médica"
          title={`Olá, ${doctor.user.name}`}
          description="Acompanhe seus atendimentos, próximos compromissos, agenda e indicadores essenciais da sua rotina médica."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/selecionar-perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Alternar perfil
            </Link>

            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Perfil profissional
            </Link>

            <Link
              href="/medico/horarios"
              className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Minha agenda
            </Link>

            <Link
              href="/medico/consultas"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Minhas consultas
            </Link>

            <Link
              href="/dashboard/medico/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Financeiro
            </Link>

            <Link
              href="/dashboard/medico/extrato"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Extrato financeiro
            </Link>

            <Link
              href="/logout"
              className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              Sair
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="overflow-hidden rounded-[2rem] bg-[#08553F] shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#00CF7B] to-[#F3EFA1]" />

              <div className="p-7">
                <p className="text-sm font-bold uppercase tracking-wide text-white/60">
                  Próxima consulta
                </p>

                {proximaConsulta ? (
                  <div className="mt-5">
                    <h2 className="text-3xl font-extrabold text-white">
                      {proximaConsulta.patient.user.name}
                    </h2>

                    <p className="mt-2 text-white/70">
                      {formatDate(proximaConsulta.date)} •{" "}
                      {formatTimeFromAvailability(proximaConsulta.availability)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                          proximaConsulta.status
                        )}`}
                      >
                        {getStatusLabel(proximaConsulta.status)}
                      </span>

                      {proximaConsulta.meetingUrl ? (
                        <a
                          href={proximaConsulta.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                        >
                          Abrir Google Meet
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <Link
                        href="/medico/consultas"
                        className="inline-flex rounded-2xl bg-[#00CF7B] px-5 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                      >
                        Gerenciar consulta
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <h2 className="text-3xl font-extrabold text-white">
                      Nenhuma consulta futura.
                    </h2>

                    <p className="mt-2 text-white/70">
                      Quando houver novos agendamentos, a próxima consulta
                      aparecerá aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-[#878787]">
                Resumo da rotina
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#F7F4E7] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                    Hoje
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {consultasHoje}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F4E7] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                    Amanhã
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {consultasAmanha}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F4E7] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                    Pendentes
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {consultasPendentes}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F4E7] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                    Pacientes
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {pacientesAtendidos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid items-stretch gap-6 md:grid-cols-3">
            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Horários cadastrados
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {totalHorarios}
                </p>
              </div>

              <p className="mt-3 text-sm text-[#878787]">
                Disponibilidades criadas na sua agenda.
              </p>
            </div>

            <Link
              href="/medico/consultas?status=PENDING"
              className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Aguardando confirmação
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {consultasPendentes}
                </p>
              </div>

              <p className="mt-3 text-sm font-bold text-[#08553F]">
                Ver pendentes →
              </p>
            </Link>

            <Link
              href="/medico/consultas"
              className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Atendimentos futuros
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {proximasConsultas.length}
                </p>
              </div>

              <p className="mt-3 text-sm font-bold text-[#08553F]">
                Ver agenda médica →
              </p>
            </Link>
          </div>

          <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Link
              href="/dashboard/medico/perfil"
              className="group block h-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  🩺
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Perfil profissional
                </h2>

                <p className="mt-2 text-[#878787]">
                  Edite seus dados, CRM, bio, atendimento e valor da consulta.
                </p>

                <p className="mt-auto pt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Editar perfil →
                </p>
              </div>
            </Link>

            <Link
              href="/medico/horarios"
              className="group block h-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                  📅
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Minha agenda
                </h2>

                <p className="mt-2 text-[#878787]">
                  Veja, crie ou remova horários disponíveis para pacientes.
                </p>

                <p className="mt-auto pt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Gerenciar agenda →
                </p>
              </div>
            </Link>

            <Link
              href="/medico/consultas"
              className="group block h-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  💬
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Minhas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Confirme, cancele, conclua e acompanhe os atendimentos.
                </p>

                <p className="mt-auto pt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Ver consultas →
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/medico/financeiro"
              className="group block h-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#00CF7B] to-[#F3EFA1]" />

              <div className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00CF7B]/15 text-2xl">
                  💰
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Financeiro
                </h2>

                <p className="mt-2 text-[#878787]">
                  Acompanhe receita bruta, comissão e valor líquido do mês.
                </p>

                <p className="mt-auto pt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Ver financeiro →
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/medico/extrato"
              className="group block h-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-[#00CF7B]" />

              <div className="flex h-full flex-col p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  📊
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Extrato financeiro
                </h2>

                <p className="mt-2 text-[#878787]">
                  Consulte ganhos líquidos, comissão e histórico financeiro.
                </p>

                <p className="mt-auto pt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Abrir extrato →
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Próximas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Lista resumida dos próximos atendimentos ativos.
                </p>
              </div>

              <Link
                href="/medico/consultas"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Gerenciar consultas
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {proximasConsultas.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta futura encontrada.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando pacientes agendarem consultas, elas aparecerão aqui.
                  </p>
                </div>
              )}

              {proximasConsultas.map((appointment) => (
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
                        {formatDate(appointment.date)} •{" "}
                        {formatTimeFromAvailability(appointment.availability)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}