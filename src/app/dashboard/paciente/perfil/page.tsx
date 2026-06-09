import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updatePatientProfile } from "./actions";

function formatDateForInput(date: Date | null) {
  if (!date) return "";

  return date.toISOString().split("T")[0];
}

export default async function PerfilPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/60">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#00CF7B]/20 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-6 py-14">
            <Link
              href="/dashboard/paciente"
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#08553F] md:text-5xl">
              Meu perfil
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#878787]">
              Atualize seus dados pessoais e mantenha suas informações de
              contato sempre em dia.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Dados pessoais
                </h2>

                <p className="mt-2 text-[#878787]">
                  Essas informações ajudam a organizar sua jornada de cuidado na
                  plataforma.
                </p>

                <form action={updatePatientProfile} className="mt-8 space-y-6">
                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Nome
                    </label>

                    <input
                      type="text"
                      name="name"
                      defaultValue={patient.user.name}
                      required
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Telefone
                    </label>

                    <input
                      type="text"
                      name="phone"
                      defaultValue={patient.phone ?? ""}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Data de nascimento
                    </label>

                    <input
                      type="date"
                      name="birthDate"
                      defaultValue={formatDateForInput(patient.birthDate)}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Salvar alterações
                  </button>
                </form>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                🌿
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-[#08553F]">
                Precisa de atendimento?
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#878787]">
                Encontre médicos disponíveis e agende uma consulta de forma
                simples.
              </p>

              <Link
                href="/medicos"
                className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#00CF7B] px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Agendar consulta
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}