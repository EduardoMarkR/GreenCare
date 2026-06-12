import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaLeafPattern from "@/components/CannaLeafPattern";
import { createPatientAccount } from "./actions";

type CadastroPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

export default async function CadastroPage({
  searchParams,
}: CadastroPageProps) {
  const params = await searchParams;
  const erro = params?.erro;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/70">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#00CF7B]/20 blur-3xl" />
          <CannaLeafPattern className="absolute -bottom-24 right-4 h-96 w-96 rotate-12 text-[#08553F]/5" />
          <CannaLeafPattern className="absolute bottom-20 right-80 hidden h-48 w-48 -rotate-12 text-[#00CF7B]/10 lg:block" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm">
                🌿 Comece por aqui
              </span>

              <h1 className="mt-8 max-w-xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
                Crie sua conta para agendar com segurança.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-[#878787]">
                Cadastre-se como paciente para encontrar médicos especializados,
                enviar documentos e acompanhar sua jornada de cuidado.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
                  <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                  <div className="p-6">
                    <p className="text-3xl">✓</p>

                    <p className="mt-3 font-extrabold text-[#08553F]">
                      Cadastro gratuito
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
                  <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

                  <div className="p-6">
                    <p className="text-3xl">⚕️</p>

                    <p className="mt-3 font-extrabold text-[#08553F]">
                      Médicos aprovados
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Criar conta
                </h2>

                <p className="mt-2 text-[#878787]">
                  Cadastre-se como paciente na CannaDoctor.
                </p>

                {erro ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {erro}
                  </div>
                ) : null}

                <form action={createPatientAccount} className="mt-8 space-y-4">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Nome completo"
                    className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                  />

                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="E-mail"
                    className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                  />

                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Senha"
                    className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                  />

                  <p className="rounded-2xl bg-[#F3EFA1] p-4 text-sm font-semibold text-[#08553F]">
                    Após criar sua conta, você poderá solicitar cadastro médico
                    pelo painel do paciente, caso tenha CRM.
                  </p>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-4 py-4 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Criar conta
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#878787]">
                  Já tem conta?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#08553F] hover:text-[#00CF7B]"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}