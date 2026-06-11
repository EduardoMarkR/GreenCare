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
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getStatusClass(status: string) {
  if (status === "CANCELLED") {
    return "bg-red-100 text-red-700";
  }

  if (status === "COMPLETED") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-800";
}

export default async function HistoricoMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      status: {
        in: ["COMPLETED", "CANCELLED"],
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
          description="Consulte atendimentos concluídos e cancelados."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/medico/consultas"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 font-bold text-[#08553F]"
            >
              Consultas ativas
            </Link>
          </div>

          <div className="space-y-4">
            {appointments.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum histórico encontrado.
                </p>
              </div>
            )}

            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[2rem] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div>
                    <p className="font-extrabold text-[#08553F]">
                      {appointment.patient.user.name}
                    </p>

                    <p className="mt-2 text-sm text-[#878787]">
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
        </section>
      </main>

      <Footer />
    </>
  );
}