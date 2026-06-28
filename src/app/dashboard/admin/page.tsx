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

function getPercent(value: number, total: number) {
  if (total <= 0) return "0%";

  return `${Math.min((value / total) * 100, 100)}%`;
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
    connectedDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    totalMeetAppointments,
    appointmentsWithoutMeet,
    totalDocuments,
    totalAuditLogs,
    totalMedicalRecords,
    totalPrescriptions,
    revenueAppointments,
    recentAppointments,
    recentDoctors,
    recentDocuments,
    recentLogs,
    totalPayouts,
    totalPayoutAmount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.doctor.count({ where: { approvalStatus: "PENDING" } }),
    prisma.doctor.count({ where: { approvalStatus: "REJECTED" } }),
    prisma.doctor.count({
      where: {
        googleCalendarConnection: {
          isNot: null,
        },
      },
    }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({
      where: {
        meetingUrl: {
          not: null,
        },
      },
    }),
    prisma.appointment.count({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        meetingUrl: null,
      },
    }),
    prisma.document.count(),
    prisma.auditLog.count(),
    prisma.medicalRecord.count(),
    prisma.prescription.count(),
    prisma.appointment.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      include: {
        doctor: true,
      },
    }),
    prisma.appointment.findMany({
      include: {
        availability: true,
        medicalRecord: true,
        prescription: true,
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
    prisma.doctor.findMany({
      where: {
        approvalStatus: "PENDING",
      },
      include: {
        user: true,
        googleCalendarConnection: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.document.findMany({
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.doctorPayout.count(),
    prisma.doctorPayout.findMany(),
  ]);

  const totalPayoutAmountValue = totalPayoutAmount.reduce((total, payout) => {
    return total + Number(payout.amount);
  }, 0);

  const estimatedRevenue = revenueAppointments.reduce((total, appointment) => {
    return total + Number(appointment.doctor.price);
  }, 0);

  const averageTicket =
    revenueAppointments.length > 0
      ? estimatedRevenue / revenueAppointments.length
      : 0;

  const quickActions = [
    {
      title: "Médicos",
      description: "Aprovar, reprovar e revisar perfis médicos.",
      href: "/dashboard/admin/medicos",
      icon: "⚕️",
      style: "bg-[#00CF7B] text-[#08553F]",
    },
    {
      title: "Pacientes",
      description: "Consultar pacientes, documentos e histórico.",
      href: "/dashboard/admin/pacientes",
      icon: "🧑",
      style: "bg-white text-[#08553F]",
    },
    {
      title: "Consultas",
      description: "Acompanhar agendamentos, Meet e status.",
      href: "/dashboard/admin/consultas",
      icon: "📅",
      style: "bg-[#08553F] text-white",
    },
    {
      title: "Financeiro",
      description: "Receita, projeções e ranking médico.",
      href: "/dashboard/admin/financeiro",
      icon: "💰",
      style: "bg-[#F3EFA1] text-[#08553F]",
    },
    {
      title: "Repasses",
      description: "Registrar e acompanhar pagamentos médicos.",
      href: "/dashboard/admin/financeiro/repasses",
      icon: "🏦",
      style: "bg-white text-[#08553F]",
    },
    {
      title: "Integrações",
      description: "Google Calendar e teleconsultas.",
      href: "/dashboard/admin/integracoes",
      icon: "🔗",
      style: "bg-white text-[#08553F]",
    },
    {
      title: "Documentos",
      description: "Visualizar arquivos enviados por pacientes.",
      href: "/dashboard/admin/documentos",
      icon: "📎",
      style: "bg-white text-[#08553F]",
    },
    {
      title: "Logs",
      description: "Auditar ações administrativas.",
      href: "/dashboard/admin/logs",
      icon: "📋",
      style: "bg-white text-[#08553F]",
    },
  ];

  const mainMetrics = [
    {
      title: "Usuários",
      value: totalUsers,
      helper: "Contas cadastradas",
      href: "/dashboard/admin/usuarios",
      icon: "👥",
      gradient: "from-[#08553F] to-[#00CF7B]",
    },
    {
      title: "Pacientes",
      value: totalPatients,
      helper: "Pacientes ativos no sistema",
      href: "/dashboard/admin/pacientes",
      icon: "🧑",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      title: "Médicos",
      value: totalDoctors,
      helper: `${pendingDoctors} aguardando análise`,
      href: "/dashboard/admin/medicos",
      icon: "⚕️",
      gradient: "from-[#F3EFA1] to-[#00CF7B]",
    },
    {
      title: "Google conectado",
      value: connectedDoctors,
      helper: `${totalDoctors} médicos cadastrados`,
      href: "/dashboard/admin/integracoes",
      icon: "🔗",
      gradient: "from-orange-400 to-orange-700",
    },
    {
      title: "Teleconsultas",
      value: totalMeetAppointments,
      helper: "Consultas com Google Meet",
      href: "/dashboard/admin/consultas",
      icon: "🎥",
      gradient: "from-cyan-400 to-cyan-700",
    },
    {
      title: "Consultas sem Meet",
      value: appointmentsWithoutMeet,
      helper: "Pendentes/confirmadas sem link",
      href: "/dashboard/admin/consultas",
      icon: "⚠️",
      gradient: "from-red-400 to-red-700",
    },
    {
      title: "Consultas",
      value: totalAppointments,
      helper: `${pendingAppointments} pendentes`,
      href: "/dashboard/admin/consultas",
      icon: "📅",
      gradient: "from-[#08553F] to-[#00CF7B]",
    },
    {
      title: "Documentos",
      value: totalDocuments,
      helper: "Arquivos enviados",
      href: "/dashboard/admin/documentos",
      icon: "📎",
      gradient: "from-purple-400 to-purple-700",
    },
    {
      title: "Receita prevista",
      value: formatCurrency(estimatedRevenue),
      helper: "Consultas confirmadas/concluídas",
      href: "/dashboard/admin/financeiro",
      icon: "💰",
      gradient: "from-emerald-400 to-emerald-700",
    },
    {
      title: "Ticket médio",
      value: formatCurrency(averageTicket),
      helper: "Média por consulta paga",
      href: "/dashboard/admin/financeiro",
      icon: "💵",
      gradient: "from-lime-400 to-lime-700",
    },
    {
      title: "Repasses",
      value: formatCurrency(totalPayoutAmountValue),
      helper: `${totalPayouts} repasse(s) registrado(s)`,
      href: "/dashboard/admin/financeiro/repasses",
      icon: "🏦",
      gradient: "from-teal-400 to-teal-700",
    },
    {
      title: "Prontuários",
      value: totalMedicalRecords,
      helper: "Prontuários emitidos",
      href: "/dashboard/admin/consultas",
      icon: "🗂️",
      gradient: "from-indigo-400 to-indigo-700",
    },
    {
      title: "Receitas",
      value: totalPrescriptions,
      helper: "Receitas cadastradas",
      href: "/dashboard/admin/consultas",
      icon: "📄",
      gradient: "from-pink-400 to-pink-700",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Central de controle"
          description="Acompanhe indicadores, aprovações, consultas, Google Meet, documentos e auditoria da plataforma em tempo real."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`group rounded-[2rem] border border-[#C6C6C6]/60 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${action.style}`}
              >
                <div className="text-3xl">{action.icon}</div>

                <p className="mt-4 text-lg font-extrabold">{action.title}</p>

                <p className="mt-2 text-sm leading-5 opacity-75">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {mainMetrics.map((metric) => (
                <Link
                  key={metric.title}
                  href={metric.href}
                  className="group overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`h-2 bg-gradient-to-r ${metric.gradient}`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[#878787]">
                          {metric.title}
                        </p>

                        <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                          {metric.value}
                        </p>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                        {metric.icon}
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold text-[#878787]">
                      {metric.helper}
                    </p>

                    <p className="mt-5 text-sm font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                      Ver detalhes →
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <aside className="relative overflow-hidden rounded-[2rem] bg-[#08553F] p-8 text-white shadow-sm">
              <div className="absolute -bottom-10 -right-10 text-[9rem] leading-none opacity-10">
                🌿
              </div>

              <div className="relative">
                <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#00CF7B]">
                  Status operacional
                </p>

                <h2 className="mt-6 text-3xl font-extrabold">
                  Plataforma em operação
                </h2>

                <p className="mt-4 leading-7 text-white/75">
                  O sistema já possui autenticação por perfil, dashboards,
                  agenda médica, Google Calendar, Google Meet, documentos,
                  prontuários, receitas e auditoria.
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Médicos pendentes
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {pendingDoctors}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Consultas pendentes
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {pendingAppointments}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Médicos com Google
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {connectedDoctors}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Logs registrados
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {totalAuditLogs}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/admin/logs"
                  className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver auditoria
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm lg:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Saúde da operação
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Distribuição dos principais status da plataforma.
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/consultas"
                  className="rounded-2xl border border-[#08553F]/30 px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver consultas
                </Link>
              </div>

              <div className="mt-8 space-y-6">
                {[
                  ["Médicos aprovados", approvedDoctors, totalDoctors, "#00CF7B"],
                  ["Médicos pendentes", pendingDoctors, totalDoctors, "#F3EFA1"],
                  ["Médicos reprovados", rejectedDoctors, totalDoctors, "#ef4444"],
                  ["Médicos com Google", connectedDoctors, totalDoctors, "#f97316"],
                  [
                    "Consultas pendentes",
                    pendingAppointments,
                    totalAppointments,
                    "#F3EFA1",
                  ],
                  [
                    "Consultas confirmadas",
                    confirmedAppointments,
                    totalAppointments,
                    "#00CF7B",
                  ],
                  [
                    "Consultas com Meet",
                    totalMeetAppointments,
                    totalAppointments,
                    "#06b6d4",
                  ],
                  [
                    "Consultas canceladas",
                    cancelledAppointments,
                    totalAppointments,
                    "#ef4444",
                  ],
                  [
                    "Consultas concluídas",
                    completedAppointments,
                    totalAppointments,
                    "#3b82f6",
                  ],
                ].map(([label, value, total, color]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between gap-4 text-sm font-bold text-[#08553F]">
                      <span>{label}</span>
                      <span>
                        {value} / {total}
                      </span>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#F7F4E7]">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          width: getPercent(Number(value), Number(total)),
                          backgroundColor: String(color),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-[#08553F]">
                Pendências críticas
              </h2>

              <p className="mt-2 text-[#878787]">
                Itens que exigem atenção administrativa.
              </p>

              <div className="mt-6 space-y-4">
                <Link
                  href="/dashboard/admin/medicos?status=PENDING"
                  className="block rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <p className="text-sm font-bold text-[#878787]">
                    Médicos aguardando aprovação
                  </p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {pendingDoctors}
                  </p>
                </Link>

                <Link
                  href="/dashboard/admin/consultas?status=PENDING"
                  className="block rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <p className="text-sm font-bold text-[#878787]">
                    Consultas aguardando confirmação
                  </p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {pendingAppointments}
                  </p>
                </Link>

                <Link
                  href="/dashboard/admin/consultas"
                  className="block rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <p className="text-sm font-bold text-[#878787]">
                    Consultas ativas sem Meet
                  </p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {appointmentsWithoutMeet}
                  </p>
                </Link>

                <Link
                  href="/dashboard/admin/documentos"
                  className="block rounded-3xl bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                >
                  <p className="text-sm font-bold text-[#878787]">
                    Documentos enviados
                  </p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {totalDocuments}
                  </p>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm xl:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Últimas consultas
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Agendamentos recentes com status, horário e teleconsulta.
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

                        {appointment.availability ? (
                          <p className="mt-1 text-sm font-bold text-[#08553F]">
                            Horário: {appointment.availability.startTime} às{" "}
                            {appointment.availability.endTime}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-bold text-[#878787]">
                            Horário não informado
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {appointment.meetingUrl ? (
                            <a
                              href={appointment.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                            >
                              Abrir Meet →
                            </a>
                          ) : (
                            <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
                              Sem Meet
                            </span>
                          )}

                          {appointment.medicalRecord && (
                            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                              Prontuário
                            </span>
                          )}

                          {appointment.prescription && (
                            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
                              Receita
                            </span>
                          )}
                        </div>
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

            <div className="grid gap-6">
              <div className="rounded-[2rem] bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Médicos pendentes
                    </h2>

                    <p className="mt-2 text-sm text-[#878787]">
                      Últimas candidaturas em análise.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/admin/medicos?status=PENDING"
                    className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]"
                  >
                    Ver
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {recentDoctors.length === 0 && (
                    <p className="rounded-2xl bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                      Nenhum médico pendente.
                    </p>
                  )}

                  {recentDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="rounded-2xl bg-[#F7F4E7] p-4"
                    >
                      <p className="font-bold text-[#08553F]">
                        {doctor.user.name}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        CRM {doctor.crm}/{doctor.crmUf} • {doctor.specialty}
                      </p>

                      <p className="mt-2 text-xs font-bold text-[#08553F]">
                        {doctor.googleCalendarConnection
                          ? "Google conectado"
                          : "Google não conectado"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Documentos recentes
                    </h2>

                    <p className="mt-2 text-sm text-[#878787]">
                      Últimos arquivos enviados.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/admin/documentos"
                    className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]"
                  >
                    Ver
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {recentDocuments.length === 0 && (
                    <p className="rounded-2xl bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                      Nenhum documento enviado.
                    </p>
                  )}

                  {recentDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl bg-[#F7F4E7] p-4"
                    >
                      <p className="font-bold text-[#08553F]">
                        {document.name}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        {document.patient.user.name} •{" "}
                        {formatDate(document.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Auditoria recente
                    </h2>

                    <p className="mt-2 text-sm text-[#878787]">
                      Últimas ações administrativas.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/admin/logs"
                    className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]"
                  >
                    Ver
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {recentLogs.length === 0 && (
                    <p className="rounded-2xl bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                      Nenhum log registrado.
                    </p>
                  )}

                  {recentLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl bg-[#F7F4E7] p-4">
                      <p className="font-bold text-[#08553F]">{log.action}</p>

                      <p className="mt-1 text-sm text-[#878787]">
                        {log.user?.name ?? "Usuário removido"} •{" "}
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#08553F]">
                Próxima evolução administrativa
              </h2>

              <p className="mt-1 text-sm text-[#878787]">
                O próximo passo é evoluir relatórios financeiros, filtros por período e exportação administrativa da plataforma.
              </p>
            </div>

            <Link
              href="/dashboard/admin/financeiro"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Revisar financeiro
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}