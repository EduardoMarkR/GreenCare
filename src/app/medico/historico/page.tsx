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
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getStatusClass(status: string) {
  if (status === "CANCELLED") {
    return "bg-red-100 text-red-700";
  }

  if (status === "COMPLETED") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-800";
}

export default async function HistoricoMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
    },
    include: {
      availability: true,
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        availability: {
          startTime: "desc",
        },
      },
    ],
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Histórico"
          title="Histórico de consultas"
          description="Consulte atendimentos concluídos e cancelados, com documentos vinculados a cada consulta."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/medico/consultas"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
            >
              Consultas ativas
            </Link>
          </div>

          <div className="space-y-4">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum histórico encontrado.
                </p>
              </div>
            )}

            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[2rem] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <p className="font-extrabold text-[#08553F]">
                      {appointment.patient.user.name}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#08553F]">
                      {formatDate(appointment.date)}
                    </p>

                    {appointment.availability ? (
                      <p className="mt-1 text-sm font-semibold text-[#08553F]">
                        {appointment.availability.startTime} às{" "}
                        {appointment.availability.endTime}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-[#878787]">
                        Horário não informado
                      </p>
                    )}

                    {appointment.notes && (
                      <p className="mt-3 text-sm text-[#878787]">
                        Observações: {appointment.notes}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                      appointment.status
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                  <h3 className="font-extrabold text-[#08553F]">
                    Documentos desta consulta
                  </h3>

                  <div className="mt-4 space-y-3">
                    {appointment.documents.length === 0 && (
                      <p className="text-sm text-[#878787]">
                        Nenhum documento vinculado a esta consulta.
                      </p>
                    )}

                    {appointment.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#08553F]">
                            {document.name}
                          </p>

                          {document.fileType && (
                            <p className="text-sm text-[#878787]">
                              {document.fileType}
                            </p>
                          )}
                        </div>

                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                        >
                          Abrir documento →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}