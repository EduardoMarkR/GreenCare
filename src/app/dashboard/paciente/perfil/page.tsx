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

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/dashboard/paciente"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>

            <Link
              href="/medicos"
              className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Agendar Consulta
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">
              Meu Perfil
            </h1>

            <p className="mt-2 text-gray-600">
              Atualize seus dados pessoais e informações de contato.
            </p>

            <form action={updatePatientProfile} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Nome
                </label>

                <input
                  type="text"
                  name="name"
                  defaultValue={patient.user.name}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Telefone
                </label>

                <input
                  type="text"
                  name="phone"
                  defaultValue={patient.phone ?? ""}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Data de nascimento
                </label>

                <input
                  type="date"
                  name="birthDate"
                  defaultValue={formatDateForInput(patient.birthDate)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                Salvar alterações
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}