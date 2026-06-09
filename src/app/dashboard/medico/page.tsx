import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-800";
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

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Área médica"
          title={`Olá, ${doctor.user.name}`}
          description="Gerencie sua agenda, disponibilidade e consultas recebidas em uma experiência profissional e organizada."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/medico/perfil"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Perfil profissional
            </Link>

            <Link
              href="/medico/horarios"
              className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Minha agenda
            </Link>

            <Link
              href="/medico/consultas"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Minhas consultas
            </Link>

            <Link
              href="/logout"
              className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              Sair
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Horários cadastrados
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {totalHorarios}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Disponibilidades criadas na sua agenda.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Consultas totais
              </p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {totalConsultas}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas vinculadas ao seu perfil.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">Pendentes</p>

              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {consultasPendentes}
              </p>

              <p className="mt-3 text-sm text-[#878787]">
                Consultas aguardando confirmação.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Link
              href="/dashboard/medico/perfil"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  🩺
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Perfil profissional
                </h2>

                <p className="mt-2 text-[#878787]">
                  Edite seus dados, CRM, bio, atendimento e valor da consulta.
                </p>

                <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Editar perfil →
                </p>
              </div>
            </Link>

            <Link
              href="/medico/horarios"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                  📅
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Minha agenda
                </h2>

                <p className="mt-2 text-[#878787]">
                  Veja, crie ou remova horários disponíveis para pacientes.
                </p>

                <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Gerenciar agenda →
                </p>
              </div>
            </Link>

            <Link
              href="/medico/consultas"
              className="group block overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F4E7] text-2xl">
                  💬
                </div>

                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Minhas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Confirme, cancele, conclua e acompanhe os atendimentos.
                </p>

                <p className="mt-5 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                  Ver consultas →
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Próximas consultas
                </h2>

                <p className="mt-2 text-[#878787]">
                  Veja os próximos atendimentos vinculados ao seu perfil médico.
                </p>
              </div>

              <Link
                href="/medico/consultas"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Gerenciar consultas
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {proximasConsultas.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada.
                  </p>

                  <p className="mt-2 text-sm text-[#878787]">
                    Quando pacientes agendarem consultas, elas aparecerão aqui.
                  </p>
                </div>
              )}

              {proximasConsultas.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        {appointment.patient.user.name}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#08553F]">
                        {formatDate(appointment.date)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}