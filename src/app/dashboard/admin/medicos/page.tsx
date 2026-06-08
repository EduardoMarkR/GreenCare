import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateDoctorApproval } from "./actions";
import { deleteDoctor } from "./delete-actions";

type AdminMedicosPageProps = {
  searchParams?: Promise<{
    status?: string;
    busca?: string;
    success?: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusBadge(status: string) {
  if (status === "APPROVED") {
    return (
      <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
        Aprovado
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
        Reprovado
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
      Pendente
    </span>
  );
}

function getFilterClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white"
    : "rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100";
}

function getFilterHref(status: string, searchTerm: string) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (searchTerm) {
    params.set("busca", searchTerm);
  }

  const queryString = params.toString();

  return queryString
    ? `/dashboard/admin/medicos?${queryString}`
    : "/dashboard/admin/medicos";
}

function getSuccessMessage(success?: string) {
  if (success === "medico-aprovado") {
    return "Médico aprovado com sucesso.";
  }

  if (success === "medico-reprovado") {
    return "Médico reprovado com sucesso.";
  }

  if (success === "medico-pendente") {
    return "Médico voltou para pendente com sucesso.";
  }

  if (success === "medico-excluido") {
    return "Médico excluído com sucesso.";
  }

  return null;
}

export default async function AdminMedicosPage({
  searchParams,
}: AdminMedicosPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedStatus = params?.status ?? "ALL";
  const searchTerm = params?.busca?.trim() ?? "";
  const successMessage = getSuccessMessage(params?.success);

  const validStatuses = ["ALL", "PENDING", "APPROVED", "REJECTED"];
  const statusFilter = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : "ALL";

  const doctors = await prisma.doctor.findMany({
    where: {
      ...(statusFilter !== "ALL"
        ? {
            approvalStatus: statusFilter as
              | "PENDING"
              | "APPROVED"
              | "REJECTED",
          }
        : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                specialty: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                crm: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                crmUf: {
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
        : {}),
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDoctors = await prisma.doctor.count();

  const pendingDoctors = await prisma.doctor.count({
    where: {
      approvalStatus: "PENDING",
    },
  });

  const approvedDoctors = await prisma.doctor.count({
    where: {
      approvalStatus: "APPROVED",
    },
  });

  const rejectedDoctors = await prisma.doctor.count({
    where: {
      approvalStatus: "REJECTED",
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
                Aprove, reprove, busque e acompanhe os profissionais cadastrados.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          {successMessage && (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 shadow-sm">
              ✅ {successMessage}
            </div>
          )}

          <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-700">
              Buscar médico
            </p>

            <form
              action="/dashboard/admin/medicos"
              className="flex flex-col gap-3 md:flex-row"
            >
              {statusFilter !== "ALL" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}

              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por nome, e-mail, CRM ou especialidade"
                className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Buscar
              </button>

              {(searchTerm || statusFilter !== "ALL") && (
                <Link
                  href="/dashboard/admin/medicos"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-700">
              Filtrar por status
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={getFilterHref("ALL", searchTerm)}
                className={getFilterClass(statusFilter === "ALL")}
              >
                Todos ({totalDoctors})
              </Link>

              <Link
                href={getFilterHref("PENDING", searchTerm)}
                className={getFilterClass(statusFilter === "PENDING")}
              >
                Pendentes ({pendingDoctors})
              </Link>

              <Link
                href={getFilterHref("APPROVED", searchTerm)}
                className={getFilterClass(statusFilter === "APPROVED")}
              >
                Aprovados ({approvedDoctors})
              </Link>

              <Link
                href={getFilterHref("REJECTED", searchTerm)}
                className={getFilterClass(statusFilter === "REJECTED")}
              >
                Reprovados ({rejectedDoctors})
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4">
            {doctors.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Nenhum médico encontrado para os critérios informados.
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

                    <p className="mt-2 text-gray-600">{doctor.specialty}</p>

                    <p className="mt-1 text-sm text-gray-600">
                      CRM {doctor.crm}/{doctor.crmUf}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Consulta: {formatCurrency(Number(doctor.price))}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Telemedicina: {doctor.telemedicine ? "Sim" : "Não"}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      E-mail: {doctor.user.email}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    {getStatusBadge(doctor.approvalStatus)}

                    <Link
                      href={`/dashboard/admin/medicos/${doctor.id}`}
                      className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                    >
                      Ver detalhes
                    </Link>

                    <form action={deleteDoctor}>
                      <input
                        type="hidden"
                        name="doctorId"
                        value={doctor.id}
                      />

                      <ConfirmSubmitButton
                        message="Tem certeza que deseja excluir este médico? Horários e consultas vinculadas também serão removidos."
                        loadingText="Excluindo..."
                        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Excluir médico
                      </ConfirmSubmitButton>
                    </form>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {doctor.approvalStatus !== "APPROVED" && (
                        <form action={updateDoctorApproval}>
                          <input
                            type="hidden"
                            name="doctorId"
                            value={doctor.id}
                          />

                          <input
                            type="hidden"
                            name="approvalStatus"
                            value="APPROVED"
                          />

                          <SubmitButton
                            loadingText="Aprovando..."
                            className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Aprovar
                          </SubmitButton>
                        </form>
                      )}

                      {doctor.approvalStatus !== "REJECTED" && (
                        <form action={updateDoctorApproval}>
                          <input
                            type="hidden"
                            name="doctorId"
                            value={doctor.id}
                          />

                          <input
                            type="hidden"
                            name="approvalStatus"
                            value="REJECTED"
                          />

                          <SubmitButton
                            loadingText="Reprovando..."
                            className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Reprovar
                          </SubmitButton>
                        </form>
                      )}

                      {doctor.approvalStatus !== "PENDING" && (
                        <form action={updateDoctorApproval}>
                          <input
                            type="hidden"
                            name="doctorId"
                            value={doctor.id}
                          />

                          <input
                            type="hidden"
                            name="approvalStatus"
                            value="PENDING"
                          />

                          <SubmitButton
                            loadingText="Atualizando..."
                            className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Voltar para pendente
                          </SubmitButton>
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