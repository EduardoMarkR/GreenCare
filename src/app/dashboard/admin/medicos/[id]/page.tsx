import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type AdminMedicoDetalhePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDoctorStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Reprovado";

  return status;
}

function getDoctorStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "APPROVED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "REJECTED") return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-800";
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getAppointmentStatusClass(status: string) {
  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CONFIRMED") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-800";
}

export default async function AdminMedicoDetalhePage({
  params,
}: AdminMedicoDetalhePageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      availabilities: {
        orderBy: {
          date: "asc",
        },
      },
      appointments: {
        include: {
          patient: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const estimatedRevenue = doctor.appointments
    .filter((appointment) => appointment.status !== "CANCELLED")
    .reduce((total) => {
      return total + Number(doctor.price);
    }, 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Detalhes do médico"
          title={`Dr(a). ${doctor.user.name}`}
          description="Visualização completa do médico, dados profissionais, horários cadastrados e histórico de consultas."
          backHref="/dashboard/admin/medicos"
          backLabel="Voltar para médicos"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm lg:col-span-1">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                  🩺
                </div>

                <h2 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                  Dados do médico
                </h2>

                <div className="mt-6 space-y-3 text-sm text-[#878787]">
                  <p>
                    <strong className="text-[#08553F]">Nome:</strong>{" "}
                    {doctor.user.name}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">E-mail:</strong>{" "}
                    {doctor.user.email}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Especialidade:</strong>{" "}
                    {doctor.specialty}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">CRM:</strong>{" "}
                    {doctor.crm}/{doctor.crmUf}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Consulta:</strong>{" "}
                    {formatCurrency(Number(doctor.price))}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Telemedicina:</strong>{" "}
                    {doctor.telemedicine ? "Sim" : "Não"}
                  </p>

                  <p>
                    <strong className="text-[#08553F]">Cadastrado em:</strong>{" "}
                    {formatDate(doctor.createdAt)}
                  </p>
                </div>

                <div className="mt-6">
                  <span
                    className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getDoctorStatusClass(
                      doctor.approvalStatus
                    )}`}
                  >
                    {getDoctorStatusLabel(doctor.approvalStatus)}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Consultas vinculadas
                </p>

                <p className="mt-4 text-5xl font-extrabold text-[#08553F]">
                  {doctor.appointments.length}
                </p>

                <p className="mt-3 text-sm text-[#878787]">
                  Total de consultas vinculadas a este médico.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Receita prevista
                </p>

                <p className="mt-4 text-4xl font-extrabold text-[#08553F]">
                  {formatCurrency(estimatedRevenue)}
                </p>

                <p className="mt-3 text-sm text-[#878787]">
                  Soma das consultas não canceladas deste médico.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Biografia
            </h2>

            <p className="mt-4 leading-7 text-[#878787]">
              {doctor.bio || "Nenhuma biografia cadastrada."}
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Horários cadastrados
            </h2>

            <div className="mt-6 grid gap-4">
              {doctor.availabilities.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhum horário cadastrado por este médico.
                  </p>
                </div>
              )}

              {doctor.availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <p className="font-extrabold text-[#08553F]">
                    {formatDate(availability.date)}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#878787]">
                    Das {availability.startTime} às {availability.endTime}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Histórico de consultas
            </h2>

            <div className="mt-6 grid gap-4">
              {doctor.appointments.length === 0 && (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#08553F]">
                    Nenhuma consulta encontrada para este médico.
                  </p>
                </div>
              )}

              {doctor.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-[#08553F]">
                        Paciente: {appointment.patient.user.name}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#08553F]">
                        Data: {formatDate(appointment.date)}
                      </p>

                      <p className="mt-1 text-sm text-[#878787]">
                        Observações:{" "}
                        {appointment.notes || "Nenhuma observação"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getAppointmentStatusClass(
                        appointment.status
                      )}`}
                    >
                      {getAppointmentStatusLabel(appointment.status)}
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