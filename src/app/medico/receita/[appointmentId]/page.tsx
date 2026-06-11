import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { savePrescription } from "./actions";

type ReceitaPageProps = {
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

export default async function ReceitaPage({
  params,
  searchParams,
}: ReceitaPageProps) {
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
      prescription: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    redirect("/medico/historico?erro=Consulta não encontrada.");
  }

  const canEdit = appointment.status === "COMPLETED";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Receita médica"
          title="Emitir receita da consulta"
          description="Registre medicamento, posologia, quantidade e orientações para gerar a receita em PDF."
          backHref="/medico/historico"
          backLabel="Voltar ao histórico"
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
                Receita salva com sucesso.
              </p>

              {appointment.prescription && (
                <a
                  href={`/api/receita/${appointment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Abrir receita em PDF →
                </a>
              )}
            </div>
          ) : null}

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
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

          <form
            action={savePrescription}
            className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />

            {!canEdit && (
              <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                A receita só pode ser emitida para consultas concluídas.
              </div>
            )}

            <div className="grid gap-6">
              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Medicamento
                </label>
                <textarea
                  name="medication"
                  defaultValue={appointment.prescription?.medication ?? ""}
                  disabled={!canEdit}
                  rows={4}
                  placeholder="Ex.: Óleo CBD Full Spectrum 6000mg"
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Posologia
                </label>
                <textarea
                  name="dosage"
                  defaultValue={appointment.prescription?.dosage ?? ""}
                  disabled={!canEdit}
                  rows={4}
                  placeholder="Ex.: Iniciar com 2 gotas à noite por 7 dias. Ajustar conforme orientação médica."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Quantidade
                </label>
                <input
                  type="text"
                  name="quantity"
                  defaultValue={appointment.prescription?.quantity ?? ""}
                  disabled={!canEdit}
                  placeholder="Ex.: 1 frasco"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#08553F]">
                  Orientações
                </label>
                <textarea
                  name="instructions"
                  defaultValue={appointment.prescription?.instructions ?? ""}
                  disabled={!canEdit}
                  rows={5}
                  placeholder="Ex.: Retorno em 60 dias. Manter longe de crianças. Não alterar dose sem orientação médica."
                  className="mt-2 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {canEdit && (
                <button
                  type="submit"
                  className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Salvar receita
                </button>
              )}

              {appointment.prescription && (
                <a
                  href={`/api/receita/${appointment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#F3EFA1] px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                >
                  Abrir PDF
                </a>
              )}

              <Link
                href="/medico/historico"
                className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Voltar
              </Link>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}