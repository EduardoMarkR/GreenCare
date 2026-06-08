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
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "CONFIRMED") return "bg-green-100 text-green-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-800";

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

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área do paciente
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Olá, {patient.user.name}
              </h1>

              <p className="mt-4 text-gray-600">
                Acompanhe suas consultas, agendamentos e informações de atendimento.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/paciente/perfil"
                className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Meu Perfil
              </Link>

              {doctor?.approvalStatus === "APPROVED" && (
                <Link
                  href="/dashboard/medico"
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-emerald-700"
                >
                  Painel Médico
                </Link>
              )}

              <Link
                href="/logout"
                className="rounded-xl bg-red-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-red-700"
              >
                Sair
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Consultas totais
              </h2>

              <p className="mt-4 text-4xl font-bold text-green-700">
                {totalConsultas}
              </p>

              <p className="mt-2 text-gray-600">
                Consultas vinculadas ao seu cadastro.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Pendentes</h2>

              <p className="mt-4 text-4xl font-bold text-yellow-600">
                {consultasPendentes}
              </p>

              <p className="mt-2 text-gray-600">
                Aguardando confirmação médica.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Confirmadas</h2>

              <p className="mt-4 text-4xl font-bold text-green-700">
                {consultasConfirmadas}
              </p>

              <p className="mt-2 text-gray-600">Consultas confirmadas.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Link
              href="/dashboard/paciente/documentos"
              className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-green-300 hover:bg-green-50"
            >
              <h2 className="text-lg font-bold text-gray-900">
                Meus documentos
              </h2>

              <p className="mt-2 text-gray-600">
                Envie e acompanhe seus documentos médicos.
              </p>
            </Link>

            {!doctor && (
              <Link
                href="/dashboard/paciente/solicitar-medico"
                className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition hover:bg-emerald-100"
              >
                <h2 className="text-lg font-bold text-emerald-900">
                  Quero atender como médico
                </h2>

                <p className="mt-2 text-emerald-800">
                  Possui CRM e deseja oferecer consultas pela plataforma?
                  Envie sua candidatura para análise da administração.
                </p>
              </Link>
            )}

            {doctor && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-emerald-900">
                  Cadastro médico
                </h2>

                <p className="mt-2 text-emerald-800">
                  Status da sua candidatura:{" "}
                  <strong>{getDoctorStatusLabel(doctor.approvalStatus)}</strong>
                </p>

                {doctor.approvalStatus === "APPROVED" && (
                  <Link
                    href="/dashboard/medico"
                    className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Acessar painel médico
                  </Link>
                )}

                {doctor.approvalStatus === "PENDING" && (
                  <p className="mt-4 text-sm text-emerald-700">
                    Sua solicitação está aguardando análise da administração.
                  </p>
                )}

                {doctor.approvalStatus === "REJECTED" && (
                  <Link
                    href="/dashboard/medico/perfil"
                    className="mt-4 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-300 transition hover:bg-emerald-100"
                  >
                    Revisar perfil médico
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Minhas consultas
                </h2>

                <p className="mt-2 text-gray-600">
                  Veja suas próximas consultas e o status de cada atendimento.
                </p>
              </div>

              <Link
                href="/medicos"
                className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
              >
                Agendar nova consulta
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {proximasConsultas.length === 0 && (
                <p className="text-gray-600">Nenhuma consulta encontrada.</p>
              )}

              {proximasConsultas.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr(a). {appointment.doctor.user.name}
                      </p>

                      <p className="text-sm text-gray-600">
                        {appointment.doctor.specialty}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
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
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
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