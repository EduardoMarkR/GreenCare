"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type MedicosSearchProps = {
  buscaAtual?: string;
};

export default function MedicosSearch({ buscaAtual = "" }: MedicosSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("busca") ?? buscaAtual;
  const [search, setSearch] = useState(initialSearch);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("busca", search.trim());
    } else {
      params.delete("busca");
    }

    router.push(`/medicos?${params.toString()}`);
  }

  function handleClear() {
    setSearch("");
    router.push("/medicos");
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mt-10 rounded-[2rem] border border-[#C6C6C6]/60 bg-white/90 p-4 shadow-xl backdrop-blur"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4">
          <span className="text-xl">🔍</span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, especialidade ou estado"
            className="min-h-14 w-full bg-transparent text-[#08553F] placeholder:text-[#878787] outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-[#08553F] px-7 py-4 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
        >
          Buscar
        </button>

        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-2xl border border-[#08553F]/30 px-7 py-4 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Limpar
          </button>
        )}
      </div>
    </form>
  );
}