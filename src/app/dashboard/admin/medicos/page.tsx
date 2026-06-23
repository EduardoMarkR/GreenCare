import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CannaPageHero from "@/components/CannaPageHero";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateDoctorApproval, updateDoctorPlatformFee } from "./actions";
import { deleteDoctor } from "./delete-actions";

type AdminMedicosPageProps = {
  searchParams?: Promise<{
    status?: string;
    busca?: string;
    success?: string;
    pagina?: string;
  }>;
};

const DOCTORS_PER_PAGE = 20;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusBadge(status: string) {
  if (status === "APPROVED") {
    return (
      <span className="w-fit rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
        Aprovado
      </span>
    );
  }

  if (status === "REJECTED") {
    return (
      <span className="w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
        Reprovado
      </span>
    );
  }

  return (
    <span className="w-fit rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
      Pendente
    </span>
  );
}

function getFilterClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-[#08553F] px-5 py-2 text-sm font-bold text-white shadow-sm"
    : "rounded-full border border-[#08553F]/30 bg-white px-5 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]";
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

function getPaginationHref(
  page: number,
  statusFilter: string,
  searchTerm: string
) {
  const params = new URLSearchParams();

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }

  if (searchTerm) {
    params.set("busca", searchTerm);
  }

  params.set("pagina", String(page));

  return `/dashboard/admin/medicos?${params.toString()}`;
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

  if (success === "comissao-atualizada") {
    return "Comissão da plataforma atualizada com sucesso.";
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
  const currentPage = Math.max(Number(params?.pagina ?? "1"), 1);
  const skip = (currentPage - 1) * DOCTORS_PER_PAGE;

  const validStatuses = ["ALL", "PENDING", "APPROVED", "REJECTED"];
  const statusFilter = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : "ALL";

  const where = {
    ...(statusFilter !== "ALL"
      ? {
          approvalStatus: statusFilter as "PENDING" | "APPROVED" | "REJECTED",
        }
      : {}),
    ...(searchTerm
      ? {
          OR: [
            {
              specialty: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
            {
              crm: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
            {
              crmUf: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
            {
              user: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              user: {
                email: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    doctors,
    totalFilteredDoctors,
    totalDoctors,
    pendingDoctors,
    approvedDoctors,
    rejectedDoctors,
  ] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: DOCTORS_PER_PAGE,
    }),
    prisma.doctor.count({
      where,
    }),
    prisma.doctor.count(),
    prisma.doctor.count({
      where: {
        approvalStatus: "PENDING",
      },
    }),
    prisma.doctor.count({
      where: {
        approvalStatus: "APPROVED",
      },
    }),
    prisma.doctor.count({
      where: {
        approvalStatus: "REJECTED",
      },
    }),
  ]);

  const totalPages = Math.max(
    Math.ceil(totalFilteredDoctors / DOCTORS_PER_PAGE),
    1
  );

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Gestão de médicos"
          description="Aprove, reprove, busque, acompanhe e configure a comissão dos profissionais cadastrados na plataforma."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {successMessage && (
            <div className="mb-8 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-4 text-sm font-bold text-[#08553F] shadow-sm">
              ✅ {successMessage}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />
              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Resultado filtrado
                </p>
                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalFilteredDoctors}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />
              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Página atual
                </p>
                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {currentPage}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />
              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Total de páginas
                </p>
                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalPages}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[#08553F]">
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
                  className="min-h-12 flex-1 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-[#08553F] px-6 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Buscar
                </button>

                {(searchTerm || statusFilter !== "ALL") && (
                  <Link
                    href="/dashboard/admin/medicos"
                    className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                  >
                    Limpar
                  </Link>
                )}
              </form>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-bold text-[#08553F]">
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
          </div>

          <div className="mt-10 grid gap-5">
            {doctors.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum médico encontrado para os critérios informados.
                </p>
              </div>
            )}

            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#08553F]">
                        {doctor.user.name}
                      </h2>

                      <p className="mt-2 text-[#878787]">
                        {doctor.specialty}
                      </p>

                      <div className="mt-5 grid gap-2 text-sm text-[#878787] sm:grid-cols-2">
                        <p>
                          <strong className="text-[#08553F]">CRM:</strong>{" "}
                          {doctor.crm}/{doctor.crmUf}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Consulta:</strong>{" "}
                          {formatCurrency(Number(doctor.price))}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Comissão:</strong>{" "}
                          {Number(doctor.platformFeePercent)}%
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Líquido médico:
                          </strong>{" "}
                          {formatCurrency(
                            Number(doctor.price) -
                              Number(doctor.price) *
                                (Number(doctor.platformFeePercent) / 100)
                          )}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Telemedicina:
                          </strong>{" "}
                          {doctor.telemedicine ? "Sim" : "Não"}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">E-mail:</strong>{" "}
                          {doctor.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      {getStatusBadge(doctor.approvalStatus)}

                      <form
                        action={updateDoctorPlatformFee}
                        className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-4 lg:w-72"
                      >
                        <input
                          type="hidden"
                          name="doctorId"
                          value={doctor.id}
                        />

                        <label className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                          Comissão da plataforma (%)
                        </label>

                        <div className="mt-3 flex gap-2">
                          <input
                            type="number"
                            name="platformFeePercent"
                            min="0"
                            max="100"
                            step="0.01"
                            defaultValue={Number(doctor.platformFeePercent)}
                            className="min-h-11 w-full rounded-xl border border-[#C6C6C6]/70 bg-white px-3 text-sm font-bold text-[#08553F] outline-none focus:border-[#00CF7B]"
                          />

                          <SubmitButton
                            loadingText="Salvando..."
                            className="rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Salvar
                          </SubmitButton>
                        </div>
                      </form>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link
                          href={`/dashboard/admin/medicos/${doctor.id}`}
                          className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-200"
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
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                          >
                            Excluir médico
                          </ConfirmSubmitButton>
                        </form>
                      </div>

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
                              className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-70"
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
                              className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-70"
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
                              className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Voltar para pendente
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-[2rem] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-[#878787]">
              Exibindo {doctors.length} de {totalFilteredDoctors} médicos.
              Página {currentPage} de {totalPages}.
            </p>

            <div className="flex gap-3">
              {hasPreviousPage ? (
                <Link
                  href={getPaginationHref(
                    currentPage - 1,
                    statusFilter,
                    searchTerm
                  )}
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Página anterior
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-2xl border border-[#C6C6C6]/60 px-5 py-3 text-sm font-bold text-[#878787]/60">
                  Página anterior
                </span>
              )}

              {hasNextPage ? (
                <Link
                  href={getPaginationHref(
                    currentPage + 1,
                    statusFilter,
                    searchTerm
                  )}
                  className="rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Próxima página
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-2xl bg-[#F7F4E7] px-5 py-3 text-sm font-bold text-[#878787]/60">
                  Próxima página
                </span>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}