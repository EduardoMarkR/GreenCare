import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { cancelPatientAppointment } from "./actions";

type DashboardPacientePageProps = {
  searchParams?: Promise<{
    erro?: string;
    cancelar?: string;
    busca?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
    pagina?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
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

function getDoctorStatusLabel(status: string) {
  if (status === "PENDING") return "Em análise";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Reprovado";

  return status;
}

function buildPaginationHref(params: {
  busca: string;
  statusFiltro: string;
  dataInicio: string;
  dataFim: string;
  pagina: number;
}) {
  const search = new URLSearchParams();

  if (params.busca) search.set("busca", params.busca);
  if (params.statusFiltro) search.set("status", params.statusFiltro);
  if (params.dataInicio) search.set("dataInicio", params.dataInicio);
  if (params.dataFim) search.set("dataFim", params.dataFim);

  search.set("pagina", String(params.pagina));

  return `/dashboard/paciente?${search.toString()}`;
}

export default async function DashboardPacientePage({
  searchParams,
}: DashboardPacientePageProps) {
  const params = await searchParams;

  const erro = params?.erro;
  const appointmentToCancelId = params?.cancelar;

  const busca = params?.busca?.trim() ?? "";
  const statusFiltro = params?.status ?? "";
  const dataInicio = params?.dataInicio ?? "";
  const dataFim = params?.dataFim ?? "";
  const paginaAtual = Math.max(Number(params?.pagina ?? "1"), 1);
  const itensPorPagina = 5;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!patient) {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
  });

  const totalConsultas = await prisma.appointment.count({
    where: { patientId: patient.id },
  });

  const consultasPendentes = await prisma.appointment.count({
    where: {
      patientId: patient.id,
      status: "PENDING",
    },
  });

  const consultasConfirmadas = await prisma.appointment.count({
    where: {
      patientId: patient.id,
      status: "CONFIRMED",
    },
  });

  const whereConsultas = {
    patientId: patient.id,
    ...(statusFiltro
      ? {
          status: statusFiltro as
            | "PENDING"
            | "CONFIRMED"
            | "CANCELLED"
            | "COMPLETED",
        }
      : {}),
    ...(dataInicio || dataFim
      ? {
          date: {
            ...(dataInicio
              ? { gte: new Date(`${dataInicio}T00:00:00`) }
              : {}),
            ...(dataFim ? { lte: new Date(`${dataFim}T23:59:59`) } : {}),
          },
        }
      : {}),
    ...(busca
      ? {
          doctor: {
            user: {
              name: {
                contains: busca,
                mode: "insensitive" as const,
              },
            },
          },
        }
      : {}),
  };

  const totalConsultasFiltradas = await prisma.appointment.count({
    where: whereConsultas,
  });

  const totalPaginas = Math.max(
    Math.ceil(totalConsultasFiltradas / itensPorPagina),
    1
  );

  const proximasConsultas = await prisma.appointment.findMany({
    where: whereConsultas,
    include: {
      availability: true,
      medicalRecord: true,
      prescription: true,
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        availability: {
          startTime: "asc",
        },
      },
    ],
    skip: (paginaAtual - 1) * itensPorPagina,
    take: itensPorPagina,
  });

  const appointmentToCancel = appointmentToCancelId
    ? await prisma.appointment.findFirst({
        where: {
          id: appointmentToCancelId,
          patientId: patient.id,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
        include: {
          availability: true,
          doctor: {
            include: {
              user: true,
            },
          },
        },
      })
    : null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Área do paciente"
          title={`Olá, ${patient.user.name}`}
          description="Acompanhe suas consultas, documentos e solicitações em uma jornada de cuidado mais simples, segura e organizada."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível concluir a ação
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          {appointmentToCancel ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Confirmar cancelamento
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">
                Tem certeza que deseja cancelar a consulta com{" "}
                <strong>Dr(a). {appointmentToCancel.doctor.user.name}</strong>{" "}
                em <strong>{formatDate(appointmentToCancel.date)}</strong>
                {appointmentToCancel.availability ? (
                  <>
                    , das{" "}
                    <strong>{appointmentToCancel.availability.startTime}</strong>{" "}
                    às{" "}
                    <strong>{appointmentToCancel.availability.endTime}</strong>
                  </>
                ) : null}
                ?
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                Essa ação moverá a consulta para o histórico como cancelada.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <form action={cancelPatientAppointment}>
                  <input
                    type="hidden"
                    name="appointmentId"
                    value={appointmentToCancel.id}
                  />

                  <button
                    type="submit"
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    Sim, cancelar consulta
                  </button>
                </form>

                <Link
                  href="/dashboard/paciente"
                  className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-bold text-[#08553F] ring-1 ring-[#C6C6C6]/70 transition hover:bg-[#F3EFA1]"
                >
                  Manter consulta
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/paciente/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Meu perfil
            </Link>

            {doctor?.approvalStatus === "APPROVED" && (
              <Link
                href="/dashboard/medico"
                className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
              >
                Painel médico
              </Link>
            )}

            <Link
              href="/logout"
              className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              Sair
            </Link>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-3">
            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Consultas totais
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {totalConsultas}
                </p>
              </div>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas vinculadas ao seu cadastro.
              </p>
            </div>

            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Pendentes
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {consultasPendentes}
                </p>
              </div>

              <p className="mt-3 text-sm text-[#878787]">
                Aguardando confirmação médica.
              </p>
            </div>

            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-[#878787]">
                  Confirmadas
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {consultasConfirmadas}
                </p>
              </div>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas confirmadas.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/paciente/documentos"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                📎
              </div>

              <h2 className="text-lg font-extrabold text-[#08553F]">
                Documentos
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Envie e acompanhe seus documentos médicos.
              </p>

              <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                Acessar →
              </p>
            </Link>

            <Link
              href="/dashboard/paciente/favoritos"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDECEC] text-2xl">
                ❤️
              </div>

              <h2 className="text-lg font-extrabold text-[#08553F]">
                Médicos favoritos
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Acesse rapidamente os profissionais que você salvou para futuras consultas.
              </p>

              <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                Ver favoritos →
              </p>
            </Link>

            <Link
              href="/dashboard/paciente/pagamentos"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00CF7B]/15 text-2xl">
                💳
              </div>

              <h2 className="text-lg font-extrabold text-[#08553F]">
                Pagamentos
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Acompanhe pagamentos pendentes, aprovados e cancelados.
              </p>

              <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                Ver pagamentos →
              </p>
            </Link>

            <Link
              href="/dashboard/paciente/receitas"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                📄
              </div>

              <h2 className="text-lg font-extrabold text-[#08553F]">
                Receitas
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Acesse receitas médicas emitidas.
              </p>

              <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                Acessar →
              </p>
            </Link>

            <Link
              href="/dashboard/paciente/historico"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                🗂️
              </div>

              <h2 className="text-lg font-extrabold text-[#08553F]">
                Histórico
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Consulte consultas encerradas e PDFs.
              </p>

              <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                Acessar →
              </p>
            </Link>

            {!doctor && (
              <Link
                href="/dashboard/paciente/solicitar-medico"
                className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                  ⚕️
                </div>

                <h2 className="text-lg font-extrabold text-[#08553F]">
                  Quero atender
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  Solicite cadastro médico para análise.
                </p>

                <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Solicitar →
                </p>
              </Link>
            )}

            {doctor && (
              <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  ⚕️
                </div>

                <h2 className="text-lg font-extrabold text-[#08553F]">
                  Cadastro médico
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  Status:{" "}
                  <strong className="text-[#08553F]">
                    {getDoctorStatusLabel(doctor.approvalStatus)}
                  </strong>
                </p>

                {doctor.approvalStatus === "APPROVED" && (
                  <Link
                    href="/dashboard/medico"
                    className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Acessar painel
                  </Link>
                )}

                {doctor.approvalStatus === "PENDING" && (
                  <p className="mt-5 rounded-2xl bg-[#F3EFA1] p-3 text-sm font-semibold text-[#08553F]">
                    Aguardando análise.
                  </p>
                )}

                {doctor.approvalStatus === "REJECTED" && (
                  <Link
                    href="/dashboard/medico/perfil"
                    className="mt-5 inline-flex rounded-2xl bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                  >
                    Revisar perfil
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Minhas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Busque consultas por médico, status ou período.
                </p>
              </div>

              <Link
                href="/medicos"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Agendar nova consulta
              </Link>
            </div>

            <form className="mt-6 grid gap-3 rounded-2xl bg-[#F7F4E7] p-4 md:grid-cols-5">
              <input
                type="text"
                name="busca"
                defaultValue={busca}
                placeholder="Buscar médico"
                className="rounded-2xl border border-[#C6C6C6]/70 bg-white px-4 py-3 text-sm text-[#08553F] outline-none focus:border-[#00CF7B]"
              />

              <select
                name="status"
                defaultValue={statusFiltro}
                className="rounded-2xl border border-[#C6C6C6]/70 bg-white px-4 py-3 text-sm text-[#08553F] outline-none focus:border-[#00CF7B]"
              >
                <option value="">Todos os status</option>
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="COMPLETED">Concluída</option>
              </select>

              <input
                type="date"
                name="dataInicio"
                defaultValue={dataInicio}
                className="rounded-2xl border border-[#C6C6C6]/70 bg-white px-4 py-3 text-sm text-[#08553F] outline-none focus:border-[#00CF7B]"
              />

              <input
                type="date"
                name="dataFim"
                defaultValue={dataFim}
                className="rounded-2xl border border-[#C6C6C6]/70 bg-white px-4 py-3 text-sm text-[#08553F] outline-none focus:border-[#00CF7B]"
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Filtrar
              </button>
            </form>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#878787]">
                {totalConsultasFiltradas} consulta(s) encontrada(s)
              </p>

              <Link
                href="/dashboard/paciente"
                className="text-sm font-bold text-[#08553F] hover:text-[#00CF7B]"
              >
                Limpar filtros
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {proximasConsultas.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Ajuste os filtros ou agende uma nova consulta.
                  </p>
                </div>
              )}

              {proximasConsultas.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        Dr(a). {appointment.doctor.user.name}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        {appointment.doctor.specialty}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#08553F]">
                        {formatDate(appointment.date)}
                      </p>

                      {appointment.availability ? (
                        <p className="mt-1 text-sm font-semibold text-[#08553F]">
                          {appointment.availability.startTime} às{" "}
                          {appointment.availability.endTime}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-[#878787]">
                          Horário não informado
                        </p>
                      )}

                      {appointment.notes && (
                        <p className="mt-2 text-sm text-[#878787]">
                          Observações: {appointment.notes}
                        </p>
                      )}

                      {appointment.status === "CONFIRMED" &&
                        appointment.meetingUrl && (
                          <div className="mt-4 rounded-2xl bg-[#00CF7B]/10 p-4">
                            <p className="text-sm font-bold text-[#08553F]">
                              Consulta online disponível
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              Link da teleconsulta disponível.
                            </p>

                            <a
                              href={appointment.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                            >
                              Entrar na consulta →
                            </a>
                          </div>
                        )}

                      {appointment.status === "COMPLETED" &&
                        (appointment.medicalRecord ||
                          appointment.prescription) && (
                          <div className="mt-5 rounded-2xl border border-[#C6C6C6]/60 bg-white p-4">
                            <p className="font-extrabold text-[#08553F]">
                              Documentos da consulta
                            </p>

                            <p className="mt-2 text-sm text-[#878787]">
                              Os documentos desta consulta estão disponíveis em
                              PDF.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {appointment.medicalRecord && (
                                <a
                                  href={`/api/prontuario/${appointment.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                                >
                                  Abrir prontuário PDF →
                                </a>
                              )}

                              {appointment.prescription && (
                                <a
                                  href={`/api/receita/${appointment.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                                >
                                  Abrir receita PDF →
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      {(appointment.status === "PENDING" ||
                        appointment.status === "CONFIRMED") && (
                        <Link
                          href={`/dashboard/paciente?cancelar=${appointment.id}`}
                          className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                        >
                          Cancelar consulta
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#878787]">
                  Página {paginaAtual} de {totalPaginas}
                </p>

                <div className="flex gap-2">
                  {paginaAtual > 1 && (
                    <Link
                      href={buildPaginationHref({
                        busca,
                        statusFiltro,
                        dataInicio,
                        dataFim,
                        pagina: paginaAtual - 1,
                      })}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#08553F] ring-1 ring-[#C6C6C6]/70 transition hover:bg-[#F3EFA1]"
                    >
                      ← Anterior
                    </Link>
                  )}

                  {paginaAtual < totalPaginas && (
                    <Link
                      href={buildPaginationHref({
                        busca,
                        statusFiltro,
                        dataInicio,
                        dataFim,
                        pagina: paginaAtual + 1,
                      })}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#08553F] ring-1 ring-[#C6C6C6]/70 transition hover:bg-[#F3EFA1]"
                    >
                      Próxima →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}