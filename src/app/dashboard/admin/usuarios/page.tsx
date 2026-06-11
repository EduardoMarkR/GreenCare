import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { updateUserRole } from "./actions";

type AdminUsuariosPageProps = {
  searchParams?: Promise<{
    busca?: string;
    pagina?: string;
  }>;
};

const USERS_PER_PAGE = 10;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getRoleLabel(role: string) {
  if (role === "ADMIN") return "Administrador";
  if (role === "DOCTOR") return "Médico";
  if (role === "PATIENT") return "Paciente";

  return role;
}

function getRoleClass(role: string) {
  if (role === "ADMIN") return "bg-purple-100 text-purple-800";
  if (role === "DOCTOR") return "bg-[#00CF7B]/15 text-[#08553F]";
  if (role === "PATIENT") return "bg-blue-100 text-blue-700";

  return "bg-gray-100 text-gray-800";
}

function getPaginationHref(page: number, searchTerm: string) {
  const params = new URLSearchParams();

  if (searchTerm) {
    params.set("busca", searchTerm);
  }

  params.set("pagina", String(page));

  return `/dashboard/admin/usuarios?${params.toString()}`;
}

export default async function AdminUsuariosPage({
  searchParams,
}: AdminUsuariosPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const searchTerm = params?.busca?.trim() ?? "";
  const currentPage = Math.max(Number(params?.pagina ?? "1"), 1);
  const skip = (currentPage - 1) * USERS_PER_PAGE;

  const where = searchTerm
    ? {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const [
    users,
    filteredUsers,
    totalUsers,
    totalAdmins,
    totalDoctors,
    totalPatients,
  ] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: USERS_PER_PAGE,
    }),
    prisma.user.count({
      where,
    }),
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: "ADMIN",
      },
    }),
    prisma.user.count({
      where: {
        role: "DOCTOR",
      },
    }),
    prisma.user.count({
      where: {
        role: "PATIENT",
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(filteredUsers / USERS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalPages;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Gestão de usuários"
          description="Visualize usuários cadastrados e gerencie permissões administrativas da plataforma."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 rounded-[2rem] border border-[#F3EFA1] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold leading-6 text-[#08553F]">
              Perfis médicos devem ser criados somente pelo fluxo de candidatura
              médica e aprovação administrativa. Evite transformar usuários em
              médicos diretamente por aqui.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total de usuários", totalUsers, "from-[#08553F] to-[#00CF7B]"],
              ["Administradores", totalAdmins, "from-purple-400 to-purple-700"],
              ["Médicos", totalDoctors, "from-[#F3EFA1] to-[#00CF7B]"],
              ["Pacientes", totalPatients, "from-blue-400 to-blue-600"],
            ].map(([label, value, gradient]) => (
              <div
                key={String(label)}
                className="overflow-hidden rounded-[2rem] bg-white shadow-sm"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                <div className="p-5">
                  <p className="text-sm font-bold text-[#878787]">{label}</p>

                  <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold text-[#08553F]">
                  Buscar usuário
                </p>

                <p className="mt-1 text-sm text-[#878787]">
                  Busque por nome ou e-mail.
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
              action="/dashboard/admin/usuarios"
              className="mt-5 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por nome ou e-mail"
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
                  href="/dashboard/admin/usuarios"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#08553F]">
                  Usuários cadastrados
                </h2>

                <p className="mt-1 text-sm text-[#878787]">
                  Exibindo {users.length} de {filteredUsers} usuário(s)
                  encontrados. Página {safeCurrentPage} de {totalPages}.
                </p>
              </div>

              <p className="w-fit rounded-full bg-[#F7F4E7] px-4 py-2 text-sm font-bold text-[#08553F]">
                {USERS_PER_PAGE} por página
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {users.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum usuário encontrado para os critérios informados.
                </p>
              </div>
            )}

            {users.map((user) => (
              <article
                key={user.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#08553F]">
                        {user.name}
                      </h2>

                      <div className="mt-5 grid gap-2 text-sm text-[#878787] sm:grid-cols-2">
                        <p>
                          <strong className="text-[#08553F]">E-mail:</strong>{" "}
                          {user.email}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Cadastrado em:
                          </strong>{" "}
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <span
                        className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${getRoleClass(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {user.role !== "ADMIN" && (
                          <form action={updateUserRole}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input type="hidden" name="role" value="ADMIN" />

                            <button
                              type="submit"
                              className="rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800 transition hover:bg-purple-200"
                            >
                              Tornar admin
                            </button>
                          </form>
                        )}

                        {user.role !== "PATIENT" && user.id !== userId && (
                          <form action={updateUserRole}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input type="hidden" name="role" value="PATIENT" />

                            <button
                              type="submit"
                              className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-200"
                            >
                              Tornar paciente
                            </button>
                          </form>
                        )}
                      </div>

                      {user.id === userId && (
                        <p className="max-w-xs text-right text-xs font-semibold text-[#878787]">
                          Você está logado com este usuário.
                        </p>
                      )}

                      {user.role === "PATIENT" && (
                        <p className="max-w-xs text-right text-xs font-semibold text-[#878787]">
                          Para se tornar médico, este usuário deve solicitar
                          cadastro pelo painel do paciente.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-[2rem] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-[#878787]">
              Página {safeCurrentPage} de {totalPages}. Total filtrado:{" "}
              <strong className="text-[#08553F]">{filteredUsers}</strong>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {hasPreviousPage ? (
                <Link
                  href={getPaginationHref(safeCurrentPage - 1, searchTerm)}
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Página anterior
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-5 py-3 text-center text-sm font-bold text-[#878787]">
                  Página anterior
                </span>
              )}

              {hasNextPage ? (
                <Link
                  href={getPaginationHref(safeCurrentPage + 1, searchTerm)}
                  className="rounded-2xl bg-[#08553F] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Próxima página
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-2xl bg-[#F7F4E7] px-5 py-3 text-center text-sm font-bold text-[#878787]">
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