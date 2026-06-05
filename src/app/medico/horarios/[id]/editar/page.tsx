import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateAvailability } from "./actions";

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

type EditarHorarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarHorarioPage({
  params,
}: EditarHorarioPageProps) {
  const { id } = await params;

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

  const availability = await prisma.availability.findFirst({
    where: {
      id,
      doctorId: doctor.id,
    },
  });

  if (!availability) {
    redirect("/medico/horarios");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Horário
            </h1>

            <p className="mt-2 text-gray-600">
              Atualize sua disponibilidade para consultas.
            </p>

            <form action={updateAvailability} className="mt-8 space-y-6">
              <input
                type="hidden"
                name="availabilityId"
                value={availability.id}
              />

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Data
                </label>

                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={formatDateForInput(availability.date)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Hora Inicial
                </label>

                <input
                  type="time"
                  name="startTime"
                  required
                  defaultValue={availability.startTime}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Hora Final
                </label>

                <input
                  type="time"
                  name="endTime"
                  required
                  defaultValue={availability.endTime}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                  Salvar alterações
                </button>

                <Link
                  href="/medico/horarios"
                  className="w-full rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}