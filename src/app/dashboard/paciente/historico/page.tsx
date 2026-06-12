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
  if (status === "COMPLETED") return "Concluída";
  if (status === "CANCELLED") return "Cancelada";

  return status;
}

function getStatusClass(status: string) {
  if (status === "COMPLETED") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (status === "CANCELLED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default async function HistoricoPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
    },
    include: {
      availability: true,
      medicalRecord: true,
      prescription: true,
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Histórico"
          title="Histórico de consultas"
          description="Visualize consultas concluídas e canceladas, prontuários e receitas médicas."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {appointments.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="font-bold text-[#08553F]">
                Nenhuma consulta encontrada.
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Seu histórico aparecerá aqui após a conclusão das consultas.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
                >
                  <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                  <div className="p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xl font-extrabold text-[#08553F]">
                          Dr(a). {appointment.doctor.user.name}
                        </p>

                        <p className="mt-1 text-sm text-[#878787]">
                          {appointment.doctor.specialty}
                        </p>

                        <p className="mt-3 text-sm font-semibold text-[#08553F]">
                          {formatDate(appointment.date)}
                        </p>

                        {appointment.availability ? (
                          <p className="mt-1 text-sm font-semibold text-[#08553F]">
                            {appointment.availability.startTime} às{" "}
                            {appointment.availability.endTime}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-[#878787]">
                            Horário não informado
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ring-1 ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {appointment.medicalRecord && (
                        <a
                          href={`/api/prontuario/${appointment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                        >
                          Prontuário PDF →
                        </a>
                      )}

                      {appointment.prescription && (
                        <a
                          href={`/api/receita/${appointment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                        >
                          Receita PDF →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}