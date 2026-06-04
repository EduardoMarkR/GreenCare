import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const [
    totalDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    appointments,
  ] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.appointment.count({
      where: {
        status: "CONFIRMED",
      },
    }),
    prisma.appointment.count({
      where: {
        status: "CANCELLED",
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.appointment.findMany({
      include: {
        doctor: true,
      },
    }),
  ]);

  const estimatedRevenue = appointments.reduce((total, appointment) => {
    return total + Number(appointment.doctor.price);
  }, 0);

  const cards = [
    {
      title: "Médicos cadastrados",
      value: totalDoctors,
      icon: "👨‍⚕️",
      href: "/medicos",
    },
    {
      title: "Pacientes cadastrados",
      value: totalPatients,
      icon: "🧑",
      href: "/admin/agendamentos",
    },
    {
      title: "Consultas totais",
      value: totalAppointments,
      icon: "📅",
      href: "/admin/agendamentos",
    },
    {
      title: "Consultas pendentes",
      value: pendingAppointments,
      icon: "⏳",
      href: "/admin/agendamentos",
    },
    {
      title: "Consultas confirmadas",
      value: confirmedAppointments,
      icon: "✅",
      href: "/admin/agendamentos",
    },
    {
      title: "Consultas canceladas",
      value: cancelledAppointments,
      icon: "❌",
      href: "/admin/agendamentos",
    },
    {
      title: "Consultas concluídas",
      value: completedAppointments,
      icon: "🏁",
      href: "/admin/agendamentos",
    },
    {
      title: "Receita prevista",
      value: formatCurrency(estimatedRevenue),
      icon: "💰",
      href: "/admin/agendamentos",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Dashboard Admin
              </h1>

              <p className="mt-3 text-gray-600">
                Acompanhe os principais indicadores da plataforma GreenCare.
              </p>
            </div>

            <Link
              href="/admin/agendamentos"
              className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Ver agendamentos
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-3xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-4xl">{card.icon}</div>

                <p className="mt-5 text-sm font-medium text-gray-500">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-md lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Resumo operacional
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Consultas pendentes</span>
                    <span>{pendingAppointments}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-yellow-400"
                      style={{
                        width:
                          totalAppointments > 0
                            ? `${(pendingAppointments / totalAppointments) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Consultas confirmadas</span>
                    <span>{confirmedAppointments}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-green-500"
                      style={{
                        width:
                          totalAppointments > 0
                            ? `${(confirmedAppointments / totalAppointments) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Consultas canceladas</span>
                    <span>{cancelledAppointments}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-red-500"
                      style={{
                        width:
                          totalAppointments > 0
                            ? `${(cancelledAppointments / totalAppointments) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-green-700 p-6 text-white shadow-md">
              <h2 className="text-2xl font-bold">Status do MVP</h2>

              <p className="mt-4 text-green-50">
                A plataforma já possui listagem de médicos, busca, perfil
                individual, horários, agendamento e dashboards.
              </p>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-green-50">Próxima prioridade</p>
                <p className="mt-1 text-xl font-bold">
                  Login e controle de acesso
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}