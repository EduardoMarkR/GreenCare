import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateDoctorApproval } from "./actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminMedicosPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
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
                Gestão de Médicos
              </h1>

              <p className="mt-3 text-gray-600">
                Aprove, reprove e acompanhe os profissionais cadastrados.
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
            {doctors.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Nenhum médico cadastrado.
                </p>
              </div>
            )}

            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {doctor.user.name}
                    </h2>

                    <p className="mt-2 text-gray-600">
                      {doctor.specialty}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      CRM {doctor.crm}/{doctor.crmUf}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Consulta: {formatCurrency(Number(doctor.price))}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Telemedicina: {doctor.telemedicine ? "Sim" : "Não"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    {doctor.approved ? (
                      <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                        Aprovado
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
                        Pendente/Reprovado
                      </span>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {!doctor.approved && (
                        <form action={updateDoctorApproval}>
                          <input
                            type="hidden"
                            name="doctorId"
                            value={doctor.id}
                          />

                          <input
                            type="hidden"
                            name="approved"
                            value="true"
                          />

                          <button
                            type="submit"
                            className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-200"
                          >
                            Aprovar
                          </button>
                        </form>
                      )}

                      {doctor.approved && (
                        <form action={updateDoctorApproval}>
                          <input
                            type="hidden"
                            name="doctorId"
                            value={doctor.id}
                          />

                          <input
                            type="hidden"
                            name="approved"
                            value="false"
                          />

                          <button
                            type="submit"
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-200"
                          >
                            Reprovar
                          </button>
                        </form>
                      )}
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