import Link from "next/link";
import { notFound } from "next/navigation";
import { createAppointment } from "./actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    availabilityId: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AgendarPage({ params, searchParams }: Props) {
  const { availabilityId } = await params;
  const query = await searchParams;
  const erro = query?.erro;

  const availability = await prisma.availability.findUnique({
    where: {
      id: availabilityId,
    },
    include: {
      appointments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!availability) {
    notFound();
  }

  const isAlreadyBooked = availability.appointments.length > 0;
  const isDoctorApproved = availability.doctor.approvalStatus === "APPROVED";
  const canBook = !isAlreadyBooked && isDoctorApproved;

  const consultationPrice = Number(availability.doctor.price);
  const platformFee = 0;
  const totalAmount = consultationPrice + platformFee;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Agendamento online"
          title="Confirmar consulta"
          description="Revise os dados do atendimento, escolha a forma de pagamento e informe brevemente o motivo da consulta."
          backHref={`/medicos/${availability.doctor.id}`}
          backLabel="Voltar para o médico"
        />

        <section className="mx-auto max-w-6xl px-6 py-12">
          {erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Não foi possível agendar
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">{erro}</p>
            </div>
          ) : null}

          {!isDoctorApproved ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-red-700">
                Médico indisponível
              </p>

              <p className="mt-3 text-sm leading-6 text-red-700">
                Este profissional ainda não está aprovado para receber
                agendamentos.
              </p>
            </div>
          ) : null}

          {isAlreadyBooked ? (
            <div className="mb-8 rounded-[2rem] border border-[#F3EFA1] bg-[#F3EFA1]/40 p-6 shadow-sm">
              <p className="text-xl font-extrabold text-[#08553F]">
                Horário indisponível
              </p>

              <p className="mt-3 text-sm leading-6 text-[#08553F]">
                Este horário já foi reservado. Escolha outro horário disponível
                no perfil do médico.
              </p>

              <Link
                href={`/medicos/${availability.doctor.id}`}
                className="mt-5 inline-flex rounded-2xl bg-[#08553F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Ver outros horários
              </Link>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-[#C6C6C6]/60">
              <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

              <div className="p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-[#08553F]">
                      Finalizar agendamento
                    </h2>

                    <p className="mt-2 max-w-2xl text-[#878787]">
                      Escolha como deseja pagar e conte o motivo principal da
                      consulta para ajudar o médico a se preparar.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-extrabold text-[#08553F]">
                    Pagamento seguro
                  </span>
                </div>

                <form action={createAppointment} className="mt-8 space-y-8">
                  <input
                    type="hidden"
                    name="availabilityId"
                    value={availability.id}
                  />

                  <div>
                    <div className="mb-4">
                      <p className="text-lg font-extrabold text-[#08553F]">
                        Forma de pagamento
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#878787]">
                        Na próxima etapa, o pagamento será processado com
                        segurança pela Asaas.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="group relative cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="PIX"
                          defaultChecked
                          disabled={!canBook}
                          className="peer sr-only"
                        />

                        <div className="h-full rounded-[1.5rem] border-2 border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 transition peer-checked:border-[#00CF7B] peer-checked:bg-[#00CF7B]/10 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 group-hover:border-[#00CF7B]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08553F] text-2xl text-white">
                              ◇
                            </div>

                            <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#08553F] shadow-sm">
                              Recomendado
                            </div>
                          </div>

                          <p className="mt-5 text-xl font-extrabold text-[#08553F]">
                            PIX
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#878787]">
                            Confirmação rápida após o pagamento. Ideal para
                            liberar o agendamento com mais agilidade.
                          </p>

                          <div className="mt-5 rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#878787]">
                              Total no PIX
                            </p>

                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {formatCurrency(totalAmount)}
                            </p>
                          </div>
                        </div>
                      </label>

                      <label className="group relative cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CREDIT_CARD"
                          disabled={!canBook}
                          className="peer sr-only"
                        />

                        <div className="h-full rounded-[1.5rem] border-2 border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 transition peer-checked:border-[#00CF7B] peer-checked:bg-[#00CF7B]/10 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 group-hover:border-[#00CF7B]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08553F] text-2xl text-white">
                              ▣
                            </div>

                            <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#08553F] shadow-sm">
                              Cartão
                            </div>
                          </div>

                          <p className="mt-5 text-xl font-extrabold text-[#08553F]">
                            Cartão de crédito
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#878787]">
                            Pague com cartão de crédito. O parcelamento será
                            configurado na etapa de checkout.
                          </p>

                          <div className="mt-5 rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#878787]">
                              Total no cartão
                            </p>

                            <p className="mt-1 text-2xl font-extrabold text-[#08553F]">
                              {formatCurrency(totalAmount)}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-bold text-[#08553F]">
                      Motivo da consulta
                    </label>

                    <textarea
                      name="notes"
                      placeholder="Conte brevemente o motivo da consulta"
                      rows={5}
                      disabled={!canBook}
                      className="w-full rounded-2xl border border-[#C6C6C6]/70 bg-[#F7F4E7] px-4 py-3 text-[#08553F] outline-none transition placeholder:text-[#08553F]/45 focus:border-[#00CF7B] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-bold text-[#08553F]">
                        Valor da consulta
                      </p>

                      <p className="font-extrabold text-[#08553F]">
                        {formatCurrency(consultationPrice)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p className="font-bold text-[#08553F]">
                        Taxa da plataforma
                      </p>

                      <p className="font-extrabold text-[#08553F]">
                        {formatCurrency(platformFee)}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-[#C6C6C6]/60 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-extrabold text-[#08553F]">
                          Total
                        </p>

                        <p className="text-2xl font-extrabold text-[#08553F]">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canBook}
                    className="w-full rounded-2xl bg-[#08553F] px-6 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:bg-[#878787] disabled:text-white"
                  >
                    {canBook
                      ? "Confirmar e ir para pagamento"
                      : "Agendamento indisponível"}
                  </button>

                  <p className="text-center text-xs leading-5 text-[#878787]">
                    Ao continuar, o horário será reservado conforme as regras de
                    pagamento da plataforma.
                  </p>
                </form>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[2rem] bg-[#08553F] p-7 text-white shadow-sm">
              <div className="absolute -bottom-10 -right-10 text-[9rem] leading-none opacity-10">
                🌿
              </div>

              <div className="relative">
                <span className="inline-flex rounded-full bg-[#00CF7B]/20 px-4 py-2 text-sm font-bold text-[#00CF7B]">
                  Consulta selecionada
                </span>

                <h3 className="mt-6 text-2xl font-extrabold">
                  {availability.doctor.user.name}
                </h3>

                <p className="mt-2 font-bold text-[#00CF7B]">
                  {availability.doctor.specialty}
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">Data</p>

                    <p className="mt-1 text-xl font-extrabold">
                      {formatDate(availability.date)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Horário
                    </p>

                    <p className="mt-1 text-xl font-extrabold">
                      {availability.startTime} às {availability.endTime}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-white/70">
                      Médico
                    </p>

                    <p className="mt-1 text-lg font-extrabold">
                      CRM {availability.doctor.crm}/{availability.doctor.crmUf}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-5 text-[#08553F]">
                    <p className="text-sm font-semibold text-[#878787]">
                      Total da consulta
                    </p>

                    <p className="mt-1 text-3xl font-extrabold">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/medicos/${availability.doctor.id}`}
                  className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Ver perfil do médico
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}