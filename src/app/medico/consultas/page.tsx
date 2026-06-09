import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatus } from "./actions";

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

export default async function ConsultasMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
    },
    include: {
      patient: {
        include: {
          user: true,
          documents: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Consultas médicas"
          title="Minhas consultas"
          description="Acompanhe consultas, altere status dos atendimentos e visualize documentos enviados pelos pacientes."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/medico/horarios"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Minha agenda
            </Link>

            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Perfil profissional
            </Link>
          </div>

          <div className="grid gap-5">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhuma consulta encontrada.
                </p>

                <p className="mt-2 text-sm text-[#878787]">
                  Quando pacientes agendarem consultas, elas aparecerão aqui.
                </p>
              </div>
            )}

            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xl font-extrabold text-[#08553F]">
                        {appointment.patient.user.name}
                      </p>

                      <p className="mt-2 text-sm font-bold text-[#08553F]">
                        {formatDate(appointment.date)}
                      </p>

                      {appointment.notes && (
                        <p className="mt-3 text-sm text-[#878787]">
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

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {appointment.status !== "CONFIRMED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="CONFIRMED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                            >
                              Confirmar
                            </button>
                          </form>
                        )}

                        {appointment.status !== "CANCELLED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="CANCELLED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                            >
                              Cancelar
                            </button>
                          </form>
                        )}

                        {appointment.status !== "COMPLETED" && (
                          <form action={updateAppointmentStatus}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={appointment.id}
                            />

                            <input
                              type="hidden"
                              name="status"
                              value="COMPLETED"
                            />

                            <button
                              type="submit"
                              className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-200"
                            >
                              Concluir
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                    <h3 className="font-extrabold text-[#08553F]">
                      Documentos do paciente
                    </h3>

                    <div className="mt-4 space-y-3">
                      {appointment.patient.documents.length === 0 && (
                        <p className="text-sm text-[#878787]">
                          Nenhum documento enviado por este paciente.
                        </p>
                      )}

                      {appointment.patient.documents.map((document) => (
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
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}