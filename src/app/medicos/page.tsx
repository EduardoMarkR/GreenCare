import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import MedicosSearch from "./MedicosSearch";

type MedicosPageProps = {
  searchParams?: Promise<{
    busca?: string;
  }>;
};

export default async function MedicosPage({ searchParams }: MedicosPageProps) {
  const params = await searchParams;
  const busca = params?.busca?.trim();

  const doctors = await prisma.doctor.findMany({
    where: {
      approved: true,
      ...(busca
        ? {
            OR: [
              {
                specialty: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
              {
                crmUf: {
                  contains: busca,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  name: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Encontre seu médico
          </h1>

          <p className="mt-4 text-gray-600">
            Busque especialistas em cannabis medicinal por especialidade,
            cidade e disponibilidade.
          </p>

          <MedicosSearch />

          {doctors.length === 0 ? (
            <p className="mt-10 text-gray-600">
              Nenhum médico encontrado para sua busca.
            </p>
          ) : (
            <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  id={doctor.id}
                  name={doctor.user.name}
                  specialty={doctor.specialty}
                  location={doctor.crmUf}
                  price={`Consulta a partir de R$ ${Number(doctor.price).toFixed(2)}`}
                />
              ))}
            </section>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}