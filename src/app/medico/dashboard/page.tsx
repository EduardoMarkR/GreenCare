import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { confirmAppointment, cancelAppointment } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getStatusStyle(status: string) {
  if (status === "CONFIRMED") {
    return "bg-green-100 text-green-800";
  }

  if (status === "CANCELLED") {
    return "bg-red-100 text-red-800";
  }

  if (status === "COMPLETED") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-yellow-100 text-yellow-800";
}

function getStatusLabel(status: string) {
  if (status === "CONFIRMED") return "Confirmado";
  if (status === "CANCELLED") return "Cancelado";
  if (status === "COMPLETED") return "Concluído";
  return "Pendente";
}

export default async function MedicoDashboardPage() {
  const appointments = await prisma.appointment.findMany({
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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Dashboard Médico
          </h1>

          <p className="mt-3 text-gray-600">
            Acompanhe os agendamentos recebidos.
          </p>

          <div className="mt-10 grid gap-6">
            {appointments.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl bg-white p-6 shadow-md"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {appointment.patient.user.name}
                      </h2>

                      <p className="mt-1 text-gray-600">
                        Médico: {appointment.doctor.user.name}
                      </p>

                      <p className="mt-1 text-gray-600">
                        Data: {formatDate(appointment.date)}
                      </p>

                      {appointment.notes && (
                        <p className="mt-3 text-gray-700">
                          <strong>Motivo:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      {appointment.status === "PENDING" && (
                        <div className="flex gap-3">
                          <form
                            action={confirmAppointment.bind(
                              null,
                              appointment.id
                            )}
                          >
                            <button
                              type="submit"
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                              Confirmar
                            </button>
                          </form>

                          <form
                            action={cancelAppointment.bind(
                              null,
                              appointment.id
                            )}
                          >
                            <button
                              type="submit"
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                              Cancelar
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}