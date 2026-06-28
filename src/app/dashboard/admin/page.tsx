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
    pendingDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    appointmentsWithoutMeet,
    recentAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { approvalStatus: "PENDING" } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        meetingUrl: null,
      },
    }),
    prisma.appointment.findMany({
      include: {
        availability: true,
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
      take: 5,
    }),
    prisma.doctor.findMany({
      where: {
        approvalStatus: "PENDING",
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const actionGroups = [
    {
      title: "Operação clínica",
      description: "Gestão diária de médicos, pacientes e consultas.",
      actions: [
        {
          title: "Médicos",
          description: "Aprovar e revisar perfis médicos.",
          href: "/dashboard/admin/medicos",
          icon: "⚕️",
        },
        {
          title: "Pacientes",
          description: "Consultar pacientes cadastrados.",
          href: "/dashboard/admin/pacientes",
          icon: "🧑",
        },
        {
          title: "Consultas",
          description: "Acompanhar agendamentos e status.",
          href: "/dashboard/admin/consultas",
          icon: "📅",
        },
      ],
    },
    {
      title: "Financeiro",
      description: "Pagamentos, repasses, extratos e conciliação.",
      actions: [
        {
          title: "Painel financeiro",
          description: "Abrir dashboard financeiro completo.",
          href: "/dashboard/admin/financeiro",
          icon: "💰",
        },
        {
          title: "Repasses",
          description: "Fechamentos médicos e PDFs.",
          href: "/dashboard/admin/financeiro/repasses",
          icon: "🏦",
        },
        {
          title: "Conciliação",
          description: "Auditar divergências financeiras.",
          href: "/dashboard/admin/financeiro/conciliacao",
          icon: "⚠️",
        },
      ],
    },
    {
      title: "Sistema",
      description: "Configurações, documentos, integrações e auditoria.",
      actions: [
        {
          title: "Integrações",
          description: "Google Calendar e teleconsultas.",
          href: "/dashboard/admin/integracoes",
          icon: "🔗",
        },
        {
          title: "Documentos",
          description: "Arquivos enviados por pacientes.",
          href: "/dashboard/admin/documentos",
          icon: "📎",
        },
        {
          title: "AuditLog",
          description: "Histórico de ações do sistema.",
          href: "/dashboard/admin/logs",
          icon: "📋",
        },
      ],
    },
  ];

  const overviewCards = [
    {
      title: "Usuários",
      value: totalUsers,
      helper: "Contas cadastradas",
      href: "/dashboard/admin/usuarios",
    },
    {
      title: "Médicos",
      value: totalDoctors,
      helper: `${pendingDoctors} aguardando aprovação`,
      href: "/dashboard/admin/medicos",
    },
    {
      title: "Pacientes",
      value: totalPatients,
      helper: "Pacientes cadastrados",
      href: "/dashboard/admin/pacientes",
    },
    {
      title: "Consultas",
      value: totalAppointments,
      helper: `${pendingAppointments} pendentes`,
      href: "/dashboard/admin/consultas",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Painel administrativo"
          description="Acesse os principais módulos da plataforma e acompanhe apenas os pontos que precisam de atenção."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-sm font-semibold text-[#878787]">
                  {card.title}
                </p>

                <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                  {card.value}
                </p>

                <p className="mt-2 text-sm text-[#878787]">{card.helper}</p>
              </Link>
            ))}
          </div>

          <div className="mb-10 grid gap-6 lg:grid-cols-3">
            {actionGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm"
              >
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  {group.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  {group.description}
                </p>

                <div className="mt-6 grid gap-3">
                  {group.actions.map((action) => (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 transition hover:bg-[#F3EFA1]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{action.icon}</div>

                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {action.title}
                          </p>

                          <p className="mt-1 text-sm leading-5 text-[#878787]">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-[#08553F] p-8 text-white shadow-sm">
              <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#00CF7B]">
                Atenção administrativa
              </p>

              <h2 className="mt-6 text-3xl font-extrabold">
                Pontos que merecem revisão
              </h2>

              <div className="mt-6 grid gap-4">
                <Link
                  href="/dashboard/admin/medicos?status=PENDING"
                  className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/20"
                >
                  <p className="text-sm font-semibold text-white/70">
                    Médicos aguardando aprovação
                  </p>

                  <p className="mt-1 text-4xl font-extrabold">
                    {pendingDoctors}
                  </p>
                </Link>

                <Link
                  href="/dashboard/admin/consultas?status=PENDING"
                  className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/20"
                >
                  <p className="text-sm font-semibold text-white/70">
                    Consultas pendentes
                  </p>

                  <p className="mt-1 text-4xl font-extrabold">
                    {pendingAppointments}
                  </p>
                </Link>

                <Link
                  href="/dashboard/admin/financeiro/conciliacao"
                  className="rounded-3xl bg-white/10 p-5 transition hover:bg-white/20"
                >
                  <p className="text-sm font-semibold text-white/70">
                    Consultas ativas sem Meet
                  </p>

                  <p className="mt-1 text-4xl font-extrabold">
                    {appointmentsWithoutMeet}
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Últimas consultas
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Visão rápida dos agendamentos mais recentes.
                  </p>
                </div>

                <Link
                  href="/dashboard/admin/consultas"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver todas
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {recentAppointments.length === 0 ? (
                  <div className="rounded-2xl bg-[#F7F4E7] p-5">
                    <p className="font-bold text-[#08553F]">
                      Nenhuma consulta encontrada.
                    </p>
                  </div>
                ) : (
                  recentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-extrabold text-[#08553F]">
                            {appointment.patient.user.name}
                          </p>

                          <p className="mt-1 text-sm text-[#878787]">
                            Médico: {appointment.doctor.user.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#08553F]">
                            {formatDate(appointment.date)}
                            {appointment.availability
                              ? ` • ${appointment.availability.startTime} às ${appointment.availability.endTime}`
                              : ""}
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
                  ))
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