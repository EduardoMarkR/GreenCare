import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateDoctorProfile } from "./actions";

export default async function PerfilMedicoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
    },
  });

  if (!doctor) {
    throw new Error("Médico não encontrado.");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/dashboard/medico"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>

            <Link
              href="/medico/horarios"
              className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Minha Agenda
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">
              Perfil Médico
            </h1>

            <p className="mt-2 text-gray-600">
              Atualize seus dados profissionais exibidos para os pacientes.
            </p>

            <form action={updateDoctorProfile} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Nome
                </label>

                <input
                  type="text"
                  name="name"
                  defaultValue={doctor.user.name}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    CRM
                  </label>

                  <input
                    type="text"
                    name="crm"
                    defaultValue={doctor.crm}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    UF do CRM
                  </label>

                  <input
                    type="text"
                    name="crmUf"
                    defaultValue={doctor.crmUf}
                    required
                    maxLength={2}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 uppercase text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Especialidade
                </label>

                <input
                  type="text"
                  name="specialty"
                  defaultValue={doctor.specialty}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Bio
                </label>

                <textarea
                  name="bio"
                  defaultValue={doctor.bio ?? ""}
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Valor da consulta
                </label>

                <input
                  type="number"
                  name="price"
                  defaultValue={Number(doctor.price)}
                  required
                  min={0}
                  step="0.01"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-gray-700">
                <input
                  type="checkbox"
                  name="telemedicine"
                  defaultChecked={doctor.telemedicine}
                  className="h-5 w-5"
                />

                Atendimento por telemedicina
              </label>

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