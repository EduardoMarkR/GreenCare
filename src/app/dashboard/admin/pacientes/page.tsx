import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CannaPageHero from "@/components/CannaPageHero";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { deletePatient } from "./actions";

type AdminPacientesPageProps = {
  searchParams?: Promise<{
    busca?: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminPacientesPage({
  searchParams,
}: AdminPacientesPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const searchTerm = params?.busca?.trim() ?? "";

  const patients = await prisma.patient.findMany({
    where: searchTerm
      ? {
          OR: [
            {
              phone: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              user: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
            {
              user: {
                email: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : undefined,
    include: {
      user: true,
      appointments: true,
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPatients = await prisma.patient.count();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Gestão de pacientes"
          description="Acompanhe, busque e gerencie pacientes cadastrados, consultas vinculadas e documentos enviados."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Pacientes cadastrados
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalPatients}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Resultado atual
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {patients.length}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Filtro aplicado
                </p>

                <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                  {searchTerm || "Nenhum"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#08553F]">
                  Buscar paciente
                </p>

                <p className="mt-1 text-sm text-[#878787]">
                  Pesquise por nome, e-mail ou telefone.
                </p>
              </div>

              {searchTerm && (
                <p className="text-sm text-[#878787]">
                  Resultado para:{" "}
                  <span className="font-bold text-[#08553F]">
                    {searchTerm}
                  </span>
                </p>
              )}
            </div>

            <form
              action="/dashboard/admin/pacientes"
              className="mt-5 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por nome, e-mail ou telefone"
                className="min-h-12 flex-1 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Buscar
              </button>

              {searchTerm && (
                <Link
                  href="/dashboard/admin/pacientes"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-10 grid gap-5">
            {patients.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum paciente encontrado para os critérios informados.
                </p>
              </div>
            )}

            {patients.map((patient) => (
              <article
                key={patient.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#08553F]">
                        {patient.user.name}
                      </h2>

                      <div className="mt-5 grid gap-2 text-sm text-[#878787] sm:grid-cols-2">
                        <p>
                          <strong className="text-[#08553F]">E-mail:</strong>{" "}
                          {patient.user.email}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Telefone:</strong>{" "}
                          {patient.phone || "Não informado"}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Nascimento:
                          </strong>{" "}
                          {formatDate(patient.birthDate)}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Cadastro:</strong>{" "}
                          {formatDate(patient.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:min-w-72">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#00CF7B]/15 px-5 py-4">
                          <p className="text-sm font-bold text-[#08553F]">
                            Consultas
                          </p>

                          <p className="mt-1 text-3xl font-extrabold text-[#08553F]">
                            {patient.appointments.length}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F7F4E7] px-5 py-4">
                          <p className="text-sm font-bold text-[#08553F]">
                            Documentos
                          </p>

                          <p className="mt-1 text-3xl font-extrabold text-[#08553F]">
                            {patient.documents.length}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/admin/pacientes/${patient.id}`}
                        className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                      >
                        Ver detalhes
                      </Link>

                      <form action={deletePatient}>
                        <input
                          type="hidden"
                          name="patientId"
                          value={patient.id}
                        />

                        <ConfirmSubmitButton
                          message="Tem certeza que deseja excluir este paciente? Consultas e documentos vinculados também serão removidos."
                          className="w-full rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-700"
                        >
                          Excluir paciente
                        </ConfirmSubmitButton>
                      </form>
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