import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type AdminLogsPageProps = {
  searchParams?: Promise<{
    pagina?: string;
  }>;
};

const LOGS_PER_PAGE = 20;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default async function AdminLogsPage({
  searchParams,
}: AdminLogsPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const currentPage = Math.max(Number(params?.pagina ?? "1"), 1);
  const skip = (currentPage - 1) * LOGS_PER_PAGE;

  const [totalLogs, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: LOGS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalLogs / LOGS_PER_PAGE), 1);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Logs de auditoria"
          description="Acompanhe as principais ações administrativas realizadas na plataforma."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-5">
                <p className="text-sm font-bold text-[#878787]">
                  Total de logs
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalLogs}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

              <div className="p-5">
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

              <div className="p-5">
                <p className="text-sm font-bold text-[#878787]">
                  Total de páginas
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalPages}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Histórico de ações
                </h2>

                <p className="mt-2 text-sm text-[#878787]">
                  Registros administrativos ordenados do mais recente para o
                  mais antigo.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#C6C6C6]/60 text-sm text-[#878787]">
                      <th className="py-3 pr-4 font-bold">Data</th>
                      <th className="py-3 pr-4 font-bold">Admin</th>
                      <th className="py-3 pr-4 font-bold">Ação</th>
                      <th className="py-3 pr-4 font-bold">Entidade</th>
                      <th className="py-3 pr-4 font-bold">Detalhes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center font-bold text-[#08553F]"
                        >
                          Nenhum log encontrado.
                        </td>
                      </tr>
                    )}

                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-[#C6C6C6]/40 text-sm"
                      >
                        <td className="py-4 pr-4 font-semibold text-[#08553F]">
                          {formatDateTime(log.createdAt)}
                        </td>

                        <td className="py-4 pr-4 text-[#878787]">
                          {log.user ? (
                            <div>
                              <p className="font-bold text-[#08553F]">
                                {log.user.name}
                              </p>

                              <p className="text-xs text-[#878787]">
                                {log.user.email}
                              </p>
                            </div>
                          ) : (
                            "Usuário removido"
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          <span className="rounded-full bg-[#00CF7B]/15 px-3 py-1 text-xs font-bold text-[#08553F]">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-4 pr-4 font-semibold text-[#08553F]">
                          {log.entity}
                        </td>

                        <td className="max-w-xl py-4 pr-4 text-[#878787]">
                          {log.details || "Sem detalhes."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#C6C6C6]/50 pt-5 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-[#878787]">
                  Exibindo {logs.length} de {totalLogs} registros. Página{" "}
                  {currentPage} de {totalPages}.
                </p>

                <div className="flex gap-3">
                  {hasPreviousPage ? (
                    <Link
                      href={`/dashboard/admin/logs?pagina=${currentPage - 1}`}
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
                      href={`/dashboard/admin/logs?pagina=${currentPage + 1}`}
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
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}