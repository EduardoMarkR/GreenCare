import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import {
  disconnectGoogleCalendar,
  syncGoogleCalendarAvailabilities,
} from "./actions";

type IntegracoesMedicoPageProps = {
  searchParams?: Promise<{
    created?: string;
    removed?: string;
    disconnected?: string;
    erro?: string;
  }>;
};

export default async function IntegracoesMedicoPage({
  searchParams,
}: IntegracoesMedicoPageProps) {
  const params = await searchParams;
  const created = params?.created;
  const removed = params?.removed;
  const disconnected = params?.disconnected;
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
      googleCalendarConnection: true,
      scheduleSettings: true,
      user: true,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const googleConnected = !!doctor.googleCalendarConnection;
  const settings = doctor.scheduleSettings;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Integrações"
          title="Integrações externas"
          description="Conecte serviços para automatizar sua agenda e otimizar seu atendimento."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {created || removed ? (
            <div className="mb-8 rounded-[2rem] border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Sincronização concluída
              </p>

              <p className="mt-2 text-sm leading-6 text-[#08553F]">
                {created ?? 0} horário(s) criado(s) e {removed ?? 0} horário(s)
                removido(s) conforme suas regras e sua Google Agenda.
              </p>

              <p className="mt-2 text-xs leading-5 text-[#08553F]/80">
                Horários que já possuem consulta marcada não são removidos
                automaticamente.
              </p>
            </div>
          ) : null}

          {disconnected ? (
            <div className="mb-8 rounded-[2rem] border border-[#F3EFA1] bg-white p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Google Agenda desconectada
              </p>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Sua conta Google foi removida da integração.
              </p>
            </div>
          ) : null}

          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível sincronizar
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F4E7] text-3xl">
                    📅
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-[#08553F]">
                      Google Agenda
                    </h2>

                    <p className="text-sm text-[#878787]">
                      Sincronize horários diretamente com sua agenda Google.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-semibold text-[#878787]">
                    Status da conexão
                  </p>

                  {googleConnected ? (
                    <>
                      <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                        ✅ Conectado
                      </p>

                      <p className="mt-2 text-sm text-[#878787]">Conta:</p>

                      <p className="font-bold text-[#08553F]">
                        {doctor.googleCalendarConnection?.googleEmail}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-lg font-extrabold text-red-600">
                        ❌ Não conectado
                      </p>

                      <p className="mt-2 text-sm text-[#878787]">
                        Conecte sua conta Google para sincronizar horários.
                      </p>
                    </>
                  )}
                </div>

                {settings ? (
                  <div className="mt-5 rounded-3xl border border-[#C6C6C6]/60 bg-white p-5">
                    <p className="text-sm font-semibold text-[#878787]">
                      Regras atuais
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#08553F]">
                      Atendimento das{" "}
                      <strong>{settings.workStartTime}</strong> às{" "}
                      <strong>{settings.workEndTime}</strong>, consultas de{" "}
                      <strong>{settings.slotDurationMinutes} min</strong>, por{" "}
                      <strong>{settings.daysToSync} dias</strong>.
                    </p>

                    {settings.lunchStartTime && settings.lunchEndTime ? (
                      <p className="mt-1 text-sm leading-6 text-[#878787]">
                        Pausa: {settings.lunchStartTime} às{" "}
                        {settings.lunchEndTime}.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl border border-[#F3EFA1] bg-[#F3EFA1]/30 p-5">
                    <p className="text-sm font-bold text-[#08553F]">
                      Nenhuma regra personalizada configurada.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#878787]">
                      Se sincronizar agora, serão usadas regras padrão: segunda a
                      sexta, 08:00 às 18:00, consultas de 60 minutos.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {!googleConnected ? (
                    <a
                      href="/api/google-calendar/connect"
                      className="rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                    >
                      Conectar Google Agenda
                    </a>
                  ) : (
                    <>
                      <form action={syncGoogleCalendarAvailabilities}>
                        <button
                          type="submit"
                          className="rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                        >
                          Sincronizar horários
                        </button>
                      </form>

                      <Link
                        href="/dashboard/medico/integracoes/agenda"
                        className="rounded-2xl bg-[#F3EFA1] px-5 py-3 font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                      >
                        Configurar regras
                      </Link>

                      <Link
                        href="/medico/horarios"
                        className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                      >
                        Ver minha agenda
                      </Link>

                      <form action={disconnectGoogleCalendar}>
                        <button
                          type="submit"
                          className="rounded-2xl bg-red-100 px-5 py-3 font-bold text-red-700 transition hover:bg-red-200"
                        >
                          Desconectar Google
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Como a sincronização funciona?
                </h2>

                <ul className="mt-6 space-y-4 text-[#878787]">
                  <li>✅ Lê eventos existentes da sua Google Agenda.</li>
                  <li>✅ Ignora horários ocupados.</li>
                  <li>✅ Respeita dias da semana configurados.</li>
                  <li>✅ Respeita horário de atendimento e pausa/almoço.</li>
                  <li>✅ Evita duplicar horários já cadastrados.</li>
                  <li>
                    ✅ Remove horários livres que não pertencem mais às regras.
                  </li>
                  <li>
                    🔒 Não remove horários que já possuem consulta marcada.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}