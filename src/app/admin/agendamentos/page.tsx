import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export default async function AdminAgendamentosPage() {
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
            Agendamentos
          </h1>

          <p className="mt-3 text-gray-600">
            Visualize todos os agendamentos realizados na plataforma.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-md">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                Nenhum agendamento encontrado.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-900">
                      Paciente
                    </th>

                    <th className="p-4 text-left font-semibold text-gray-900">
                      Médico
                    </th>

                    <th className="p-4 text-left font-semibold text-gray-900">
                      Data
                    </th>

                    <th className="p-4 text-left font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-gray-200 transition hover:bg-gray-50"
                    >
                      <td className="p-4 text-gray-900">
                        {appointment.patient.user.name}
                      </td>

                      <td className="p-4 text-gray-900">
                        {appointment.doctor.user.name}
                      </td>

                      <td className="p-4 text-gray-900">
                        {new Intl.DateTimeFormat("pt-BR").format(
                          appointment.date
                        )}
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}