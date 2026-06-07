import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "CONFIRMED") return "bg-green-100 text-green-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-800";

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
    ? "rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white"
    : "rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100";
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

  return queryString ? `/dashboard/admin/consultas?${queryString}` : "/dashboard/admin/consultas";
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

  const validStatuses = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
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

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Gestão de Consultas
              </h1>

              <p className="mt-3 text-gray-600">
                Visualize, filtre, busque e atualize o status dos agendamentos.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalAppointments}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {pendingAppointments}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Confirmadas</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {confirmedAppointments}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Canceladas</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {cancelledAppointments}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {completedAppointments}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Buscar consulta
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Busque por paciente, médico, e-mail ou observações.
                </p>
              </div>

              {searchTerm && (
                <p className="text-sm text-gray-500">
                  Resultado para:{" "}
                  <span className="font-semibold text-gray-800">
                    {searchTerm}
                  </span>
                </p>
              )}
            </div>

            <form
              action="/dashboard/admin/consultas"
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              {statusFilter !== "ALL" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}

              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por paciente, médico, e-mail ou observação"
                className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Buscar
              </button>

              {(searchTerm || statusFilter !== "ALL") && (
                <Link
                  href="/dashboard/admin/consultas"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-700">
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

          <div className="mt-10 grid gap-4">
            {appointments.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-md">
                Nenhuma consulta encontrada para os critérios informados.
              </div>
            )}

            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {appointment.patient.user.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      Médico: Dr(a). {appointment.doctor.user.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      E-mail do paciente: {appointment.patient.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      E-mail do médico: {appointment.doctor.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Data: {formatDate(appointment.date)}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Observações: {appointment.notes || "Nenhuma observação"}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Criada em: {formatDate(appointment.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
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
                            className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-200"
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
                            className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
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
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-200"
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
                            className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200"
                          >
                            Voltar para pendente
                          </button>
                        </form>
                      )}
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