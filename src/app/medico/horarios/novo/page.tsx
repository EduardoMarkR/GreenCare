import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { createAvailability } from "./actions";

export default function NovoHorarioPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Agenda médica"
          title="Novo horário"
          description="Cadastre uma nova disponibilidade para consultas e mantenha sua agenda aberta para pacientes."
          backHref="/medico/horarios"
          backLabel="Voltar para horários"
        />

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Cadastrar disponibilidade
                </h2>

                <p className="mt-2 text-[#878787]">
                  Escolha a data e o intervalo de horário disponível para
                  atendimento.
                </p>

                <form action={createAvailability} className="mt-8 space-y-6">
                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Data
                    </label>

                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
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
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
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
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Salvar horário
                  </button>
                </form>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                📅
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                Dica de agenda
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#878787]">
                Cadastre horários reais de atendimento. Pacientes poderão
                agendar consultas com base nessas disponibilidades.
              </p>

              <div className="mt-6 rounded-3xl bg-[#F7F4E7] p-5">
                <p className="text-sm font-bold text-[#08553F]">
                  Atenção ao horário
                </p>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  O horário final deve ser posterior ao horário inicial para
                  evitar conflitos na agenda.
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