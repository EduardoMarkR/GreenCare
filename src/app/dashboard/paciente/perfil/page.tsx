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
          <div className="rounded-3xl bg-white p-8 shadow-md">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                Meu Perfil
              </h1>

              <Link
                href="/dashboard/paciente"
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Voltar
              </Link>
            </div>

            <form
              action={updatePatientProfile}
              className="mt-8 space-y-6"
            >
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