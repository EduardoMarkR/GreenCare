"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function MedicosSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("busca") ?? "";
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

  return (
    <form
      onSubmit={handleSearch}
      className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nome, especialidade ou estado"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600"
      />
    </form>
  );
}