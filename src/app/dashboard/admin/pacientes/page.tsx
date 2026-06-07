import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminPacientesPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const patients = await prisma.patient.findMany({
    include: {
      user: true,
      appointments: true,
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Gestão de Pacientes
              </h1>

              <p className="mt-3 text-gray-600">
                Acompanhe pacientes cadastrados, consultas e documentos enviados.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          <div className="mt-10 grid gap-4">
            {patients.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">Nenhum paciente cadastrado.</p>
              </div>
            )}

            {patients.map((patient) => (
              <article
                key={patient.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {patient.user.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      E-mail: {patient.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Telefone: {patient.phone || "Não informado"}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Data de nascimento: {formatDate(patient.birthDate)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-green-50 px-5 py-4">
                      <p className="text-sm font-semibold text-green-800">
                        Consultas
                      </p>

                      <p className="mt-1 text-2xl font-bold text-green-900">
                        {patient.appointments.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 px-5 py-4">
                      <p className="text-sm font-semibold text-blue-800">
                        Documentos
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-900">
                        {patient.documents.length}
                      </p>
                    </div>
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