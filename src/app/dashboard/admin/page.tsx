import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

export default async function DashboardAdminPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const [
    totalUsers,
    totalDoctors,
    approvedDoctors,
    pendingDoctors,
    rejectedDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    totalDocuments,
    appointments,
    recentAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.doctor.count({
      where: {
        approvalStatus: "APPROVED",
      },
    }),
    prisma.doctor.count({
      where: {
        approvalStatus: "PENDING",
      },
    }),
    prisma.doctor.count({
      where: {
        approvalStatus: "REJECTED",
      },
    }),
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
    prisma.document.count(),
    prisma.appointment.findMany({
      include: {
        doctor: true,
      },
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
    prisma.appointment.findMany({
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
      take: 6,
    }),
  ]);

  const estimatedRevenue = appointments.reduce((total, appointment) => {
    return total + Number(appointment.doctor.price);
  }, 0);

  const cards = [
    {
      title: "Usuários cadastrados",
      value: totalUsers,
      icon: "👥",
      href: "/dashboard/admin/usuarios",
      color: "text-purple-700",
    },
    {
      title: "Médicos cadastrados",
      value: totalDoctors,
      icon: "👨‍⚕️",
      href: "/dashboard/admin/medicos",
      color: "text-green-700",
    },
    {
      title: "Médicos aprovados",
      value: approvedDoctors,
      icon: "✅",
      href: "/dashboard/admin/medicos?status=APPROVED",
      color: "text-green-700",
    },
    {
      title: "Médicos pendentes",
      value: pendingDoctors,
      icon: "⏳",
      href: "/dashboard/admin/medicos?status=PENDING",
      color: "text-yellow-600",
    },
    {
      title: "Médicos reprovados",
      value: rejectedDoctors,
      icon: "❌",
      href: "/dashboard/admin/medicos?status=REJECTED",
      color: "text-red-600",
    },
    {
      title: "Pacientes cadastrados",
      value: totalPatients,
      icon: "🧑",
      href: "/dashboard/admin/pacientes",
      color: "text-blue-700",
    },
    {
      title: "Consultas totais",
      value: totalAppointments,
      icon: "📅",
      href: "/dashboard/admin/consultas",
      color: "text-green-700",
    },
    {
      title: "Consultas pendentes",
      value: pendingAppointments,
      icon: "⏳",
      href: "/dashboard/admin/consultas?status=PENDING",
      color: "text-yellow-600",
    },
    {
      title: "Consultas confirmadas",
      value: confirmedAppointments,
      icon: "✅",
      href: "/dashboard/admin/consultas?status=CONFIRMED",
      color: "text-green-700",
    },
    {
      title: "Consultas canceladas",
      value: cancelledAppointments,
      icon: "❌",
      href: "/dashboard/admin/consultas?status=CANCELLED",
      color: "text-red-600",
    },
    {
      title: "Consultas concluídas",
      value: completedAppointments,
      icon: "🏁",
      href: "/dashboard/admin/consultas?status=COMPLETED",
      color: "text-blue-700",
    },
    {
      title: "Documentos enviados",
      value: totalDocuments,
      icon: "📎",
      href: "/dashboard/admin/documentos",
      color: "text-blue-700",
    },
    {
      title: "Receita prevista",
      value: formatCurrency(estimatedRevenue),
      icon: "💰",
      href: "/dashboard/admin/consultas",
      color: "text-green-700",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Dashboard Admin
              </h1>

              <p className="mt-4 text-gray-600">
                Acompanhe os principais indicadores da plataforma GreenCare.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Link
                href="/dashboard/admin/medicos"
                className="rounded-xl border border-green-600 px-5 py-3 text-center font-semibold text-green-700 transition hover:bg-green-50"
              >
                Gestão de Médicos
              </Link>

              <Link
                href="/dashboard/admin/pacientes"
                className="rounded-xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Gestão de Pacientes
              </Link>

              <Link
                href="/dashboard/admin/documentos"
                className="rounded-xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Gestão de Documentos
              </Link>

              <Link
                href="/dashboard/admin/usuarios"
                className="rounded-xl border border-purple-600 px-5 py-3 text-center font-semibold text-purple-700 transition hover:bg-purple-50"
              >
                Gestão de Usuários
              </Link>

              <Link
                href="/dashboard/admin/consultas"
                className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
              >
                Ver consultas
              </Link>

              <Link
                href="/logout"
                className="rounded-xl bg-red-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-red-700"
              >
                Sair
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                <p className={`mt-2 text-3xl font-bold ${card.color}`}>
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

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Médicos aprovados</span>
                    <span>{approvedDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-green-500"
                      style={{
                        width:
                          totalDoctors > 0
                            ? `${(approvedDoctors / totalDoctors) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Médicos pendentes</span>
                    <span>{pendingDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-yellow-400"
                      style={{
                        width:
                          totalDoctors > 0
                            ? `${(pendingDoctors / totalDoctors) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Médicos reprovados</span>
                    <span>{rejectedDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-red-500"
                      style={{
                        width:
                          totalDoctors > 0
                            ? `${(rejectedDoctors / totalDoctors) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

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

                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Consultas concluídas</span>
                    <span>{completedAppointments}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{
                        width:
                          totalAppointments > 0
                            ? `${(completedAppointments / totalAppointments) * 100}%`
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
                A plataforma já possui autenticação, dashboards, agendamentos,
                controle de status, perfis, horários médicos, upload de
                documentos e gestão administrativa completa.
              </p>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-green-50">Próxima prioridade</p>

                <p className="mt-1 text-xl font-bold">
                  Permissões e ações avançadas
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-green-50">Receita prevista</p>

                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(estimatedRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-white p-6 shadow-md">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Últimas consultas
                </h2>

                <p className="mt-2 text-gray-600">
                  Acompanhe os agendamentos mais recentes da plataforma.
                </p>
              </div>

              <Link
                href="/dashboard/admin/consultas"
                className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Ver todos
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentAppointments.length === 0 && (
                <p className="text-gray-600">Nenhuma consulta encontrada.</p>
              )}

              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Paciente: {appointment.patient.user.name}
                      </p>

                      <p className="text-sm text-gray-600">
                        Médico: {appointment.doctor.user.name}
                      </p>

                      <p className="text-sm text-gray-600">
                        Data: {formatDate(appointment.date)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
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