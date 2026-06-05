import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function DashboardMedicoPage() {
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
    include: {
      user: true,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  const totalHorarios = await prisma.availability.count({
    where: {
      doctorId: doctor.id,
    },
  });

  const totalConsultas = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
    },
  });

  const consultasPendentes = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: "PENDING",
    },
  });

  const proximasConsultas = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: {
        not: "CANCELLED",
      },
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área médica
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Olá, {doctor.user.name}
              </h1>

              <p className="mt-4 text-gray-600">
                Gerencie sua agenda, disponibilidade e consultas recebidas.
              </p>
            </div>

            <Link
              href="/logout"
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
            >
              Sair
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Horários cadastrados
              </h2>

              <p className="mt-4 text-4xl font-bold text-green-700">
                {totalHorarios}
              </p>

              <p className="mt-2 text-gray-600">
                Disponibilidades criadas.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Consultas totais
              </h2>

              <p className="mt-4 text-4xl font-bold text-green-700">
                {totalConsultas}
              </p>

              <p className="mt-2 text-gray-600">
                Consultas vinculadas a você.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Pendentes
              </h2>

              <p className="mt-4 text-4xl font-bold text-yellow-600">
                {consultasPendentes}
              </p>

              <p className="mt-2 text-gray-600">
                Aguardando confirmação.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-gray-900">
                Perfil profissional
              </h2>

              <p className="mt-3 text-gray-600">
                Editar dados, CRM, bio e valor da consulta.
              </p>
            </Link>

            <Link
              href="/medico/horarios"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-gray-900">
                Minha agenda
              </h2>

              <p className="mt-3 text-gray-600">
                Ver, editar ou excluir horários disponíveis.
              </p>
            </Link>

            <Link
              href="/medico/consultas"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-gray-900">
                Minhas consultas
              </h2>

              <p className="mt-3 text-gray-600">
                Confirmar, cancelar ou concluir consultas.
              </p>
            </Link>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Próximas consultas
              </h2>

              <div className="mt-5 space-y-4">
                {proximasConsultas.length === 0 && (
                  <p className="text-gray-600">
                    Nenhuma consulta encontrada.
                  </p>
                )}

                {proximasConsultas.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {appointment.patient.user.name}
                    </p>

                    <p className="text-sm text-gray-600">
                      {formatDate(appointment.date)}
                    </p>

                    <span className="mt-3 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}