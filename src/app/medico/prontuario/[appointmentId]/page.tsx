import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { saveMedicalRecord } from "./actions";

type ProntuarioPageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
    salvo?: string;
  }>;
};

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

export default async function ProntuarioPage({
  params,
  searchParams,
}: ProntuarioPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const { appointmentId } = await params;
  const query = await searchParams;

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      doctorId: doctor.id,
    },
    include: {
      availability: true,
      medicalRecord: true,
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
  });

  if (!appointment) {
    redirect("/medico/consultas?erro=Consulta não encontrada.");
  }

  const isCancelled = appointment.status === "CANCELLED";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Prontuário eletrônico"
          title="Registro clínico da consulta"
          description="Registre queixa principal, conduta, observações e prescrição vinculadas a esta consulta."
          backHref="/medico/consultas"
          backLabel="Voltar às consultas"
        />

        <section className="mx-auto max-w-5xl px-6 py-12">
          {query?.erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível salvar
              </p>
              <p className="mt-3 text-sm text-red-700">{query.erro}</p>
            </div>
          ) : null}

          {query?.salvo ? (
            <div className="mb-8 rounded-[2rem] border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Prontuário salvo com sucesso.
              </p>
            </div>
          ) : null}

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#878787]">Paciente</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#08553F]">
                  {appointment.patient.user.name}
                </h2>

                <p className="mt-3 text-sm font-bold text-[#08553F]">
                  {formatDate(appointment.date)}
                </p>

                {appointment.availability ? (
                  <p className="mt-1 text-sm font-bold text-[#08553F]">
                    {appointment.availability.startTime} às{" "}
                    {appointment.availability.endTime}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-bold text-[#878787]">
                    Horário não informado
                  </p>
                )}
              </div>

              <div className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
                {getStatusLabel(appointment.status)}
              </div>
            </div>
          </div>

          <form
            action={saveMedicalRecord}
            className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />

            <div className="grid gap-6">
              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Queixa principal
                </label>
                <textarea
                  name="complaint"
                  defaultValue={appointment.medicalRecord?.complaint ?? ""}
                  disabled={isCancelled}
                  rows={4}
                  placeholder="Ex.: insônia, dor crônica, ansiedade, náuseas, acompanhamento terapêutico..."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Conduta médica
                </label>
                <textarea
                  name="conduct"
                  defaultValue={appointment.medicalRecord?.conduct ?? ""}
                  disabled={isCancelled}
                  rows={5}
                  placeholder="Descreva a orientação clínica, plano terapêutico e próximos passos."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Observações
                </label>
                <textarea
                  name="notes"
                  defaultValue={appointment.medicalRecord?.notes ?? ""}
                  disabled={isCancelled}
                  rows={4}
                  placeholder="Observações adicionais da consulta."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Prescrição / orientação terapêutica
                </label>
                <textarea
                  name="prescription"
                  defaultValue={appointment.medicalRecord?.prescription ?? ""}
                  disabled={isCancelled}
                  rows={5}
                  placeholder="Ex.: produto, concentração, posologia, titulação, retorno..."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!isCancelled && (
                <button
                  type="submit"
                  className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Salvar prontuário
                </button>
              )}

              <Link
                href="/medico/consultas"
                className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Voltar
              </Link>
            </div>
          </form>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#08553F]">
              Documentos vinculados
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
                  className="flex flex-col gap-3 rounded-2xl bg-[#F7F4E7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-[#08553F]">{document.name}</p>

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
        </section>
      </main>

      <Footer />
    </>
  );
}