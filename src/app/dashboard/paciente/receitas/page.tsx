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

export default async function ReceitasPacientePage() {
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

  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientId: patient.id,
    },
    include: {
      appointment: {
        include: {
          availability: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Receitas"
          title="Minhas receitas"
          description="Acesse suas receitas médicas emitidas após consultas concluídas."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {prescriptions.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="font-bold text-[#08553F]">
                Nenhuma receita encontrada.
              </p>

              <p className="mt-2 text-sm text-[#878787]">
                Quando um médico emitir uma receita, ela aparecerá aqui.
              </p>

              <Link
                href="/medicos"
                className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Agendar consulta
              </Link>
            </div>
          ) : (
            <div className="grid gap-5">
              {prescriptions.map((prescription) => (
                <article
                  key={prescription.id}
                  className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
                >
                  <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                  <div className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xl font-extrabold text-[#08553F]">
                          Dr(a). {prescription.doctor.user.name}
                        </p>

                        <p className="mt-1 text-sm text-[#878787]">
                          {prescription.doctor.specialty}
                        </p>

                        <p className="mt-3 text-sm font-semibold text-[#08553F]">
                          {formatDate(prescription.appointment.date)}
                        </p>

                        {prescription.appointment.availability ? (
                          <p className="mt-1 text-sm font-semibold text-[#08553F]">
                            {prescription.appointment.availability.startTime} às{" "}
                            {prescription.appointment.availability.endTime}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-[#878787]">
                            Horário não informado
                          </p>
                        )}

                        <div className="mt-5 rounded-2xl bg-[#F7F4E7] p-4">
                          <p className="text-sm font-bold text-[#08553F]">
                            Medicamento
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#878787]">
                            {prescription.medication}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`/api/receita/${prescription.appointmentId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit rounded-full bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                      >
                        Abrir receita PDF →
                      </a>
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