import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { cancelPatientAppointment } from "./actions";

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

function getDoctorStatusLabel(status: string) {
  if (status === "PENDING") return "Em análise";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Reprovado";

  return status;
}

export default async function DashboardPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  const totalConsultas = await prisma.appointment.count({
    where: {
      patientId: patient.id,
    },
  });

  const consultasPendentes = await prisma.appointment.count({
    where: {
      patientId: patient.id,
      status: "PENDING",
    },
  });

  const consultasConfirmadas = await prisma.appointment.count({
    where: {
      patientId: patient.id,
      status: "CONFIRMED",
    },
  });

  const proximasConsultas = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/60">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#00CF7B]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
                  Área do paciente
                </span>

                <h1 className="mt-6 max-w-3xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
                  Olá, {patient.user.name}
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#878787]">
                  Acompanhe suas consultas, documentos e solicitações em uma
                  jornada de cuidado mais simples, segura e organizada.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <Link
                  href="/dashboard/paciente/perfil"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Meu perfil
                </Link>

                {doctor?.approvalStatus === "APPROVED" && (
                  <Link
                    href="/dashboard/medico"
                    className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                  >
                    Painel médico
                  </Link>
                )}

                <Link
                  href="/logout"
                  className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-700"
                >
                  Sair
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Consultas totais
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {totalConsultas}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas vinculadas ao seu cadastro.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">Pendentes</p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {consultasPendentes}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Aguardando confirmação médica.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Confirmadas
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {consultasConfirmadas}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas confirmadas.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Link
              href="/dashboard/paciente/documentos"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  📎
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Meus documentos
                </h2>

                <p className="mt-2 text-[#878787]">
                  Envie e acompanhe seus documentos médicos com segurança.
                </p>

                <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Acessar documentos →
                </p>
              </div>
            </Link>

            {!doctor && (
              <Link
                href="/dashboard/paciente/solicitar-medico"
                className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                    ⚕️
                  </div>

                  <h2 className="text-xl font-extrabold text-[#08553F]">
                    Quero atender como médico
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Possui CRM e deseja oferecer consultas pela plataforma?
                    Envie sua candidatura para análise.
                  </p>

                  <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                    Solicitar cadastro médico →
                  </p>
                </div>
              </Link>
            )}

            {doctor && (
              <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                    ⚕️
                  </div>

                  <h2 className="text-xl font-extrabold text-[#08553F]">
                    Cadastro médico
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Status da sua candidatura:{" "}
                    <strong className="text-[#08553F]">
                      {getDoctorStatusLabel(doctor.approvalStatus)}
                    </strong>
                  </p>

                  {doctor.approvalStatus === "APPROVED" && (
                    <Link
                      href="/dashboard/medico"
                      className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                    >
                      Acessar painel médico
                    </Link>
                  )}

                  {doctor.approvalStatus === "PENDING" && (
                    <p className="mt-5 rounded-2xl bg-[#F3EFA1] p-4 text-sm font-semibold text-[#08553F]">
                      Sua solicitação está aguardando análise da administração.
                    </p>
                  )}

                  {doctor.approvalStatus === "REJECTED" && (
                    <Link
                      href="/dashboard/medico/perfil"
                      className="mt-5 inline-flex rounded-2xl bg-[#F3EFA1] px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                    >
                      Revisar perfil médico
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Minhas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Veja suas próximas consultas e o status de cada atendimento.
                </p>
              </div>

              <Link
                href="/medicos"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Agendar nova consulta
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {proximasConsultas.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando você agendar uma consulta, ela aparecerá aqui.
                  </p>
                </div>
              )}

              {proximasConsultas.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        Dr(a). {appointment.doctor.user.name}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        {appointment.doctor.specialty}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#08553F]">
                        {formatDate(appointment.date)}
                      </p>

                      {appointment.notes && (
                        <p className="mt-2 text-sm text-[#878787]">
                          Observações: {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      {(appointment.status === "PENDING" ||
                        appointment.status === "CONFIRMED") && (
                        <form action={cancelPatientAppointment}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />

                          <button
                            type="submit"
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                          >
                            Cancelar consulta
                          </button>
                        </form>
                      )}
                    </div>
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