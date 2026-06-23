import CannaPageHero from "@/components/CannaPageHero";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { createDocument, deletePatientDocument } from "./actions";

type DocumentosPacientePageProps = {
  searchParams?: Promise<{
    erro?: string;
    busca?: string;
    status?: string;
  }>;
};

const allowedStatuses = ["PENDING", "CONFIRMED", "COMPLETED"] as const;

type AllowedStatus = (typeof allowedStatuses)[number];

function isAllowedStatus(status?: string): status is AllowedStatus {
  return allowedStatuses.includes(status as AllowedStatus);
}

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
  if (status === "COMPLETED") return "bg-blue-50 text-blue-700";

  return "bg-gray-50 text-gray-700";
}

function getFilterClass(active: boolean) {
  return active
    ? "rounded-full bg-[#08553F] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
    : "rounded-full border border-[#C6C6C6]/70 bg-white px-5 py-2.5 text-sm font-bold text-[#08553F] shadow-sm transition hover:border-[#00CF7B] hover:bg-[#F3EFA1]";
}

export default async function DocumentosPacientePage({
  searchParams,
}: DocumentosPacientePageProps) {
  const params = await searchParams;
  const erro = params?.erro;
  const busca = params?.busca?.trim().toLowerCase() || "";
  const selectedStatus = isAllowedStatus(params?.status)
    ? params.status
    : undefined;

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
    where: {
      userId,
    },
    include: {
      appointments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "COMPLETED"],
          },
        },
        include: {
          availability: true,
          doctor: {
            include: {
              user: true,
            },
          },
          documents: {
            orderBy: {
              createdAt: "desc",
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
      },
      documents: {
        where: {
          appointmentId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const filteredAppointments = patient.appointments
    .filter((appointment) =>
      selectedStatus ? appointment.status === selectedStatus : true
    )
    .map((appointment) => ({
      ...appointment,
      documents: appointment.documents.filter((document) => {
        if (!busca) return true;

        const doctorName = appointment.doctor.user.name.toLowerCase();
        const specialty = appointment.doctor.specialty.toLowerCase();
        const documentName = document.name.toLowerCase();
        const fileType = document.fileType?.toLowerCase() || "";

        return (
          documentName.includes(busca) ||
          doctorName.includes(busca) ||
          specialty.includes(busca) ||
          fileType.includes(busca)
        );
      }),
    }));

  const filteredOrphanDocuments = patient.documents.filter((document) => {
    if (!busca) return true;

    const documentName = document.name.toLowerCase();
    const fileType = document.fileType?.toLowerCase() || "";

    return documentName.includes(busca) || fileType.includes(busca);
  });

  const totalDocuments =
    patient.documents.length +
    patient.appointments.reduce(
      (total, appointment) => total + appointment.documents.length,
      0
    );

  const visibleDocuments =
    filteredOrphanDocuments.length +
    filteredAppointments.reduce(
      (total, appointment) => total + appointment.documents.length,
      0
    );

  const pendingCount = patient.appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedCount = patient.appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const completedCount = patient.appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Documentos médicos"
          title="Meus documentos"
          description="Envie, organize e acesse exames, laudos, receitas e documentos médicos vinculados às suas consultas."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-10">
          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível concluir a ação
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          <div className="grid items-start gap-8 lg:grid-cols-[390px_1fr]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-7">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                  📎
                </div>

                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Enviar documento
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  Vincule o arquivo a uma consulta para manter seu histórico
                  médico organizado.
                </p>

                <form action={createDocument} className="mt-7 space-y-5">
                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Consulta vinculada
                    </label>

                    <select
                      name="appointmentId"
                      required
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-sm text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    >
                      <option value="">Selecione uma consulta</option>

                      {patient.appointments.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          {formatDate(appointment.date)}{" "}
                          {appointment.availability
                            ? `${appointment.availability.startTime} às ${appointment.availability.endTime}`
                            : "Horário não informado"}{" "}
                          - {appointment.doctor.user.name} -{" "}
                          {getStatusLabel(appointment.status)}
                        </option>
                      ))}
                    </select>

                    {patient.appointments.length === 0 && (
                      <p className="mt-3 rounded-2xl bg-[#F7F4E7] p-4 text-sm font-semibold text-[#878787]">
                        Você precisa ter uma consulta para vincular documentos.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Nome do documento
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Ex: Exame de sangue"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Arquivo
                    </label>

                    <input
                      type="file"
                      name="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-sm text-[#08553F] file:mr-4 file:rounded-full file:border-0 file:bg-[#08553F] file:px-4 file:py-2 file:font-bold file:text-white"
                    />

                    <p className="mt-3 rounded-2xl bg-[#F7F4E7] p-4 text-xs font-semibold leading-5 text-[#878787]">
                      Formatos aceitos: PDF, PNG, JPG, JPEG e WEBP. Limite:
                      10MB.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={patient.appointments.length === 0}
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:bg-[#878787] disabled:text-white"
                  >
                    Enviar documento
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Central de documentos
                    </h2>

                    <p className="mt-1 text-sm text-[#878787]">
                      {visibleDocuments} de {totalDocuments} documento(s)
                      exibido(s).
                    </p>
                  </div>

                  <Link
                    href="/medicos"
                    className="rounded-full bg-[#00CF7B] px-5 py-2.5 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                  >
                    Agendar consulta
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-[#F7F4E7] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                      Total
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                      {totalDocuments}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F7F4E7] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                      Pendentes
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                      {pendingCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F7F4E7] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                      Confirmadas
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                      {confirmedCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F7F4E7] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                      Concluídas
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                      {completedCount}
                    </p>
                  </div>
                </div>

                <form className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                  <input
                    type="text"
                    name="busca"
                    defaultValue={busca}
                    placeholder="Buscar por documento, médico, especialidade ou tipo..."
                    className="rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                  />

                  <select
                    name="status"
                    defaultValue={selectedStatus || ""}
                    className="rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                  >
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="CONFIRMED">Confirmadas</option>
                    <option value="COMPLETED">Concluídas</option>
                  </select>

                  <button
                    type="submit"
                    className="rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Filtrar
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/paciente/documentos"
                    className={getFilterClass(!selectedStatus && !busca)}
                  >
                    Limpar filtros
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {visibleDocuments === 0 && (
                  <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                    <p className="font-bold text-[#08553F]">
                      Nenhum documento encontrado.
                    </p>

                    <p className="mt-2 text-sm text-[#878787]">
                      Tente ajustar os filtros ou envie um novo documento.
                    </p>
                  </div>
                )}

                {filteredAppointments.map((appointment) =>
                  appointment.documents.length > 0 ? (
                    <div
                      key={appointment.id}
                      className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
                    >
                      <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                      <div className="p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-extrabold text-[#08553F]">
                              {appointment.doctor.user.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              {appointment.doctor.specialty}
                            </p>

                            <p className="mt-2 text-sm font-bold text-[#08553F]">
                              {formatDate(appointment.date)}{" "}
                              {appointment.availability
                                ? `• ${appointment.availability.startTime} às ${appointment.availability.endTime}`
                                : "• Horário não informado"}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-4 py-2 text-xs font-extrabold ${getStatusClass(
                              appointment.status
                            )}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <div className="mt-5 space-y-3">
                          {appointment.documents.map((document) => (
                            <div
                              key={document.id}
                              className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-4"
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-extrabold text-[#08553F]">
                                    {document.name}
                                  </p>

                                  <p className="mt-1 text-sm text-[#878787]">
                                    {document.fileType || "Tipo não informado"}
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-[#08553F]">
                                    Enviado em {formatDate(document.createdAt)}
                                  </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                                  <a
                                    href={document.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
                                  >
                                    Abrir documento →
                                  </a>

                                  <form action={deletePatientDocument}>
                                    <input
                                      type="hidden"
                                      name="documentId"
                                      value={document.id}
                                    />

                                    <ConfirmSubmitButton
                                      message="Tem certeza que deseja excluir este documento?"
                                      loadingText="Excluindo..."
                                      className="inline-flex w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                                    >
                                      Excluir
                                    </ConfirmSubmitButton>
                                  </form>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null
                )}

                {filteredOrphanDocuments.length > 0 && (
                  <div className="overflow-hidden rounded-[2rem] border border-[#F3EFA1] bg-white shadow-sm">
                    <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

                    <div className="p-6">
                      <h3 className="text-lg font-extrabold text-[#08553F]">
                        Documentos sem consulta vinculada
                      </h3>

                      <p className="mt-2 text-sm text-[#878787]">
                        Estes documentos foram enviados antes da organização por
                        consulta.
                      </p>

                      <div className="mt-5 space-y-3">
                        {filteredOrphanDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-4"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-extrabold text-[#08553F]">
                                  {document.name}
                                </p>

                                <p className="mt-1 text-sm text-[#878787]">
                                  {document.fileType || "Tipo não informado"}
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#08553F]">
                                  Enviado em {formatDate(document.createdAt)}
                                </p>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
                                >
                                  Abrir documento →
                                </a>

                                <form action={deletePatientDocument}>
                                  <input
                                    type="hidden"
                                    name="documentId"
                                    value={document.id}
                                  />

                                  <ConfirmSubmitButton
                                    message="Tem certeza que deseja excluir este documento?"
                                    loadingText="Excluindo..."
                                    className="inline-flex w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                                  >
                                    Excluir
                                  </ConfirmSubmitButton>
                                </form>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}