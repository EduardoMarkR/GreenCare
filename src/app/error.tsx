"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Erro capturado pela aplicação:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F7F4E7] px-6 py-20">
      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">
          ⚠️
        </div>

        <h1 className="mt-6 text-4xl font-extrabold text-[#08553F]">
          Algo deu errado
        </h1>

        <p className="mt-4 max-w-xl text-[#878787]">
          Não foi possível concluir esta ação agora. Você pode tentar novamente
          ou voltar para a página inicial.
        </p>

        {error.digest && (
          <p className="mt-4 rounded-2xl bg-[#F7F4E7] px-4 py-3 text-xs font-semibold text-[#878787]">
            Código do erro: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
          >
            Tentar novamente
          </button>

          <Link
            href="/"
            className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Voltar para o início
          </Link>
        </div>
      </section>
    </main>
  );
}