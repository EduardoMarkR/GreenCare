import Link from "next/link";
import DoctorCard from "./DoctorCard";
import { prisma } from "@/lib/prisma";

export default async function FeaturedDoctors() {
  const doctors = await prisma.doctor.findMany({
    where: {
      approved: true,
      approvalStatus: "APPROVED",
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

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

        {doctors.length === 0 ? (
          <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-[#F7F4E7] p-8">
            <p className="text-xl font-extrabold text-[#08553F]">
              Nenhum médico aprovado em destaque no momento.
            </p>

            <p className="mt-3 text-[#878787]">
              Assim que novos profissionais forem aprovados, eles aparecerão
              nesta área.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                id={doctor.id}
                name={doctor.user.name}
                specialty={doctor.specialty}
                location={`CRM ${doctor.crm}/${doctor.crmUf}`}
                price={`Consulta a partir de R$ ${Number(
                  doctor.price
                ).toFixed(2)}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}