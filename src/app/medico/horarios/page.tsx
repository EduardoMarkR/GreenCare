import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function HorariosPage() {
  const availabilities = await prisma.availability.findMany({
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Meus Horários
              </h1>

              <p className="mt-3 text-gray-600">
                Gerencie sua disponibilidade para consultas.
              </p>
            </div>

            <Link
              href="/medico/horarios/novo"
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Novo Horário
            </Link>
          </div>

          <div className="mt-10 grid gap-4">
            {availabilities.map((availability) => (
              <article
                key={availability.id}
                className="rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {availability.doctor.user.name}
                    </p>

                    <p className="text-gray-600">
                      {formatDate(availability.date)}
                    </p>

                    <p className="text-green-700">
                      {availability.startTime} às {availability.endTime}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                    Disponível
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}