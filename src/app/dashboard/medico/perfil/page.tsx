import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { updateDoctorProfile } from "./actions";

type PerfilMedicoPageProps = {
  searchParams?: Promise<{
    success?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function PerfilMedicoPage({
  searchParams,
}: PerfilMedicoPageProps) {
  const params = await searchParams;
  const success = params?.success;

  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
      reviews: {
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          appointment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const totalReviews = doctor.reviews.length;

  const averageRating =
    totalReviews > 0
      ? doctor.reviews.reduce((total, review) => total + review.rating, 0) /
        totalReviews
      : 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Perfil profissional"
          title="Perfil médico"
          description="Atualize seus dados profissionais exibidos para pacientes, incluindo CRM, especialidade, bio e valor da consulta."
          backHref="/dashboard/medico"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <h2 className="text-3xl font-extrabold text-[#08553F]">
                  Dados profissionais
                </h2>

                <p className="mt-2 text-[#878787]">
                  Essas informações ajudam pacientes a entenderem sua atuação,
                  especialidade e modelo de atendimento.
                </p>

                {success === "perfil-atualizado" ? (
                  <div className="mt-6 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-4 text-sm font-bold text-[#08553F]">
                    Perfil atualizado com sucesso.
                  </div>
                ) : null}

                <form action={updateDoctorProfile} className="mt-8 space-y-6">
                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Nome
                    </label>

                    <input
                      type="text"
                      name="name"
                      defaultValue={doctor.user.name}
                      required
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        CRM
                      </label>

                      <input
                        type="text"
                        name="crm"
                        defaultValue={doctor.crm}
                        required
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block font-bold text-[#08553F]">
                        UF do CRM
                      </label>

                      <input
                        type="text"
                        name="crmUf"
                        defaultValue={doctor.crmUf}
                        required
                        maxLength={2}
                        className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 uppercase text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Especialidade
                    </label>

                    <input
                      type="text"
                      name="specialty"
                      defaultValue={doctor.specialty}
                      required
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Bio
                    </label>

                    <textarea
                      name="bio"
                      defaultValue={doctor.bio ?? ""}
                      rows={5}
                      placeholder="Conte um pouco sobre sua formação, experiência e forma de atendimento."
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Valor da consulta
                    </label>

                    <input
                      type="number"
                      name="price"
                      defaultValue={Number(doctor.price)}
                      required
                      min={0}
                      step="0.01"
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition focus:border-[#00CF7B] focus:bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] p-4 text-sm font-bold text-[#08553F]">
                    <input
                      type="checkbox"
                      name="telemedicine"
                      defaultChecked={doctor.telemedicine}
                      className="h-5 w-5 accent-[#08553F]"
                    />

                    Atendimento por telemedicina
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#08553F] px-5 py-3 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Salvar alterações
                  </button>
                </form>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                  🩺
                </div>

                <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                  Perfil público
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#878787]">
                  Seu perfil profissional é a principal vitrine para pacientes.
                  Mantenha especialidade, bio e valor sempre atualizados.
                </p>

                <div className="mt-6 rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-bold text-[#08553F]">
                    Status de atendimento
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#878787]">
                    {doctor.telemedicine
                      ? "Você informou que atende por telemedicina."
                      : "Você ainda não marcou atendimento por telemedicina."}
                  </p>
                </div>

                <Link
                  href="/medico/horarios"
                  className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#00CF7B] px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Minha agenda
                </Link>

                <Link
                  href="/selecionar-perfil"
                  className="mt-3 inline-flex w-full justify-center rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Alternar perfil
                </Link>
              </div>

              <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-[#878787]">
                  Avaliações dos pacientes
                </p>

                <div className="mt-4 rounded-3xl bg-[#F7F4E7] p-5">
                  {totalReviews > 0 ? (
                    <>
                      <p className="text-4xl font-extrabold text-[#08553F]">
                        {averageRating.toFixed(1)}
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#F5B301]">
                        {renderStars(Math.round(averageRating))}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-[#878787]">
                        Baseado em {totalReviews} avaliação
                        {totalReviews === 1 ? "" : "es"}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-extrabold text-[#08553F]">
                        Sem avaliações ainda
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#878787]">
                        Quando pacientes avaliarem consultas concluídas, as
                        avaliações aparecerão aqui.
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {doctor.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-4"
                    >
                      <p className="text-sm font-bold text-[#F5B301]">
                        {renderStars(review.rating)}
                      </p>

                      {review.comment ? (
                        <p className="mt-2 text-sm leading-6 text-[#08553F]">
                          “{review.comment}”
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-[#878787]">
                          Avaliação sem comentário.
                        </p>
                      )}

                      <p className="mt-3 text-xs font-semibold text-[#878787]">
                        {review.patient.user.name} •{" "}
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

