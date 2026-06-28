import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import MedicosSearch from "./MedicosSearch";

type MedicosPageProps = {
  searchParams?: Promise<{
    busca?: string;
  }>;
};

function getTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export default async function MedicosPage({ searchParams }: MedicosPageProps) {
  const params = await searchParams;
  const busca = params?.busca?.trim();
  const today = getTodayUtc();

  const doctors = await prisma.doctor.findMany({
    where: {
      approved: true,
      approvalStatus: "APPROVED",
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

  const doctorIds = doctors.map((doctor) => doctor.id);

  const totalApprovedDoctors = await prisma.doctor.count({
    where: {
      approved: true,
      approvalStatus: "APPROVED",
    },
  });

  const telemedicineDoctors = await prisma.doctor.count({
    where: {
      approved: true,
      approvalStatus: "APPROVED",
      telemedicine: true,
    },
  });

  const totalAvailabilities =
    doctorIds.length > 0
      ? await prisma.availability.count({
          where: {
            doctorId: {
              in: doctorIds,
            },
            date: {
              gte: today,
            },
            appointments: {
              none: {
                status: {
                  in: ["PENDING", "CONFIRMED", "COMPLETED"],
                },
              },
            },
          },
        })
      : 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Médicos aprovados"
          title="Encontre o profissional ideal para o seu tratamento"
          description="Busque médicos especializados em cannabis medicinal, veja horários disponíveis e agende sua consulta online com mais segurança e clareza."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Médicos aprovados
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalApprovedDoctors}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Telemedicina
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {telemedicineDoctors}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Horários disponíveis
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalAvailabilities}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <MedicosSearch buscaAtual={busca ?? ""} />
          </div>

          <div className="mt-12">
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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}