import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { createDocument } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function DocumentosPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "PATIENT") {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) {
    throw new Error("Paciente não encontrado.");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/dashboard/paciente"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>

            <Link
              href="/medicos"
              className="rounded-xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Agendar Consulta
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-md">
              <h1 className="text-3xl font-bold text-gray-900">
                Enviar Documento
              </h1>

              <p className="mt-2 text-gray-600">
                Envie exames, laudos, receitas ou documentos médicos.
              </p>

              <form action={createDocument} className="mt-8 space-y-6">
                
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Nome do documento
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ex: Exame de sangue"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Arquivo
                  </label>

                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
                  />

                  <p className="mt-2 text-sm text-gray-500">
                    Formatos aceitos: PDF, PNG, JPG, JPEG e WEBP.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Enviar documento
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900">
                Documentos cadastrados
              </h2>

              <div className="mt-6 space-y-4">
                {patient.documents.length === 0 && (
                  <p className="text-gray-600">
                    Nenhum documento cadastrado.
                  </p>
                )}

                {patient.documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {document.name}
                    </p>

                    {document.fileType && (
                      <p className="text-sm text-gray-600">
                        Tipo: {document.fileType}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-gray-600">
                      Enviado em {formatDate(document.createdAt)}
                    </p>

                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block font-semibold text-green-700 hover:text-green-800"
                    >
                      Abrir documento
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}