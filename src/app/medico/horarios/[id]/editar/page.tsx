import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { updateAvailability } from "./actions";

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

type EditarHorarioPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
  }>;
};

export default async function EditarHorarioPage({
  params,
  searchParams,
}: EditarHorarioPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const erro = query?.erro;

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

  const availability = await prisma.availability.findFirst({
    where: {
      id,
      doctorId: doctor.id,
    },
    include: {
      appointments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      },
    },
  });

  if (!availability) {
    redirect("/medico/horarios");
  }

  const hasLinkedAppointment = availability.appointments.length > 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Agenda médica"
          title="Editar horário"
          description="Atualize sua disponibilidade para consultas e mantenha sua agenda sempre organizada."
          backHref="/medico/horarios"
          backLabel="Voltar para horários"
        />

        <section className="mx-auto max-w-5xl px-6 py-12">
          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível salvar
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          {hasLinkedAppointment ? (
            <div className="mb-8 rounded-[2rem] border border-[#F3EFA1] bg-[#F3EFA1]/40 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Horário com consulta vinculada
              </p>

              <p className="mt-3 text-sm leading-6 text-[#08553F]">
                Este horário possui consulta pendente ou confirmada. Para evitar
                conflitos na agenda, ele não pode ser editado enquanto houver
                atendimento ativo vinculado.
              </p>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Atualizar disponibilidade
                </h2>

                <p className="mt-2 text-[#878787]">
                  Faça ajustes na data ou horários disponíveis para atendimento.
                </p>

                <form action={updateAvailability} className="mt-8 space-y-6">
                  <input
                    type="hidden"
                    name="availabilityId"
                    value={availability.id}
                  />

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Data
                    </label>

                    <input
                      type="date"
                      name="date"
                      required
                      disabled={hasLinkedAppointment}
                      defaultValue={formatDateForInput(availability.date)}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Hora inicial
                    </label>

                    <input
                      type="time"
                      name="startTime"
                      required
                      disabled={hasLinkedAppointment}
                      defaultValue={availability.startTime}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Hora final
                    </label>

                    <input
                      type="time"
                      name="endTime"
                      required
                      disabled={hasLinkedAppointment}
                      defaultValue={availability.endTime}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={hasLinkedAppointment}
                      className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:bg-[#878787] disabled:text-white"
                    >
                      {hasLinkedAppointment
                        ? "Edição bloqueada"
                        : "Salvar alterações"}
                    </button>

                    <Link
                      href="/medico/horarios"
                      className="w-full rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                    >
                      Cancelar
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                ⏰
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                Lembrete
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#878787]">
                Alterações na disponibilidade impactam diretamente os horários
                exibidos para pacientes durante o agendamento.
              </p>

              <div className="mt-6 rounded-3xl bg-[#F7F4E7] p-5">
                <p className="text-sm font-bold text-[#08553F]">
                  Boa prática
                </p>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  Evite horários sobrepostos para manter sua agenda organizada e
                  evitar conflitos futuros.
                </p>
              </div>

              <Link
                href="/dashboard/medico"
                className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#00CF7B] px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Painel médico
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}