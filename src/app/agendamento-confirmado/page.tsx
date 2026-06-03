import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AgendamentoConfirmadoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl bg-white p-10 text-center shadow-md">
            <div className="mb-6 text-6xl">🎉</div>

            <h1 className="text-4xl font-bold text-gray-900">
              Agendamento realizado!
            </h1>

            <p className="mt-4 text-lg text-gray-600">
              Sua solicitação foi enviada com sucesso.
            </p>

            <p className="mt-2 text-gray-600">
              Em breve o médico ou a equipe entrará em contato para confirmar
              os detalhes da consulta.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/medicos"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
              >
                Ver mais médicos
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100"
              >
                Voltar para início
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}