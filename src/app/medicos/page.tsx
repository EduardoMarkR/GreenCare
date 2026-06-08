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

  const totalApprovedDoctors = await prisma.doctor.count({
    where: {
      approved: true,
    },
  });

  const telemedicineDoctors = await prisma.doctor.count({
    where: {
      approved: true,
      telemedicine: true,
    },
  });

  const totalAvailabilities = await prisma.availability.count({
    where: {
      doctor: {
        approved: true,
      },
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/70">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#00CF7B]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-20">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
              Médicos aprovados
            </span>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-6xl">
                  Encontre o profissional ideal para o seu tratamento.
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#878787]">
                  Busque médicos especializados em cannabis medicinal, veja
                  horários disponíveis e agende sua consulta online com mais
                  segurança e clareza.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#878787]">
                    Médicos aprovados
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {totalApprovedDoctors}
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#878787]">
                    Telemedicina
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {telemedicineDoctors}
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#878787]">
                    Horários disponíveis
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {totalAvailabilities}
                  </p>
                </div>
              </div>
            </div>

            <MedicosSearch buscaAtual={busca ?? ""} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-[#08553F]">
                Profissionais disponíveis
              </h2>

              <p className="mt-2 text-[#878787]">
                {busca
                  ? `Resultado da busca por "${busca}".`
                  : "Veja médicos aprovados para atendimento na plataforma."}
              </p>
            </div>

            <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
              {doctors.length} resultado(s)
            </p>
          </div>

          {doctors.length === 0 ? (
            <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
              <p className="text-xl font-bold text-[#08553F]">
                Nenhum médico encontrado.
              </p>

              <p className="mt-3 text-[#878787]">
                Tente buscar por outra especialidade, nome ou estado.
              </p>
            </div>
          ) : (
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            </section>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}