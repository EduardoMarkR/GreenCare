import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { deleteAvailability } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function HorariosPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const availabilities = await prisma.availability.findMany({
    where: {
      doctorId: doctor.id,
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
            {availabilities.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Você ainda não cadastrou nenhum horário.
                </p>
              </div>
            )}

            {availabilities.map((availability) => (
              <article
                key={availability.id}
                className="rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Horário disponível
                    </p>

                    <p className="text-gray-600">
                      {formatDate(availability.date)}
                    </p>

                    <p className="text-green-700">
                      {availability.startTime} às {availability.endTime}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                      Disponível
                    </span>

                    <Link
                      href={`/medico/horarios/${availability.id}/editar`}
                      className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      Editar
                    </Link>

                    <form action={deleteAvailability}>
                      <input
                        type="hidden"
                        name="availabilityId"
                        value={availability.id}
                      />

                      <button
                        type="submit"
                        className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                      >
                        Excluir horário
                      </button>
                    </form>
                  </div>
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