import { createAppointment } from "./actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    availabilityId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AgendarPage({ params }: Props) {
  const { availabilityId } = await params;

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!availability) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">
              Agendar consulta
            </h1>

            <div className="mt-6 rounded-2xl bg-green-50 p-5">
              <p className="font-semibold text-gray-900">
                {availability.doctor.user.name}
              </p>

              <p className="mt-1 text-green-700">
                {availability.doctor.specialty}
              </p>

              <p className="mt-3 text-gray-700">
                <strong>Data:</strong> {formatDate(availability.date)}
              </p>

              <p className="text-gray-700">
                <strong>Horário:</strong> {availability.startTime} às{" "}
                {availability.endTime}
              </p>

              <p className="text-gray-700">
                <strong>Valor:</strong> R${" "}
                {Number(availability.doctor.price).toFixed(2)}
              </p>
            </div>

            <form action={createAppointment} className="mt-8 space-y-5">
              <input
                type="hidden"
                name="availabilityId"
                value={availability.id}
              />

              <div>
                <label className="mb-2 block font-semibold text-gray-900">
                  Motivo da consulta
                </label>

                <textarea
                  name="notes"
                  placeholder="Conte brevemente o motivo da consulta"
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Confirmar agendamento
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}