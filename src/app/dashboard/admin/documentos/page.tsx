import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

type AdminDocumentosPageProps = {
  searchParams?: Promise<{
    busca?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminDocumentosPage({
  searchParams,
}: AdminDocumentosPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const searchTerm = params?.busca?.trim() ?? "";

  const documents = await prisma.document.findMany({
    where: searchTerm
      ? {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              fileType: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              patient: {
                user: {
                  name: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              patient: {
                user: {
                  email: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : undefined,
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDocuments = await prisma.document.count();

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
                Gestão de Documentos
              </h1>

              <p className="mt-3 text-gray-600">
                Visualize todos os documentos enviados pelos pacientes.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          <div className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Buscar documento
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Total de documentos enviados: {totalDocuments}
                </p>
              </div>

              {searchTerm && (
                <p className="text-sm text-gray-500">
                  Resultado para:{" "}
                  <span className="font-semibold text-gray-800">
                    {searchTerm}
                  </span>
                </p>
              )}
            </div>

            <form
              action="/dashboard/admin/documentos"
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por documento, tipo, paciente ou e-mail"
                className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Buscar
              </button>

              {searchTerm && (
                <Link
                  href="/dashboard/admin/documentos"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-10 grid gap-4">
            {documents.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Nenhum documento encontrado para os critérios informados.
                </p>
              </div>
            )}

            {documents.map((document) => (
              <article
                key={document.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      📎 {document.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      Paciente: {document.patient.user.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      E-mail: {document.patient.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Tipo: {document.fileType || "Não informado"}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Enviado em: {formatDate(document.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                    >
                      Abrir documento
                    </a>

                    <Link
                      href={`/dashboard/admin/pacientes/${document.patient.id}`}
                      className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Ver paciente
                    </Link>
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