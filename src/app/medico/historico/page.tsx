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
  if (status === "CANCELLED") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "COMPLETED") return "bg-blue-50 text-blue-700 ring-blue-100";

  return "bg-gray-50 text-gray-700 ring-gray-100";
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
      medicalRecord: true,
      prescription: true,
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
          description="Consulte atendimentos encerrados, documentos vinculados, prontuários e receitas em PDF."
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

          <div className="space-y-5">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum histórico encontrado.
                </p>

                <p className="mt-2 text-sm text-[#878787]">
                  Consultas concluídas ou canceladas aparecerão aqui.
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
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-extrabold text-[#08553F]">
                        {appointment.patient.user.name}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-[#08553F]">
                        <span>{formatDate(appointment.date)}</span>

                        {appointment.availability ? (
                          <span>
                            • {appointment.availability.startTime} às{" "}
                            {appointment.availability.endTime}
                          </span>
                        ) : (
                          <span>• Horário não informado</span>
                        )}
                      </div>

                      {appointment.notes && (
                        <p className="mt-3 text-sm leading-6 text-[#878787]">
                          Observações: {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ring-1 ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {appointment.medicalRecord && (
                          <a
                            href={`/api/prontuario/${appointment.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                          >
                            Prontuário PDF →
                          </a>
                        )}

                        {appointment.prescription && (
                          <a
                            href={`/api/receita/${appointment.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                          >
                            Receita PDF →
                          </a>
                        )}

                        <Link
                          href={`/medico/prontuario/${appointment.id}`}
                          className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] ring-1 ring-[#08553F]/20 transition hover:bg-[#F3EFA1]"
                        >
                          {appointment.medicalRecord
                            ? "Editar prontuário"
                            : "Criar prontuário"}
                        </Link>

                        <Link
                          href={`/medico/receita/${appointment.id}`}
                          className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] ring-1 ring-[#08553F]/20 transition hover:bg-[#F3EFA1]"
                        >
                          {appointment.prescription
                            ? "Editar receita"
                            : "Criar receita"}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                      <h3 className="font-extrabold text-[#08553F]">
                        Prontuário
                      </h3>

                      {appointment.medicalRecord ? (
                        <p className="mt-2 text-sm leading-6 text-[#878787]">
                          Prontuário registrado. O conteúdo completo está
                          disponível no PDF.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-[#878787]">
                          Nenhum prontuário registrado para esta consulta.
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                      <h3 className="font-extrabold text-[#08553F]">
                        Receita médica
                      </h3>

                      {appointment.prescription ? (
                        <p className="mt-2 text-sm leading-6 text-[#878787]">
                          Receita registrada. O conteúdo completo está
                          disponível no PDF.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-[#878787]">
                          Nenhuma receita registrada para esta consulta.
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                      <h3 className="font-extrabold text-[#08553F]">
                        Documentos
                      </h3>

                      {appointment.documents.length === 0 ? (
                        <p className="mt-2 text-sm leading-6 text-[#878787]">
                          Nenhum documento vinculado a esta consulta.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {appointment.documents.map((document) => (
                            <div
                              key={document.id}
                              className="flex flex-col gap-3 rounded-2xl bg-white p-4"
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
                                Abrir →
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
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