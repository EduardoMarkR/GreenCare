import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { solicitarCadastroMedico } from "./actions";

function getDoctorStatusLabel(status: string) {
  if (status === "PENDING") return "Em análise";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Reprovado";

  return status;
}

function getDoctorStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "APPROVED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "REJECTED") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-800";
}

export default async function SolicitarMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (userRole !== "PATIENT" && userRole !== "DOCTOR" && userRole !== "ADMIN") {
    redirect("/login");
  }

  const existingDoctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/70">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#00CF7B]/20 blur-3xl" />
          <div className="absolute bottom-0 right-16 text-[15rem] leading-none text-[#08553F]/5">
            🌿
          </div>
          <div className="absolute bottom-10 right-72 hidden rotate-[-18deg] text-[8rem] leading-none text-[#00CF7B]/10 lg:block">
            🌿
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard/paciente"
                className="inline-flex items-center rounded-full border border-[#08553F]/20 bg-white px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
              >
                ← Voltar ao painel
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full bg-[#F3EFA1] px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm">
                <span>🪪</span>
                Cadastro profissional
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
              Solicitar cadastro como médico
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#878787]">
              Preencha seus dados profissionais para que a administração possa
              analisar seu perfil e liberar o acesso ao painel médico.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          {existingDoctor ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-8">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                    ⚕️
                  </div>

                  <h2 className="text-3xl font-extrabold text-[#08553F]">
                    Você já possui uma solicitação médica
                  </h2>

                  <p className="mt-3 max-w-2xl text-[#878787]">
                    Seu cadastro profissional já foi criado e está aguardando ou
                    seguindo análise da administração.
                  </p>

                  <div className="mt-6 rounded-3xl bg-[#F7F4E7] p-6">
                    <p className="text-sm font-bold text-[#878787]">
                      Status atual
                    </p>

                    <span
                      className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-bold ${getDoctorStatusClass(
                        existingDoctor.approvalStatus
                      )}`}
                    >
                      {getDoctorStatusLabel(existingDoctor.approvalStatus)}
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/dashboard/medico/perfil"
                      className="rounded-2xl bg-[#08553F] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                    >
                      Ver perfil médico
                    </Link>

                    <Link
                      href="/dashboard/paciente"
                      className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                    >
                      Voltar ao painel
                    </Link>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                  🌿
                </div>

                <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                  Próximo passo
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#878787]">
                  A administração pode aprovar, reprovar ou manter sua
                  candidatura em análise. Após aprovação, o painel médico será
                  liberado.
                </p>
              </aside>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <form
                action={solicitarCadastroMedico}
                className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-8">
                  <h2 className="text-3xl font-extrabold text-[#08553F]">
                    Dados profissionais
                  </h2>

                  <p className="mt-2 text-lg text-[#878787]">
                    Informe os dados que serão analisados pela administração da
                    plataforma.
                  </p>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        CRM
                      </label>

                      <input
                        name="crm"
                        required
                        placeholder="Ex: 123456"
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        UF do CRM
                      </label>

                      <input
                        name="crmUf"
                        required
                        maxLength={2}
                        placeholder="SP"
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 uppercase text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        Especialidade
                      </label>

                      <input
                        name="specialty"
                        required
                        placeholder="Ex: Clínica médica"
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        Valor da consulta
                      </label>

                      <input
                        name="price"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 250"
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Bio profissional
                    </label>

                    <textarea
                      name="bio"
                      required
                      rows={5}
                      placeholder="Conte um pouco sobre sua formação, experiência e forma de atendimento."
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <label className="mt-6 flex items-center gap-3 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                    <input
                      name="telemedicine"
                      type="checkbox"
                      className="h-4 w-4 accent-[#08553F]"
                    />
                    Atendo por telemedicina
                  </label>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      className="rounded-2xl bg-[#08553F] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                    >
                      📨 Enviar solicitação
                    </button>

                    <Link
                      href="/dashboard/paciente"
                      className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-4 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                    >
                      Cancelar
                    </Link>
                  </div>
                </div>
              </form>

              <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                  🌿
                </div>

                <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                  Como funciona?
                </h3>

                <div className="mt-7 space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#F7F4E7] text-2xl">
                      📝
                    </div>

                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        1. Você envia seus dados profissionais
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#878787]">
                        Preencha o formulário com suas informações.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#C6C6C6]/50" />

                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#F3EFA1] text-2xl">
                      🛡️
                    </div>

                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        2. A administração analisa sua candidatura
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#878787]">
                        Nossa equipe avalia seu perfil e documentação.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#C6C6C6]/50" />

                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#00CF7B]/15 text-2xl">
                      👨‍⚕️
                    </div>

                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        3. Após aprovação, seu painel médico é liberado
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#878787]">
                        Você poderá gerenciar sua agenda e atender pacientes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-8 overflow-hidden rounded-3xl border border-[#F3EFA1] bg-[#F7F4E7] p-5">
                  <div className="absolute -bottom-8 -right-6 text-[6rem] leading-none text-[#08553F]/5">
                    🌿
                  </div>

                  <div className="relative flex gap-3">
                    <span className="text-2xl">🔒</span>

                    <p className="text-sm font-bold leading-6 text-[#08553F]">
                      Apenas médicos aprovados aparecem publicamente na
                      plataforma.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}