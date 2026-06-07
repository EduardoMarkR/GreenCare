import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

type AdminPacienteDetalhePageProps = {
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

export default async function AdminPacienteDetalhePage({
  params,
}: AdminPacienteDetalhePageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
      appointments: {
        include: {
          doctor: {
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

  if (!patient) {
    notFound();
  }

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
                {patient.user.name}
              </h1>

              <p className="mt-3 text-gray-600">
                Visualização completa do paciente, documentos e histórico de
                consultas.
              </p>
            </div>

            <Link
              href="/dashboard/admin/pacientes"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar para pacientes
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">
                Dados do paciente
              </h2>

              <div className="mt-6 space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Nome:</strong> {patient.user.name}
                </p>

                <p>
                  <strong>E-mail:</strong> {patient.user.email}
                </p>

                <p>
                  <strong>Telefone:</strong>{" "}
                  {patient.phone || "Não informado"}
                </p>

                <p>
                  <strong>Data de nascimento:</strong>{" "}
                  {formatDate(patient.birthDate)}
                </p>

                <p>
                  <strong>Cadastrado em:</strong>{" "}
                  {formatDate(patient.createdAt)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">Consultas</h2>

              <p className="mt-6 text-4xl font-bold text-green-700">
                {patient.appointments.length}
              </p>

              <p className="mt-2 text-gray-600">
                Total de consultas vinculadas a este paciente.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">Documentos</h2>

              <p className="mt-6 text-4xl font-bold text-blue-700">
                {patient.documents.length}
              </p>

              <p className="mt-2 text-gray-600">
                Total de documentos enviados pelo paciente.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">
              Documentos enviados
            </h2>

            <div className="mt-6 grid gap-4">
              {patient.documents.length === 0 && (
                <p className="text-gray-600">
                  Nenhum documento enviado por este paciente.
                </p>
              )}

              {patient.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      📎 {document.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Enviado em: {formatDate(document.createdAt)}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Tipo: {document.fileType || "Não informado"}
                    </p>
                  </div>

                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                  >
                    Abrir documento
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de consultas
            </h2>

            <div className="mt-6 grid gap-4">
              {patient.appointments.length === 0 && (
                <p className="text-gray-600">
                  Nenhuma consulta encontrada para este paciente.
                </p>
              )}

              {patient.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Dr(a). {appointment.doctor.user.name}
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