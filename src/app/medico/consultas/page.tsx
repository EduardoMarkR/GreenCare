import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { saveMeetingUrl, updateAppointmentStatus } from "./actions";

type ConsultasMedicoPageProps = {
  searchParams?: Promise<{
    status?: string;
    busca?: string;
    erro?: string;
    acao?: string;
    consulta?: string;
  }>;
};

type ActiveAppointmentStatus = "PENDING" | "CONFIRMED";
type SensitiveAction = "CANCELLED" | "COMPLETED";

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

function getFilterClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-[#08553F] px-5 py-2 text-sm font-bold text-white shadow-sm"
    : "rounded-full border border-[#08553F]/20 bg-white px-5 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]";
}

function getFilterHref(status: string, searchTerm: string) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (searchTerm) {
    params.set("busca", searchTerm);
  }

  const queryString = params.toString();

  return queryString
    ? `/medico/consultas?${queryString}`
    : "/medico/consultas";
}

function getConfirmationHref(
  appointmentId: string,
  action: SensitiveAction,
  statusFilter: string,
  searchTerm: string
) {
  const params = new URLSearchParams();

  params.set("acao", action);
  params.set("consulta", appointmentId);

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }

  if (searchTerm) {
    params.set("busca", searchTerm);
  }

  return `/medico/consultas?${params.toString()}`;
}

export default async function ConsultasMedicoPage({
  searchParams,
}: ConsultasMedicoPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const params = await searchParams;
  const selectedStatus = params?.status ?? "ALL";
  const searchTerm = params?.busca?.trim() ?? "";
  const erro = params?.erro;
  const selectedAction = params?.acao as SensitiveAction | undefined;
  const selectedAppointmentId = params?.consulta;

  const validStatuses = ["ALL", "PENDING", "CONFIRMED"];

  const statusFilter = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : "ALL";

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const appointmentWhere: Prisma.AppointmentWhereInput = {
    doctorId: doctor.id,
    payment: {
      is: {
        status: "PAID",
      },
    },
    status:
      statusFilter !== "ALL"
        ? (statusFilter as ActiveAppointmentStatus)
        : {
            in: ["PENDING", "CONFIRMED"] as ActiveAppointmentStatus[],
          },
    ...(searchTerm
      ? {
          OR: [
            {
              notes: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
            {
              patient: {
                user: {
                  name: {
                    contains: searchTerm,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              patient: {
                user: {
                  email: {
                    contains: searchTerm,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    appointments,
    activeAppointments,
    pendingAppointments,
    confirmedAppointments,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        availability: true,
        medicalRecord: true,
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
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
    }),
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        payment: {
          is: {
            status: "PAID",
          },
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    }),
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        payment: {
          is: {
            status: "PAID",
          },
        },
        status: "PENDING",
      },
    }),
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        payment: {
          is: {
            status: "PAID",
          },
        },
        status: "CONFIRMED",
      },
    }),
  ]);

  const appointmentToConfirm =
    selectedAppointmentId &&
    (selectedAction === "CANCELLED" || selectedAction === "COMPLETED")
      ? appointments.find(
          (appointment) => appointment.id === selectedAppointmentId
        )
      : null;

  const actionLabel =
    selectedAction === "CANCELLED"
      ? "cancelar"
      : selectedAction === "COMPLETED"
        ? "concluir"
        : "";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Consultas ativas"
          title="Minhas consultas"
          description="Acompanhe consultas pendentes e confirmadas. Consultas concluídas ou canceladas ficam no histórico."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
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

          {appointmentToConfirm ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Confirmar alteração da consulta
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">
                Tem certeza que deseja {actionLabel} a consulta de{" "}
                <strong>{appointmentToConfirm.patient.user.name}</strong> em{" "}
                <strong>{formatDate(appointmentToConfirm.date)}</strong>
                {appointmentToConfirm.availability ? (
                  <>
                    , das{" "}
                    <strong>
                      {appointmentToConfirm.availability.startTime}
                    </strong>{" "}
                    às{" "}
                    <strong>{appointmentToConfirm.availability.endTime}</strong>
                  </>
                ) : null}
                ?
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                Essa ação moverá a consulta para o histórico.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <form action={updateAppointmentStatus}>
                  <input
                    type="hidden"
                    name="appointmentId"
                    value={appointmentToConfirm.id}
                  />

                  <input type="hidden" name="status" value={selectedAction} />

                  <button
                    type="submit"
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    Sim, {actionLabel} consulta
                  </button>
                </form>

                <Link
                  href={getFilterHref(statusFilter, searchTerm)}
                  className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-bold text-[#08553F] ring-1 ring-[#C6C6C6]/70 transition hover:bg-[#F3EFA1]"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/medico/horarios"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Minha agenda
            </Link>

            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Perfil profissional
            </Link>

            <Link
              href="/medico/historico"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Histórico
            </Link>
          </div>

          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">Ativas</p>
              <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                {activeAppointments}
              </p>
            </div>

            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">Pendentes</p>
              <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                {pendingAppointments}
              </p>
            </div>

            <div className="flex h-full flex-col justify-between rounded-[2rem] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">Confirmadas</p>
              <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                {confirmedAppointments}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Buscar consulta
                </h2>

                <p className="mt-1 text-sm text-[#878787]">
                  Busque por nome do paciente, e-mail ou observações.
                </p>
              </div>

              {searchTerm && (
                <p className="text-sm text-[#878787]">
                  Resultado para:{" "}
                  <strong className="text-[#08553F]">{searchTerm}</strong>
                </p>
              )}
            </div>

            <form
              action="/medico/consultas"
              className="mt-5 flex flex-col gap-3 md:flex-row"
            >
              {statusFilter !== "ALL" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}

              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por paciente, e-mail ou observação"
                className="min-h-12 flex-1 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Buscar
              </button>

              {(searchTerm || statusFilter !== "ALL") && (
                <Link
                  href="/medico/consultas"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#08553F]">
              Filtrar por status
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={getFilterHref("ALL", searchTerm)}
                className={getFilterClass(statusFilter === "ALL")}
              >
                Todas ativas ({activeAppointments})
              </Link>

              <Link
                href={getFilterHref("PENDING", searchTerm)}
                className={getFilterClass(statusFilter === "PENDING")}
              >
                Pendentes ({pendingAppointments})
              </Link>

              <Link
                href={getFilterHref("CONFIRMED", searchTerm)}
                className={getFilterClass(statusFilter === "CONFIRMED")}
              >
                Confirmadas ({confirmedAppointments})
              </Link>

              <Link
                href="/medico/historico"
                className="rounded-full border border-[#08553F]/20 bg-[#F3EFA1] px-5 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
              >
                Ver histórico →
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-5">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhuma consulta ativa encontrada.
                </p>

                <p className="mt-2 text-sm text-[#878787]">
                  Ajuste os filtros ou aguarde novos agendamentos.
                </p>

                <Link
                  href="/medico/historico"
                  className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Ver histórico de consultas
                </Link>
              </div>
            )}

            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xl font-extrabold text-[#08553F]">
                        {appointment.patient.user.name}
                      </p>

                      <p className="mt-2 text-sm font-bold text-[#08553F]">
                        {formatDate(appointment.date)}
                      </p>

                      {appointment.availability ? (
                        <p className="mt-1 text-sm font-bold text-[#08553F]">
                          {appointment.availability.startTime} às{" "}
                          {appointment.availability.endTime}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-bold text-[#878787]">
                          Horário não informado
                        </p>
                      )}

                      {appointment.medicalRecord ? (
                        <p className="mt-3 inline-flex rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                          Prontuário já iniciado
                        </p>
                      ) : (
                        <p className="mt-3 inline-flex rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
                          Prontuário pendente
                        </p>
                      )}

                      {appointment.notes && (
                        <p className="mt-3 text-sm text-[#878787]">
                          Observações: {appointment.notes}
                        </p>
                      )}

                      {appointment.meetingUrl && (
                        <div className="mt-4 rounded-2xl bg-[#00CF7B]/10 p-4">
                          <p className="text-sm font-bold text-[#08553F]">
                            Link da teleconsulta
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
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {appointment.status !== "CONFIRMED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="CONFIRMED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                            >
                              Confirmar
                            </button>
                          </form>
                        )}

                        <Link
                          href={`/medico/prontuario/${appointment.id}`}
                          className="rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                        >
                          {appointment.medicalRecord
                            ? "Editar prontuário"
                            : "Abrir prontuário"}
                        </Link>

                        <Link
                          href={getConfirmationHref(
                            appointment.id,
                            "CANCELLED",
                            statusFilter,
                            searchTerm
                          )}
                          className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                        >
                          Cancelar
                        </Link>

                        <Link
                          href={getConfirmationHref(
                            appointment.id,
                            "COMPLETED",
                            statusFilter,
                            searchTerm
                          )}
                          className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-200"
                        >
                          Concluir
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                    <h3 className="font-extrabold text-[#08553F]">
                      Link da teleconsulta
                    </h3>

                    <p className="mt-2 text-sm text-[#878787]">
                      Cole aqui o link do Google Meet, Zoom, Teams ou outra
                      plataforma de atendimento online.
                    </p>

                    <form
                      action={saveMeetingUrl}
                      className="mt-4 flex flex-col gap-3 md:flex-row"
                    >
                      <input
                        type="hidden"
                        name="appointmentId"
                        value={appointment.id}
                      />

                      <input
                        type="url"
                        name="meetingUrl"
                        defaultValue={appointment.meetingUrl ?? ""}
                        placeholder="https://meet.google.com/..."
                        className="min-h-12 flex-1 rounded-2xl border border-[#C6C6C6]/70 bg-white px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B]"
                      />

                      <button
                        type="submit"
                        className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                      >
                        Salvar link
                      </button>
                    </form>
                  </div>

                  <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                    <h3 className="font-extrabold text-[#08553F]">
                      Documentos desta consulta
                    </h3>

                    <div className="mt-4 space-y-3">
                      {appointment.documents.length === 0 && (
                        <p className="text-sm text-[#878787]">
                          Nenhum documento vinculado a esta consulta.
                        </p>
                      )}

                      {appointment.documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-bold text-[#08553F]">
                              {document.name}
                            </p>

                            {document.fileType && (
                              <p className="text-sm text-[#878787]">
                                {document.fileType}
                              </p>
                            )}
                          </div>

                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                          >
                            Abrir documento →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}