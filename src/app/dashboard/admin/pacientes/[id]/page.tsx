import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
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
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

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

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Detalhes do paciente"
          title={patient.user.name}
          description="Visualização completa do paciente, documentos enviados e histórico de consultas."
          backHref="/dashboard/admin/pacientes"
          backLabel="Voltar para pacientes"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm lg:col-span-1">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                  🧑
                </div>

                <h2 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                  Dados do paciente
                </h2>

                <div className="mt-6 space-y-3 text-sm text-[#878787]">
                  <p>
                    <strong className="text-[#08553F]">Nome:</strong>{" "}
                    {patient.user.name}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">E-mail:</strong>{" "}
                    {patient.user.email}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Telefone:</strong>{" "}
                    {patient.phone || "Não informado"}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">
                      Data de nascimento:
                    </strong>{" "}
                    {formatDate(patient.birthDate)}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Cadastrado em:</strong>{" "}
                    {formatDate(patient.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Consultas vinculadas
                </p>

                <p className="mt-4 text-5xl font-extrabold text-[#08553F]">
                  {patient.appointments.length}
                </p>

                <p className="mt-3 text-sm text-[#878787]">
                  Total de consultas vinculadas a este paciente.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Documentos enviados
                </p>

                <p className="mt-4 text-5xl font-extrabold text-[#08553F]">
                  {patient.documents.length}
                </p>

                <p className="mt-3 text-sm text-[#878787]">
                  Total de documentos enviados pelo paciente.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Documentos enviados
            </h2>

            <div className="mt-6 grid gap-4">
              {patient.documents.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhum documento enviado por este paciente.
                  </p>
                </div>
              )}

              {patient.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-extrabold text-[#08553F]">
                      📎 {document.name}
                    </p>

                    <p className="mt-1 text-sm text-[#878787]">
                      Enviado em: {formatDate(document.createdAt)}
                    </p>

                    <p className="mt-1 text-sm text-[#878787]">
                      Tipo: {document.fileType || "Não informado"}
                    </p>
                  </div>

                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Abrir documento
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Histórico de consultas
            </h2>

            <div className="mt-6 grid gap-4">
              {patient.appointments.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada para este paciente.
                  </p>
                </div>
              )}

              {patient.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        Dr(a). {appointment.doctor.user.name}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#08553F]">
                        Data: {formatDate(appointment.date)}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        Observações:{" "}
                        {appointment.notes || "Nenhuma observação"}
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