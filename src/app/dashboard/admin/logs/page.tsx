import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default async function AdminLogsPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
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

            <p className="mt-4 text-xs text-gray-500">
              Exibindo os 100 registros mais recentes.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}