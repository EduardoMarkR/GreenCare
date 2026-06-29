import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import PaymentSummary from "@/components/payment/PaymentSummary";
import PaymentTimeline from "@/components/payment/PaymentTimeline";
import PaymentSecurity from "@/components/payment/PaymentSecurity";
import PixCard from "@/components/payment/PixCard";
import CardForm from "@/components/payment/CardForm";
import { prisma } from "@/lib/prisma";
import PaymentStatusWatcher from "./PaymentStatusWatcher";

type PaymentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPaymentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "PAID") return "Pago";
  if (status === "FAILED") return "Falhou";
  if (status === "REFUNDED") return "Reembolsado";
  if (status === "CANCELLED") return "Cancelado";

  return status;
}

function getMethodLabel(method?: string | null) {
  if (method === "PIX") return "PIX";
  if (method === "CREDIT_CARD") return "Cartão de crédito";
  if (method === "DEBIT_CARD") return "Cartão de débito";
  if (method === "BOLETO") return "Boleto";
  if (method === "BANK_TRANSFER") return "Transferência bancária";
  if (method === "MANUAL") return "Manual";

  return "Não informado";
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Aguardando pagamento";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

export default async function PatientPaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const { id } = await params;
  const query = await searchParams;

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
  });

  if (!patient) {
    redirect("/login");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      patientId: patient.id,
    },
    include: {
      appointment: {
        include: {
          availability: true,
          doctor: {
            include: {
              user: true,
            },
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

  if (!payment) {
    notFound();
  }

  const isPaid = payment.status === "PAID";
  const isPix = payment.method === "PIX";
  const isCreditCard = payment.method === "CREDIT_CARD";
  const totalAmount = Number(payment.amount);

  const appointmentTime = payment.appointment.availability
    ? `${payment.appointment.availability.startTime} às ${payment.appointment.availability.endTime}`
    : "Não informado";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Checkout seguro"
          title={
            isPaid
              ? "Pagamento confirmado"
              : "Finalize o pagamento da sua consulta"
          }
          description={
            isPaid
              ? "Sua consulta foi confirmada e a teleconsulta já está disponível ou em processo de criação."
              : "Após a confirmação do pagamento, sua consulta será confirmada automaticamente."
          }
          backHref="/dashboard/paciente/pagamentos"
          backLabel="Voltar aos pagamentos"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {query?.erro ? (
            <div className="mb-8 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700 shadow-sm">
              {query.erro}
            </div>
          ) : null}

          <PaymentTimeline
            isPaid={isPaid}
            hasMeetingUrl={Boolean(payment.appointment.meetingUrl)}
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
            <div className="space-y-8">
              <PaymentSummary
                doctorName={payment.doctor.user.name}
                specialty={payment.doctor.specialty}
                date={formatDate(payment.appointment.date)}
                time={appointmentTime}
                methodLabel={getMethodLabel(payment.method)}
                amount={formatCurrency(totalAmount)}
                paymentStatusLabel={getPaymentStatusLabel(payment.status)}
                appointmentStatusLabel={getAppointmentStatusLabel(
                  payment.appointment.status
                )}
              />

              <PaymentStatusWatcher
                paymentId={payment.id}
                initialPaymentStatus={payment.status}
                initialAppointmentStatus={payment.appointment.status}
                initialMeetingUrl={payment.appointment.meetingUrl}
                paymentCreatedAt={payment.createdAt.toISOString()}
              />

              <PaymentSecurity />
            </div>

            <aside className="space-y-8">
              <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                  Total da consulta
                </p>

                <p className="mt-4 text-4xl font-extrabold text-[#08553F]">
                  {formatCurrency(totalAmount)}
                </p>

                <div className="mt-6 space-y-3 rounded-3xl bg-[#F7F4E7] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[#878787]">
                      Método
                    </span>

                    <span className="font-extrabold text-[#08553F]">
                      {getMethodLabel(payment.method)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[#878787]">
                      Status
                    </span>

                    <span className="font-extrabold text-[#08553F]">
                      {getPaymentStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
              </div>

              {isPaid ? (
                <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                    Pagamento confirmado
                  </p>

                  <div className="mt-8 rounded-3xl bg-[#00CF7B]/10 p-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#00CF7B] text-4xl font-extrabold text-white">
                      ✓
                    </div>

                    <h3 className="mt-5 text-2xl font-extrabold text-[#08553F]">
                      Tudo certo!
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#878787]">
                      Seu pagamento foi confirmado e a consulta já está
                      liberada.
                    </p>
                  </div>

                  {payment.appointment.meetingUrl ? (
                    <a
                      href={payment.appointment.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 block rounded-2xl bg-[#08553F] px-6 py-4 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                    >
                      Entrar na teleconsulta
                    </a>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5 text-sm font-semibold text-[#08553F]">
                      Estamos finalizando a criação da sala de teleconsulta.
                    </div>
                  )}

                  <Link
                    href="/dashboard/paciente"
                    className="mt-4 block rounded-2xl border border-[#08553F]/30 bg-[#F7F4E7] px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                  >
                    Ver minhas consultas
                  </Link>

                  <Link
                    href="/dashboard/paciente/pagamentos"
                    className="mt-4 block rounded-2xl border border-[#08553F]/30 px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                  >
                    Voltar aos pagamentos
                  </Link>
                </div>
              ) : null}

              {!isPaid && isPix ? (
                <PixCard
                  qrCode={payment.pixQrCode}
                  copyPaste={payment.pixCopyPaste}
                />
              ) : null}

              {!isPaid && isCreditCard ? (
                <CardForm paymentId={payment.id} amount={totalAmount} />
              ) : null}

              {!isPaid && payment.invoiceUrl ? (
                <a
                  href={payment.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-[#08553F] px-6 py-4 text-center font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                >
                  Abrir link de pagamento
                </a>
              ) : null}

              {!isPaid && payment.boletoUrl ? (
                <a
                  href={payment.boletoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[#08553F]/30 bg-white px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Abrir boleto
                </a>
              ) : null}

              {!isPaid &&
              !payment.invoiceUrl &&
              !payment.pixQrCode &&
              !payment.pixCopyPaste &&
              !payment.boletoUrl ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
                  A cobrança ainda não foi gerada. Tente atualizar a página em
                  alguns instantes.
                </div>
              ) : null}

              {!isPaid ? (
                <Link
                  href="/dashboard/paciente/pagamentos"
                  className="block rounded-2xl border border-[#08553F]/30 bg-white px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                >
                  Voltar aos pagamentos
                </Link>
              ) : null}
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}