import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
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
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

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
    totalAuditLogs,
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
    prisma.auditLog.count(),
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
    },
    {
      title: "Médicos cadastrados",
      value: totalDoctors,
      icon: "👨‍⚕️",
      href: "/dashboard/admin/medicos",
    },
    {
      title: "Médicos aprovados",
      value: approvedDoctors,
      icon: "✅",
      href: "/dashboard/admin/medicos?status=APPROVED",
    },
    {
      title: "Médicos pendentes",
      value: pendingDoctors,
      icon: "⏳",
      href: "/dashboard/admin/medicos?status=PENDING",
    },
    {
      title: "Médicos reprovados",
      value: rejectedDoctors,
      icon: "❌",
      href: "/dashboard/admin/medicos?status=REJECTED",
    },
    {
      title: "Pacientes cadastrados",
      value: totalPatients,
      icon: "🧑",
      href: "/dashboard/admin/pacientes",
    },
    {
      title: "Consultas totais",
      value: totalAppointments,
      icon: "📅",
      href: "/dashboard/admin/consultas",
    },
    {
      title: "Consultas pendentes",
      value: pendingAppointments,
      icon: "⏳",
      href: "/dashboard/admin/consultas?status=PENDING",
    },
    {
      title: "Consultas confirmadas",
      value: confirmedAppointments,
      icon: "✅",
      href: "/dashboard/admin/consultas?status=CONFIRMED",
    },
    {
      title: "Consultas canceladas",
      value: cancelledAppointments,
      icon: "❌",
      href: "/dashboard/admin/consultas?status=CANCELLED",
    },
    {
      title: "Consultas concluídas",
      value: completedAppointments,
      icon: "🏁",
      href: "/dashboard/admin/consultas?status=COMPLETED",
    },
    {
      title: "Documentos enviados",
      value: totalDocuments,
      icon: "📎",
      href: "/dashboard/admin/documentos",
    },
    {
      title: "Logs de auditoria",
      value: totalAuditLogs,
      icon: "📋",
      href: "/dashboard/admin/logs",
    },
    {
      title: "Receita prevista",
      value: formatCurrency(estimatedRevenue),
      icon: "💰",
      href: "/dashboard/admin/consultas",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Central de controle"
          description="Acompanhe médicos, pacientes, consultas, documentos, auditoria e indicadores da plataforma em tempo real."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin/medicos"
              className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Gestão de médicos
            </Link>

            <Link
              href="/dashboard/admin/pacientes"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Gestão de pacientes
            </Link>

            <Link
              href="/dashboard/admin/consultas"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Consultas
            </Link>

            <Link
              href="/dashboard/admin/documentos"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Documentos
            </Link>

            <Link
              href="/dashboard/admin/usuarios"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Usuários
            </Link>

            <Link
              href="/dashboard/admin/logs"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Logs
            </Link>

            <Link
              href="/logout"
              className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              Sair
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                    {card.icon}
                  </div>

                  <p className="mt-5 text-sm font-bold text-[#878787]">
                    {card.title}
                  </p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {card.value}
                  </p>

                  <p className="mt-4 text-sm font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                    Ver detalhes →
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-extrabold text-[#08553F]">
                Resumo operacional
              </h2>

              <p className="mt-2 text-[#878787]">
                Distribuição dos principais status da operação.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Médicos aprovados</span>
                    <span>{approvedDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
                    <div
                      className="h-3 rounded-full bg-[#00CF7B]"
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Médicos pendentes</span>
                    <span>{pendingDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
                    <div
                      className="h-3 rounded-full bg-[#F3EFA1]"
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Médicos reprovados</span>
                    <span>{rejectedDoctors}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Consultas pendentes</span>
                    <span>{pendingAppointments}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
                    <div
                      className="h-3 rounded-full bg-[#F3EFA1]"
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Consultas confirmadas</span>
                    <span>{confirmedAppointments}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
                    <div
                      className="h-3 rounded-full bg-[#00CF7B]"
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Consultas canceladas</span>
                    <span>{cancelledAppointments}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
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
                  <div className="flex justify-between text-sm font-bold text-[#08553F]">
                    <span>Consultas concluídas</span>
                    <span>{completedAppointments}</span>
                  </div>

                  <div className="mt-2 h-3 rounded-full bg-[#F7F4E7]">
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

            <div className="relative overflow-hidden rounded-[2rem] bg-[#08553F] p-8 text-white shadow-sm">
              <div className="absolute -bottom-10 -right-10 text-[9rem] leading-none opacity-10">
                🌿
              </div>

              <div className="relative">
                <h2 className="text-2xl font-extrabold">Status do MVP</h2>

                <p className="mt-4 leading-7 text-white/80">
                  A plataforma já possui autenticação, dashboards,
                  agendamentos, controle de status, perfis, horários médicos,
                  upload de documentos, gestão administrativa e logs de
                  auditoria.
                </p>

                <div className="mt-6 rounded-3xl bg-white/10 p-5">
                  <p className="text-sm font-semibold text-white/70">
                    Próxima prioridade
                  </p>

                  <p className="mt-1 text-xl font-extrabold">
                    Estabilização, paginação e UX
                  </p>
                </div>

                <div className="mt-6 rounded-3xl bg-white/10 p-5">
                  <p className="text-sm font-semibold text-white/70">
                    Receita prevista
                  </p>

                  <p className="mt-1 text-2xl font-extrabold">
                    {formatCurrency(estimatedRevenue)}
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/logs"
                  className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver logs de auditoria
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Últimas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Acompanhe os agendamentos mais recentes da plataforma.
                </p>
              </div>

              <Link
                href="/dashboard/admin/consultas"
                className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Ver todos
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentAppointments.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada.
                  </p>
                </div>
              )}

              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        Paciente: {appointment.patient.user.name}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        Médico: {appointment.doctor.user.name}
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#08553F]">
                        Data: {formatDate(appointment.date)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
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