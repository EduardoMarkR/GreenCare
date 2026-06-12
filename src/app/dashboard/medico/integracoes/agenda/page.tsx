import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { saveDoctorScheduleSettings } from "./actions";

type AgendaIntegracaoPageProps = {
  searchParams?: Promise<{
    success?: string;
    erro?: string;
  }>;
};

export default async function AgendaIntegracaoPage({
  searchParams,
}: AgendaIntegracaoPageProps) {
  const params = await searchParams;
  const success = params?.success;
  const erro = params?.erro;

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
    include: {
      scheduleSettings: true,
      googleCalendarConnection: true,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const settings = doctor.scheduleSettings;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Google Agenda"
          title="Configurar sincronização"
          description="Defina os dias, horários e regras que serão usados para gerar sua disponibilidade com base na Google Agenda."
          backHref="/dashboard/medico/integracoes"
          backLabel="Voltar às integrações"
        />

        <section className="mx-auto max-w-5xl px-6 py-12">
          {success ? (
            <div className="mb-8 rounded-[2rem] border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Configurações salvas
              </p>

              <p className="mt-2 text-sm text-[#08553F]">
                Suas preferências de sincronização foram atualizadas.
              </p>
            </div>
          ) : null}

          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível salvar
              </p>

              <p className="mt-2 text-sm text-red-700">{erro}</p>
            </div>
          ) : null}

          {!doctor.googleCalendarConnection ? (
            <div className="mb-8 rounded-[2rem] border border-[#F3EFA1] bg-white p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Google Agenda ainda não conectada
              </p>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Conecte sua conta Google antes de sincronizar horários.
              </p>

              <a
                href="/api/google-calendar/connect"
                className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Conectar Google Agenda
              </a>
            </div>
          ) : null}

          <form
            action={saveDoctorScheduleSettings}
            className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
          >
            <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

            <div className="p-6 md:p-8">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Regras de atendimento
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  O sistema só criará horários livres dentro dessas regras e
                  ignorará eventos ocupados na sua Google Agenda.
                </p>
              </div>

              <div className="mt-8 rounded-3xl bg-[#F7F4E7] p-5">
                <h3 className="font-extrabold text-[#08553F]">
                  Dias da semana
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    ["monday", "Segunda", settings?.monday ?? true],
                    ["tuesday", "Terça", settings?.tuesday ?? true],
                    ["wednesday", "Quarta", settings?.wednesday ?? true],
                    ["thursday", "Quinta", settings?.thursday ?? true],
                    ["friday", "Sexta", settings?.friday ?? true],
                    ["saturday", "Sábado", settings?.saturday ?? false],
                    ["sunday", "Domingo", settings?.sunday ?? false],
                  ].map(([name, label, checked]) => (
                    <label
                      key={String(name)}
                      className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#08553F]"
                    >
                      <input
                        type="checkbox"
                        name={String(name)}
                        defaultChecked={Boolean(checked)}
                        className="h-4 w-4 accent-[#08553F]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Início do atendimento
                  </label>

                  <input
                    type="time"
                    name="workStartTime"
                    defaultValue={settings?.workStartTime ?? "08:00"}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Fim do atendimento
                  </label>

                  <input
                    type="time"
                    name="workEndTime"
                    defaultValue={settings?.workEndTime ?? "18:00"}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Início do almoço/pausa
                  </label>

                  <input
                    type="time"
                    name="lunchStartTime"
                    defaultValue={settings?.lunchStartTime ?? ""}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Fim do almoço/pausa
                  </label>

                  <input
                    type="time"
                    name="lunchEndTime"
                    defaultValue={settings?.lunchEndTime ?? ""}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Duração da consulta em minutos
                  </label>

                  <input
                    type="number"
                    name="slotDurationMinutes"
                    min="15"
                    step="15"
                    defaultValue={settings?.slotDurationMinutes ?? 60}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Intervalo entre consultas em minutos
                  </label>

                  <input
                    type="number"
                    name="intervalMinutes"
                    min="0"
                    step="5"
                    defaultValue={settings?.intervalMinutes ?? 0}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#08553F]">
                    Quantos dias sincronizar
                  </label>

                  <input
                    type="number"
                    name="daysToSync"
                    min="1"
                    max="90"
                    defaultValue={settings?.daysToSync ?? 30}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none focus:border-[#00CF7B] focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Salvar configurações
                </button>

                <Link
                  href="/dashboard/medico/integracoes"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Voltar
                </Link>
              </div>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}