import Link from "next/link";
import DoctorCard from "./DoctorCard";

export default function FeaturedDoctors() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
              Profissionais aprovados
            </span>

            <h2 className="mt-6 max-w-2xl text-4xl font-extrabold tracking-tight text-[#08553F] md:text-5xl">
              Médicos em destaque para acompanhamento com cannabis medicinal.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#878787]">
              Encontre profissionais qualificados para uma jornada de cuidado
              mais simples, esclarecedora e segura.
            </p>
          </div>

          <Link
            href="/medicos"
            className="rounded-2xl border border-[#08553F]/30 bg-[#F7F4E7] px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Ver todos os médicos
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DoctorCard
            id="demo-ana"
            name="Dra. Ana Oliveira"
            specialty="Neurologia"
            location="São Paulo - SP"
            price="Consulta a partir de R$ 250"
          />

          <DoctorCard
            id="demo-carlos"
            name="Dr. Carlos Santos"
            specialty="Psiquiatria"
            location="Rio de Janeiro - RJ"
            price="Consulta a partir de R$ 300"
          />

          <DoctorCard
            id="demo-mariana"
            name="Dra. Mariana Costa"
            specialty="Clínica Geral"
            location="Belo Horizonte - MG"
            price="Consulta a partir de R$ 220"
          />
        </div>
      </div>
    </section>
  );
}