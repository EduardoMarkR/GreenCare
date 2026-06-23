import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type HistoricoPacientePageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

type AppointmentStatusFilter =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

const allowedStatusFilters: AppointmentStatusFilter[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "COMPLETED") return "Concluída";
  if (status === "CANCELLED") return "Cancelada";

  return status;
}

function getStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "COMPLETED") return "bg-blue-50 text-blue-700";
  if (status === "CANCELLED") return "bg-red-50 text-red-700";

  return "bg-gray-50 text-gray-700";
}

function getFilterHref(status?: string) {
  return status
    ? `/dashboard/paciente/historico?status=${status}`
    : "/dashboard/paciente/historico";
}

function getFilterClass(active: boolean) {
  return active
    ? "rounded-full bg-[#08553F] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
    : "rounded-full border border-[#C6C6C6]/70 bg-white px-5 py-2.5 text-sm font-bold text-[#08553F] shadow-sm transition hover:border-[#00CF7B] hover:bg-[#F3EFA1]";
}

export default async function HistoricoPacientePage({
  searchParams,
}: HistoricoPacientePageProps) {
  const params = await searchParams;

  const selectedStatus = allowedStatusFilters.includes(
    params?.status as AppointmentStatusFilter
  )
    ? (params?.status as AppointmentStatusFilter)
    : undefined;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const allAppointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      availability: true,
      medicalRecord: true,
      prescription: true,
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const appointments = selectedStatus
    ? allAppointments.filter(
        (appointment) => appointment.status === selectedStatus
      )
    : allAppointments;

  const pendingCount = allAppointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedCount = allAppointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const completedCount = allAppointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  const cancelledCount = allAppointments.filter(
    (appointment) => appointment.status === "CANCELLED"
  ).length;

  const medicalRecordCount = allAppointments.filter(
    (appointment) => appointment.medicalRecord
  ).length;

  const prescriptionCount = allAppointments.filter(
    (appointment) => appointment.prescription
  ).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Histórico"
          title="Histórico de consultas"
          description="Acompanhe suas consultas, documentos clínicos, prontuários e receitas em um só lugar."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Visão geral
                </h2>

                <p className="mt-1 text-sm text-[#878787]">
                  Use os filtros para encontrar rapidamente suas consultas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={getFilterHref()}
                  className={getFilterClass(!selectedStatus)}
                >
                  Todos
                </Link>

                <Link
                  href={getFilterHref("PENDING")}
                  className={getFilterClass(selectedStatus === "PENDING")}
                >
                  Pendentes
                </Link>

                <Link
                  href={getFilterHref("CONFIRMED")}
                  className={getFilterClass(selectedStatus === "CONFIRMED")}
                >
                  Confirmadas
                </Link>

                <Link
                  href={getFilterHref("COMPLETED")}
                  className={getFilterClass(selectedStatus === "COMPLETED")}
                >
                  Concluídas
                </Link>

                <Link
                  href={getFilterHref("CANCELLED")}
                  className={getFilterClass(selectedStatus === "CANCELLED")}
                >
                  Canceladas
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Pendentes
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Confirmadas
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                  {confirmedCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Concluídas
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                  {completedCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Canceladas
                </p>
                <p className="mt-2 text-3xl font-extrabold text-red-700">
                  {cancelledCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Prontuários
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                  {medicalRecordCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F4E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                  Receitas
                </p>
                <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                  {prescriptionCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {appointments.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhuma consulta encontrada para este filtro.
                </p>

                <p className="mt-2 text-sm text-[#878787]">
                  Tente selecionar outro status ou volte para a visão geral.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="overflow-hidden rounded-[1.75rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
                      <div className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xl font-extrabold text-[#08553F]">
                              {appointment.doctor.user.name}
                            </p>

                            <p className="mt-1 text-sm text-[#878787]">
                              {appointment.doctor.specialty}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-4 py-2 text-xs font-extrabold ${getStatusClass(
                              appointment.status
                            )}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-[#08553F]">
                          <span className="rounded-full bg-[#F7F4E7] px-4 py-2">
                            📅 {formatDate(appointment.date)}
                          </span>

                          <span className="rounded-full bg-[#F7F4E7] px-4 py-2">
                            🕒{" "}
                            {appointment.availability
                              ? `${appointment.availability.startTime} às ${appointment.availability.endTime}`
                              : "Horário não informado"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-[#C6C6C6]/50 bg-[#F7F4E7] p-6 lg:border-l lg:border-t-0">
                        <p className="text-sm font-extrabold text-[#08553F]">
                          Documentos clínicos
                        </p>

                        <div className="mt-4 flex flex-col gap-3">
                          {appointment.medicalRecord ? (
                            <a
                              href={`/api/prontuario/${appointment.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-[#08553F] px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                            >
                              Baixar prontuário PDF
                            </a>
                          ) : (
                            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#878787]">
                              Prontuário indisponível
                            </p>
                          )}

                          {appointment.prescription ? (
                            <a
                              href={`/api/receita/${appointment.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-[#F3EFA1] px-4 py-2 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                            >
                              Baixar receita PDF
                            </a>
                          ) : (
                            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#878787]">
                              Receita indisponível
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}