import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatus } from "./actions";

type AdminAgendamentosPageProps = {
  searchParams?: Promise<{
    status?: string;
    busca?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-800";
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getFilterClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-[#08553F] px-5 py-2 text-sm font-bold text-white shadow-sm"
    : "rounded-full border border-[#08553F]/30 bg-white px-5 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]";
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
    ? `/dashboard/admin/consultas?${queryString}`
    : "/dashboard/admin/consultas";
}

export default async function AdminAgendamentosPage({
  searchParams,
}: AdminAgendamentosPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedStatus = params?.status ?? "ALL";
  const searchTerm = params?.busca?.trim() ?? "";

  const validStatuses = [
    "ALL",
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
  ];

  const statusFilter = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : "ALL";

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(statusFilter !== "ALL"
        ? {
            status: statusFilter as
              | "PENDING"
              | "CONFIRMED"
              | "CANCELLED"
              | "COMPLETED",
          }
        : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                notes: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                patient: {
                  user: {
                    name: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                patient: {
                  user: {
                    email: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                doctor: {
                  user: {
                    name: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                doctor: {
                  user: {
                    email: {
                      contains: searchTerm,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalAppointments = await prisma.appointment.count();

  const pendingAppointments = await prisma.appointment.count({
    where: {
      status: "PENDING",
    },
  });

  const confirmedAppointments = await prisma.appointment.count({
    where: {
      status: "CONFIRMED",
    },
  });

  const cancelledAppointments = await prisma.appointment.count({
    where: {
      status: "CANCELLED",
    },
  });

  const completedAppointments = await prisma.appointment.count({
    where: {
      status: "COMPLETED",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Gestão de consultas"
          description="Visualize, filtre, busque e atualize o status dos agendamentos da plataforma."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Total", totalAppointments, "from-[#08553F] to-[#00CF7B]"],
              ["Pendentes", pendingAppointments, "from-[#F3EFA1] to-[#00CF7B]"],
              ["Confirmadas", confirmedAppointments, "from-[#08553F] to-[#00CF7B]"],
              ["Canceladas", cancelledAppointments, "from-red-400 to-red-600"],
              ["Concluídas", completedAppointments, "from-blue-400 to-blue-600"],
            ].map(([label, value, gradient]) => (
              <div
                key={String(label)}
                className="overflow-hidden rounded-[2rem] bg-white shadow-sm"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                <div className="p-5">
                  <p className="text-sm font-bold text-[#878787]">{label}</p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#08553F]">
                    Buscar consulta
                  </p>

                  <p className="mt-1 text-sm text-[#878787]">
                    Busque por paciente, médico, e-mail ou observações.
                  </p>
                </div>

                {searchTerm && (
                  <p className="text-sm text-[#878787]">
                    Resultado para:{" "}
                    <span className="font-bold text-[#08553F]">
                      {searchTerm}
                    </span>
                  </p>
                )}
              </div>

              <form
                action="/dashboard/admin/consultas"
                className="mt-5 flex flex-col gap-3 md:flex-row"
              >
                {statusFilter !== "ALL" && (
                  <input type="hidden" name="status" value={statusFilter} />
                )}

                <input
                  type="text"
                  name="busca"
                  defaultValue={searchTerm}
                  placeholder="Buscar por paciente, médico, e-mail ou observação"
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
                    href="/dashboard/admin/consultas"
                    className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                  >
                    Limpar
                  </Link>
                )}
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[#08553F]">
                Filtrar por status
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={getFilterHref("ALL", searchTerm)}
                  className={getFilterClass(statusFilter === "ALL")}
                >
                  Todas ({totalAppointments})
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
                  href={getFilterHref("CANCELLED", searchTerm)}
                  className={getFilterClass(statusFilter === "CANCELLED")}
                >
                  Canceladas ({cancelledAppointments})
                </Link>

                <Link
                  href={getFilterHref("COMPLETED", searchTerm)}
                  className={getFilterClass(statusFilter === "COMPLETED")}
                >
                  Concluídas ({completedAppointments})
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhuma consulta encontrada para os critérios informados.
                </p>
              </div>
            )}

            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#08553F]">
                        {appointment.patient.user.name}
                      </h2>

                      <div className="mt-5 grid gap-2 text-sm text-[#878787] sm:grid-cols-2">
                        <p>
                          <strong className="text-[#08553F]">Médico:</strong>{" "}
                          Dr(a). {appointment.doctor.user.name}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            E-mail do paciente:
                          </strong>{" "}
                          {appointment.patient.user.email}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            E-mail do médico:
                          </strong>{" "}
                          {appointment.doctor.user.email}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Data:</strong>{" "}
                          {formatDate(appointment.date)}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Criada em:</strong>{" "}
                          {formatDate(appointment.createdAt)}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Observações:
                          </strong>{" "}
                          {appointment.notes || "Nenhuma observação"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
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

                        {appointment.status !== "COMPLETED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="COMPLETED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-200"
                            >
                              Concluir
                            </button>
                          </form>
                        )}

                        {appointment.status !== "CANCELLED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="CANCELLED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                            >
                              Cancelar
                            </button>
                          </form>
                        )}

                        {appointment.status !== "PENDING" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="PENDING"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                            >
                              Voltar para pendente
                            </button>
                          </form>
                        )}
                      </div>
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