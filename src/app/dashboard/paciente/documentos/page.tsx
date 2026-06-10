import CannaPageHero from "@/components/CannaPageHero";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { createDocument, deletePatientDocument } from "./actions";

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

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Documentos médicos"
          title="Meus documentos"
          description="Envie exames, laudos, receitas e documentos médicos para manter sua jornada de cuidado organizada em um só lugar."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid items-start gap-8 lg:grid-cols-[420px_1fr]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EFA1] text-2xl">
                  📎
                </div>

                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Enviar documento
                </h2>

                <p className="mt-2 text-[#878787]">
                  Adicione arquivos importantes para futuras consultas médicas.
                </p>

                <form action={createDocument} className="mt-8 space-y-6">
                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Nome do documento
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Ex: Exame de sangue"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Arquivo
                    </label>

                    <input
                      type="file"
                      name="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] file:mr-4 file:rounded-full file:border-0 file:bg-[#08553F] file:px-4 file:py-2 file:font-bold file:text-white"
                    />

                    <p className="mt-3 rounded-2xl bg-[#F7F4E7] p-4 text-sm font-semibold text-[#878787]">
                      Formatos aceitos: PDF, PNG, JPG, JPEG e WEBP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Enviar documento
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Documentos cadastrados
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    Total de arquivos enviados:{" "}
                    <strong className="text-[#08553F]">
                      {patient.documents.length}
                    </strong>
                  </p>
                </div>

                <Link
                  href="/medicos"
                  className="rounded-2xl bg-[#00CF7B] px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Agendar consulta
                </Link>
              </div>

              <div className="mt-8 space-y-4">
                {patient.documents.length === 0 && (
                  <div className="rounded-2xl bg-[#F7F4E7] p-6">
                    <p className="font-bold text-[#08553F]">
                      Nenhum documento cadastrado.
                    </p>

                    <p className="mt-2 text-sm text-[#878787]">
                      Quando você enviar um documento, ele aparecerá aqui.
                    </p>
                  </div>
                )}

                {patient.documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 transition hover:border-[#00CF7B]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-extrabold text-[#08553F]">
                          {document.name}
                        </p>

                        {document.fileType && (
                          <p className="mt-1 text-sm text-[#878787]">
                            Tipo: {document.fileType}
                          </p>
                        )}

                        <p className="mt-1 text-sm font-semibold text-[#08553F]">
                          Enviado em {formatDate(document.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
                        >
                          Abrir documento →
                        </a>

                        <form action={deletePatientDocument}>
                          <input
                            type="hidden"
                            name="documentId"
                            value={document.id}
                          />

                          <ConfirmSubmitButton
                            message="Tem certeza que deseja excluir este documento?"
                            loadingText="Excluindo..."
                            className="inline-flex w-fit rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200"
                          >
                            Excluir
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
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