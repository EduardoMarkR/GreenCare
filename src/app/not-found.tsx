import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#F7F4E7] px-6 py-20">
      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3EFA1] text-4xl">
          🌿
        </div>

        <h1 className="mt-6 text-4xl font-extrabold text-[#08553F]">
          Página não encontrada
        </h1>

        <p className="mt-4 max-w-xl text-[#878787]">
          O endereço acessado não existe ou pode ter sido removido.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
          >
            Voltar para o início
          </Link>

          <Link
            href="/medicos"
            className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Ver médicos
          </Link>
        </div>
      </section>
    </main>
  );
}