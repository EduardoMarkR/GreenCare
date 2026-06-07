import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

type AdminMedicoDetalhePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

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

function getDoctorStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Reprovado";

  return status;
}

function getDoctorStatusClass(status: string) {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";

  return "bg-gray-100 text-gray-800";
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getAppointmentStatusClass(status: string) {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "CONFIRMED") return "bg-green-100 text-green-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-800";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-800";

  return "bg-gray-100 text-gray-800";
}

export default async function AdminMedicoDetalhePage({
  params,
}: AdminMedicoDetalhePageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      availabilities: {
        orderBy: {
          date: "asc",
        },
      },
      appointments: {
        include: {
          patient: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const estimatedRevenue = doctor.appointments
    .filter((appointment) => appointment.status !== "CANCELLED")
    .reduce((total) => {
      return total + Number(doctor.price);
    }, 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Dr(a). {doctor.user.name}
              </h1>

              <p className="mt-3 text-gray-600">
                Visualização completa do médico, horários e histórico de
                consultas.
              </p>
            </div>

            <Link
              href="/dashboard/admin/medicos"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar para médicos
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">
                Dados do médico
              </h2>

              <div className="mt-6 space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Nome:</strong> {doctor.user.name}
                </p>

                <p>
                  <strong>E-mail:</strong> {doctor.user.email}
                </p>

                <p>
                  <strong>Especialidade:</strong> {doctor.specialty}
                </p>

                <p>
                  <strong>CRM:</strong> {doctor.crm}/{doctor.crmUf}
                </p>

                <p>
                  <strong>Consulta:</strong>{" "}
                  {formatCurrency(Number(doctor.price))}
                </p>

                <p>
                  <strong>Telemedicina:</strong>{" "}
                  {doctor.telemedicine ? "Sim" : "Não"}
                </p>

                <p>
                  <strong>Cadastrado em:</strong> {formatDate(doctor.createdAt)}
                </p>
              </div>

              <div className="mt-6">
                <span
                  className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getDoctorStatusClass(
                    doctor.approvalStatus
                  )}`}
                >
                  {getDoctorStatusLabel(doctor.approvalStatus)}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">Consultas</h2>

              <p className="mt-6 text-4xl font-bold text-green-700">
                {doctor.appointments.length}
              </p>

              <p className="mt-2 text-gray-600">
                Total de consultas vinculadas a este médico.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">
                Receita prevista
              </h2>

              <p className="mt-6 text-4xl font-bold text-blue-700">
                {formatCurrency(estimatedRevenue)}
              </p>

              <p className="mt-2 text-gray-600">
                Soma das consultas não canceladas deste médico.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Biografia</h2>

            <p className="mt-4 text-gray-700">
              {doctor.bio || "Nenhuma biografia cadastrada."}
            </p>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">
              Horários cadastrados
            </h2>

            <div className="mt-6 grid gap-4">
              {doctor.availabilities.length === 0 && (
                <p className="text-gray-600">
                  Nenhum horário cadastrado por este médico.
                </p>
              )}

              {doctor.availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <p className="font-semibold text-gray-900">
                    {formatDate(availability.date)}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Das {availability.startTime} às {availability.endTime}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de consultas
            </h2>

            <div className="mt-6 grid gap-4">
              {doctor.appointments.length === 0 && (
                <p className="text-gray-600">
                  Nenhuma consulta encontrada para este médico.
                </p>
              )}

              {doctor.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Paciente: {appointment.patient.user.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Data: {formatDate(appointment.date)}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Observações:{" "}
                        {appointment.notes || "Nenhuma observação"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getAppointmentStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getAppointmentStatusLabel(appointment.status)}
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