import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
              Área segura
            </span>

            <h1 className="mt-6 max-w-xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
              Acesse sua jornada de cuidado.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-[#878787]">
              Entre na sua conta para acompanhar consultas, documentos,
              agendamentos e informações do seu atendimento.
            </p>

            <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#00CF7B]">
                CannaDoctor
              </p>

              <p className="mt-2 text-2xl font-extrabold text-[#08553F]">
                Simples, transparente e seguro.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="text-3xl font-extrabold text-[#08553F]">
              Entrar
            </h2>

            <p className="mt-2 text-[#878787]">
              Acesse sua conta CannaDoctor.
            </p>

            <form action={loginAction} className="mt-8 space-y-4">
              <input
                name="email"
                type="email"
                placeholder="E-mail"
                className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition focus:border-[#00CF7B]"
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Senha"
                className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition focus:border-[#00CF7B]"
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
        </section>
      </main>

      <Footer />
    </>
  );
}