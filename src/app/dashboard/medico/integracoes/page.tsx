import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

export default async function IntegracoesMedicoPage() {
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
      user: true,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
  }

  const googleConnected = !!doctor.googleCalendarConnection;

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

                      <p className="mt-2 text-sm text-[#878787]">
                        Conta:
                      </p>

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
                      <span className="rounded-2xl bg-[#00CF7B]/15 px-5 py-3 font-bold text-[#08553F]">
                        Integração ativa
                      </span>

                      <button
                        disabled
                        className="cursor-not-allowed rounded-2xl bg-[#F3EFA1] px-5 py-3 font-bold text-[#08553F]"
                      >
                        Sincronização automática (próxima etapa)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  O que esta integração fará?
                </h2>

                <ul className="mt-6 space-y-4 text-[#878787]">
                  <li>
                    ✅ Ler eventos existentes da agenda do médico
                  </li>

                  <li>
                    ✅ Evitar horários ocupados
                  </li>

                  <li>
                    ✅ Gerar horários automaticamente
                  </li>

                  <li>
                    ✅ Atualizar disponibilidade sem cadastro manual
                  </li>

                  <li>
                    ✅ Impedir agendamentos em conflitos de agenda
                  </li>

                  <li>
                    🚀 Sincronização automática em tempo real (próxima etapa)
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