import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function DoctorPage({ params }: Props) {
  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      availabilities: {
        orderBy: [
          {
            date: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <Link
            href="/medicos"
            className="mb-6 inline-flex items-center text-sm font-semibold text-green-700 transition hover:text-green-800"
          >
            ← Voltar para médicos
          </Link>

          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-4xl font-bold text-gray-900">
              {doctor.user.name}
            </h1>

            <p className="mt-4 text-lg font-semibold text-green-700">
              {doctor.specialty}
            </p>

            <div className="mt-8 space-y-4 text-gray-700">
              <p>
                <strong className="text-gray-900">CRM:</strong>{" "}
                {doctor.crm}/{doctor.crmUf}
              </p>

              <p>
                <strong className="text-gray-900">Telemedicina:</strong>{" "}
                {doctor.telemedicine ? "Disponível" : "Não disponível"}
              </p>

              <p>
                <strong className="text-gray-900">Valor da consulta:</strong>{" "}
                R$ {Number(doctor.price).toFixed(2)}
              </p>

              <div>
                <strong className="text-gray-900">Biografia:</strong>

                <p className="mt-2 leading-relaxed text-gray-700">
                  {doctor.bio ?? "Biografia não informada."}
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Horários disponíveis
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Selecione um horário abaixo para continuar com o agendamento.
              </p>

              {doctor.availabilities.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="font-semibold text-gray-900">
                    Nenhum horário disponível no momento.
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Volte mais tarde ou escolha outro médico disponível na
                    plataforma.
                  </p>

                  <Link
                    href="/medicos"
                    className="mt-4 inline-flex rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Ver outros médicos
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {doctor.availabilities.map((availability) => (
                    <Link
                      key={availability.id}
                      href={`/agendar/${availability.id}`}
                      className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-left transition hover:border-green-600 hover:bg-green-100"
                    >
                      <p className="font-semibold text-gray-900">
                        {formatDate(availability.date)}
                      </p>

                      <p className="mt-1 text-green-700">
                        {availability.startTime} às {availability.endTime}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}