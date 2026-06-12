import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { deleteAvailability } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

type HorariosPageProps = {
  searchParams?: Promise<{
    excluir?: string;
    erro?: string;
  }>;
};

export default async function HorariosPage({ searchParams }: HorariosPageProps) {
  const params = await searchParams;
  const availabilityToDeleteId = params?.excluir;
  const erro = params?.erro;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/");
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

  const availabilityToDelete = availabilityToDeleteId
    ? availabilities.find(
        (availability) => availability.id === availabilityToDeleteId
      )
    : null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Agenda médica"
          title="Meus horários"
          description="Gerencie sua disponibilidade para consultas e mantenha sua agenda sempre organizada para pacientes."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível concluir a ação
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          {availabilityToDelete ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Confirmar exclusão de horário
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">
                Tem certeza que deseja excluir o horário de{" "}
                <strong>{formatDate(availabilityToDelete.date)}</strong>, das{" "}
                <strong>{availabilityToDelete.startTime}</strong> às{" "}
                <strong>{availabilityToDelete.endTime}</strong>?
              </p>

              <p className="mt-2 text-sm leading-6 text-red-700">
                Essa ação não poderá ser desfeita.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <form action={deleteAvailability}>
                  <input
                    type="hidden"
                    name="availabilityId"
                    value={availabilityToDelete.id}
                  />

                  <button
                    type="submit"
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    Sim, excluir horário
                  </button>
                </form>

                <Link
                  href="/medico/horarios"
                  className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-bold text-[#08553F] ring-1 ring-[#C6C6C6]/70 transition hover:bg-[#F3EFA1]"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/medico/horarios/novo"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Novo horário
            </Link>

            <Link
              href="/medico/consultas"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Minhas consultas
            </Link>

            <Link
              href="/dashboard/medico/integracoes"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Integrações
            </Link>
          </div>

          <div className="grid gap-4">
            {availabilities.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Você ainda não cadastrou nenhum horário.
                </p>

                <p className="mt-2 text-sm text-[#878787]">
                  Crie seu primeiro horário para que pacientes possam agendar
                  consultas.
                </p>
              </div>
            )}

            {availabilities.map((availability) => (
              <article
                key={availability.id}
                className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm transition hover:border-[#00CF7B]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-extrabold text-[#08553F]">
                      Horário disponível
                    </p>

                    <p className="mt-1 text-sm text-[#878787]">
                      {formatDate(availability.date)}
                    </p>

                    <p className="mt-2 text-sm font-bold text-[#08553F]">
                      {availability.startTime} às {availability.endTime}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="w-fit rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                      Disponível
                    </span>

                    <Link
                      href={`/medico/horarios/${availability.id}/editar`}
                      className="rounded-full bg-blue-100 px-4 py-2 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-200"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/medico/horarios?excluir=${availability.id}`}
                      className="rounded-full bg-red-100 px-4 py-2 text-center text-sm font-bold text-red-700 transition hover:bg-red-200"
                    >
                      Excluir horário
                    </Link>
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