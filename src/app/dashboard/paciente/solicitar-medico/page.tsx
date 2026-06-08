import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { solicitarCadastroMedico } from "./actions";

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

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <Link
              href="/dashboard/paciente"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              ← Voltar para o painel do paciente
            </Link>

            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Solicitar cadastro como médico
            </h1>

            <p className="mt-2 text-slate-600">
              Preencha seus dados profissionais para que a administração possa
              analisar e aprovar seu perfil médico.
            </p>
          </div>

          {existingDoctor ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-xl font-semibold text-emerald-900">
                Você já possui uma solicitação médica
              </h2>

              <p className="mt-2 text-emerald-800">
                Seu cadastro médico já foi criado e está com o status:{" "}
                <strong>{existingDoctor.approvalStatus}</strong>.
              </p>

              <Link
                href="/dashboard/medico/perfil"
                className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Ver perfil médico
              </Link>
            </div>
          ) : (
            <form
              action={solicitarCadastroMedico}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    CRM
                  </label>
                  <input
                    name="crm"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
                    placeholder="Ex: 123456"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    UF do CRM
                  </label>
                  <input
                    name="crmUf"
                    required
                    maxLength={2}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 uppercase outline-none focus:border-emerald-600"
                    placeholder="SP"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Especialidade
                  </label>
                  <input
                    name="specialty"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
                    placeholder="Ex: Clínica médica"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Valor da consulta
                  </label>
                  <input
                    name="price"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
                    placeholder="Ex: 250"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bio profissional
                </label>
                <textarea
                  name="bio"
                  required
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-600"
                  placeholder="Conte um pouco sobre sua formação, experiência e forma de atendimento."
                />
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  name="telemedicine"
                  type="checkbox"
                  className="h-4 w-4"
                />
                Atendo por telemedicina
              </label>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Enviar solicitação
                </button>

                <Link
                  href="/dashboard/paciente"
                  className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}