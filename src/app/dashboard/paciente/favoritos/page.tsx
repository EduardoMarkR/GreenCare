import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { prisma } from "@/lib/prisma";
import { removeFavoriteDoctor } from "./actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function FavoritosPacientePage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId,
    },
    include: {
      favoriteDoctors: {
        include: {
          doctor: {
            include: {
              user: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Favoritos"
          title="Médicos favoritos"
          description="Acesse rapidamente os profissionais que você salvou para acompanhar, consultar ou agendar novamente."
          backHref="/dashboard/paciente"
          backLabel="Voltar ao painel"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Sua lista
                </h2>

                <p className="mt-2 text-[#878787]">
                  {patient.favoriteDoctors.length} médico
                  {patient.favoriteDoctors.length === 1 ? "" : "s"} salvo
                  {patient.favoriteDoctors.length === 1 ? "" : "s"}.
                </p>
              </div>

              <Link
                href="/medicos"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Buscar médicos
              </Link>
            </div>
          </div>

          {patient.favoriteDoctors.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Nenhum médico favoritado ainda.
              </p>

              <p className="mt-3 text-[#878787]">
                Ao favoritar médicos na página pública, eles aparecerão aqui
                para acesso rápido.
              </p>

              <Link
                href="/medicos"
                className="mt-6 inline-flex rounded-2xl bg-[#00CF7B] px-6 py-3 font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
              >
                Ver médicos disponíveis
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {patient.favoriteDoctors.map((favorite) => {
                const doctor = favorite.doctor;
                const totalReviews = doctor.reviews.length;

                const averageRating =
                  totalReviews > 0
                    ? doctor.reviews.reduce(
                        (total, review) => total + review.rating,
                        0
                      ) / totalReviews
                    : 0;

                return (
                  <article
                    key={favorite.id}
                    className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#00CF7B]">
                            Médico favorito
                          </p>

                          <h2 className="mt-2 text-2xl font-extrabold text-[#08553F]">
                            {doctor.user.name}
                          </h2>

                          <p className="mt-1 font-semibold text-[#878787]">
                            {doctor.specialty}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-50 px-3 py-2 text-lg text-red-600">
                          ♥
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl bg-[#F7F4E7] p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                            CRM
                          </p>

                          <p className="mt-1 font-extrabold text-[#08553F]">
                            {doctor.crm}/{doctor.crmUf}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F7F4E7] p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                            Consulta
                          </p>

                          <p className="mt-1 font-extrabold text-[#08553F]">
                            {formatCurrency(Number(doctor.price))}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#F7F4E7] p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                            Avaliação
                          </p>

                          {totalReviews > 0 ? (
                            <>
                              <p className="mt-1 font-extrabold text-[#08553F]">
                                ⭐ {averageRating.toFixed(1)} · {totalReviews}{" "}
                                avaliação{totalReviews === 1 ? "" : "es"}
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#F5B301]">
                                {renderStars(Math.round(averageRating))}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 font-semibold text-[#878787]">
                              Ainda sem avaliações
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-[#F7F4E7] p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                            Atendimento
                          </p>

                          <p className="mt-1 font-extrabold text-[#08553F]">
                            {doctor.telemedicine
                              ? "Telemedicina"
                              : "Presencial"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-3">
                        <Link
                          href={`/medicos/${doctor.id}`}
                          className="rounded-2xl bg-[#08553F] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                        >
                          Ver perfil
                        </Link>

                        <Link
                          href={`/medicos/${doctor.id}#agenda`}
                          className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                        >
                          Agendar consulta
                        </Link>

                        <form action={removeFavoriteDoctor}>
                          <input
                            type="hidden"
                            name="favoriteId"
                            value={favorite.id}
                          />

                          <ConfirmSubmitButton
                            message="Remover este médico dos favoritos?"
                            loadingText="Removendo..."
                            className="w-full rounded-2xl bg-red-100 px-5 py-3 text-center text-sm font-bold text-red-700 transition hover:bg-red-200"
                          >
                            Remover dos favoritos
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}