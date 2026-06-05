import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatus } from "./actions";

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
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "CONFIRMED") return "bg-green-100 text-green-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-800";

  return "bg-gray-100 text-gray-800";
}

export default async function ConsultasMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
    },
    include: {
      patient: {
        include: {
          user: true,
          documents: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Minhas Consultas
              </h1>

              <p className="mt-3 text-gray-600">
                Acompanhe consultas e documentos enviados pelos pacientes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/medico"
                className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Voltar ao Painel
              </Link>

              <Link
                href="/medico/horarios"
                className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
              >
                Minha Agenda
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4">
            {appointments.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Nenhuma consulta encontrada.
                </p>
              </div>
            )}

            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {appointment.patient.user.name}
                      </p>

                      <p className="mt-1 text-gray-600">
                        {formatDate(appointment.date)}
                      </p>

                      {appointment.notes && (
                        <p className="mt-2 text-sm text-gray-500">
                          Observações: {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      <div className="flex flex-wrap gap-2">
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
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="font-semibold text-gray-900">
                      Documentos do paciente
                    </h3>

                    <div className="mt-3 space-y-3">
                      {appointment.patient.documents.length === 0 && (
                        <p className="text-sm text-gray-600">
                          Nenhum documento enviado por este paciente.
                        </p>
                      )}

                      {appointment.patient.documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {document.name}
                            </p>

                            {document.fileType && (
                              <p className="text-sm text-gray-500">
                                {document.fileType}
                              </p>
                            )}
                          </div>

                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-green-700 hover:text-green-800"
                          >
                            Abrir documento
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