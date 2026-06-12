import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaLeafPattern from "@/components/CannaLeafPattern";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    erro?: string;
    sucesso?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const erro = params?.erro;
  const sucesso = params?.sucesso;

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
                🌿 Área segura
              </span>

              <h1 className="mt-8 max-w-xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
                Acesse sua jornada de cuidado.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-[#878787]">
                Entre na sua conta para acompanhar consultas, documentos,
                agendamentos e informações do seu atendimento.
              </p>

              <div className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <p className="text-sm font-bold text-[#00CF7B]">
                    CannaDoctor
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-[#08553F]">
                    Simples, transparente e seguro.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Entrar
                </h2>

                <p className="mt-2 text-[#878787]">
                  Acesse sua conta CannaDoctor.
                </p>

                {erro ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {erro}
                  </div>
                ) : null}

                {sucesso ? (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                    {sucesso}
                  </div>
                ) : null}

                <form action={loginAction} className="mt-8 space-y-4">
                  <input
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    required
                  />

                  <input
                    name="password"
                    type="password"
                    placeholder="Senha"
                    className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-4 py-4 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Entrar
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#878787]">
                  Ainda não tem conta?{" "}
                  <Link
                    href="/cadastro"
                    className="font-bold text-[#08553F] hover:text-[#00CF7B]"
                  >
                    Criar conta
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