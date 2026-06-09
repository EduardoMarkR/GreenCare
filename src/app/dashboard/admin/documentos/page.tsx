import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import CannaPageHero from "@/components/CannaPageHero";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { deleteDocument } from "./actions";

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

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Gestão de documentos"
          description="Visualize, busque e gerencie documentos enviados pelos pacientes."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-6">
                <p className="text-sm font-bold text-[#878787]">
                  Documentos enviados
                </p>

                <p className="mt-2 text-4xl font-extrabold text-[#08553F]">
                  {totalDocuments}
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
                  {documents.length}
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
                  Buscar documento
                </p>

                <p className="mt-1 text-sm text-[#878787]">
                  Pesquise por nome do documento, tipo, paciente ou e-mail.
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
              action="/dashboard/admin/documentos"
              className="mt-5 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por documento, tipo, paciente ou e-mail"
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
                  href="/dashboard/admin/documentos"
                  className="rounded-2xl border border-[#08553F]/30 bg-white px-6 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-10 grid gap-5">
            {documents.length === 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <p className="font-bold text-[#08553F]">
                  Nenhum documento encontrado para os critérios informados.
                </p>
              </div>
            )}

            {documents.map((document) => (
              <article
                key={document.id}
                className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#08553F]">
                        📎 {document.name}
                      </h2>

                      <div className="mt-5 grid gap-2 text-sm text-[#878787] sm:grid-cols-2">
                        <p>
                          <strong className="text-[#08553F]">Paciente:</strong>{" "}
                          {document.patient.user.name}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">E-mail:</strong>{" "}
                          {document.patient.user.email}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">Tipo:</strong>{" "}
                          {document.fileType || "Não informado"}
                        </p>

                        <p>
                          <strong className="text-[#08553F]">
                            Enviado em:
                          </strong>{" "}
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                      >
                        Abrir documento
                      </a>

                      <Link
                        href={`/dashboard/admin/pacientes/${document.patient.id}`}
                        className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                      >
                        Ver paciente
                      </Link>

                      <form action={deleteDocument}>
                        <input
                          type="hidden"
                          name="documentId"
                          value={document.id}
                        />

                        <ConfirmSubmitButton
                          message="Tem certeza que deseja excluir este documento? Essa ação não pode ser desfeita."
                          className="rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-700"
                        >
                          Excluir documento
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