import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Logs de Auditoria
              </h1>

              <p className="mt-3 text-gray-600">
                Acompanhe as principais ações administrativas realizadas na
                plataforma.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total de logs</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalLogs}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Página atual</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {currentPage}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total de páginas</p>
              <p className="mt-2 text-3xl font-bold text-slate-700">
                {totalPages}
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="py-3 pr-4 font-semibold">Data</th>
                    <th className="py-3 pr-4 font-semibold">Admin</th>
                    <th className="py-3 pr-4 font-semibold">Ação</th>
                    <th className="py-3 pr-4 font-semibold">Entidade</th>
                    <th className="py-3 pr-4 font-semibold">Detalhes</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-gray-500"
                      >
                        Nenhum log encontrado.
                      </td>
                    </tr>
                  )}

                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 text-sm"
                    >
                      <td className="py-4 pr-4 text-gray-700">
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td className="py-4 pr-4 text-gray-700">
                        {log.user ? (
                          <div>
                            <p className="font-semibold text-gray-900">
                              {log.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.user.email}
                            </p>
                          </div>
                        ) : (
                          "Usuário removido"
                        )}
                      </td>

                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 pr-4 text-gray-700">
                        {log.entity}
                      </td>

                      <td className="max-w-xl py-4 pr-4 text-gray-600">
                        {log.details || "Sem detalhes."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-500">
                Exibindo {logs.length} de {totalLogs} registros. Página{" "}
                {currentPage} de {totalPages}.
              </p>

              <div className="flex gap-3">
                {hasPreviousPage ? (
                  <Link
                    href={`/dashboard/admin/logs?pagina=${currentPage - 1}`}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Página anterior
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-400">
                    Página anterior
                  </span>
                )}

                {hasNextPage ? (
                  <Link
                    href={`/dashboard/admin/logs?pagina=${currentPage + 1}`}
                    className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Próxima página
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-400">
                    Próxima página
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}