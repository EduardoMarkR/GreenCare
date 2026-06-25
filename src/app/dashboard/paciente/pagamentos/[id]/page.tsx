import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
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

function getPaymentStatusClass(status: string) {
  if (status === "PAID") {
    return "bg-[#00CF7B]/15 text-[#08553F] ring-[#00CF7B]/30";
  }

  if (status === "PENDING") {
    return "bg-[#F3EFA1]/70 text-[#08553F] ring-[#F3EFA1]";
  }

  if (status === "CANCELLED" || status === "FAILED") {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  return "bg-[#F7F4E7] text-[#878787] ring-[#C6C6C6]";
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

  return (
    <>
      <Navbar />

      <main className="bg-[#F7F4E7]">
        <CannaPageHero
          badge="Pagamento"
          title="Finalize o pagamento da sua consulta"
          description="Após a confirmação do pagamento, sua consulta será confirmada automaticamente."
        />

        <section className="mx-auto max-w-5xl px-6 py-16">
          {query?.erro ? (
            <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {query.erro}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#C6C6C6]/50 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                    Consulta
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold text-[#08553F]">
                    {payment.doctor.user.name}
                  </h2>

                  <p className="mt-2 text-[#878787]">
                    {payment.doctor.specialty}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ring-1 ${getPaymentStatusClass(
                    payment.status
                  )}`}
                >
                  {getPaymentStatusLabel(payment.status)}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-bold text-[#878787]">Data</p>
                  <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                    {formatDate(payment.appointment.date)}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-bold text-[#878787]">Horário</p>
                  <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                    {payment.appointment.availability?.startTime ??
                      "Não informado"}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-bold text-[#878787]">Método</p>
                  <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                    {getMethodLabel(payment.method)}
                  </p>
                </div>

                <div className="rounded-3xl bg-[#F7F4E7] p-5">
                  <p className="text-sm font-bold text-[#878787]">Valor</p>
                  <p className="mt-2 text-lg font-extrabold text-[#08553F]">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                  Status da consulta
                </p>

                <p className="mt-3 text-lg font-extrabold text-[#08553F]">
                  {getAppointmentStatusLabel(payment.appointment.status)}
                </p>

                <p className="mt-2 text-sm leading-6 text-[#878787]">
                  Assim que o pagamento for confirmado pelo gateway, a consulta
                  será confirmada e a sala de teleconsulta será liberada.
                </p>
              </div>

              <PaymentStatusWatcher
                paymentId={payment.id}
                initialPaymentStatus={payment.status}
                initialAppointmentStatus={payment.appointment.status}
                initialMeetingUrl={payment.appointment.meetingUrl}
              />
            </div>

            <aside className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                Pagamento online
              </p>

              <h3 className="mt-3 text-2xl font-extrabold text-[#08553F]">
                Pague com segurança
              </h3>

              {payment.pixQrCode ? (
                <div className="mt-8 rounded-3xl bg-[#F7F4E7] p-5 text-center">
                  <Image
                    src={`data:image/png;base64,${payment.pixQrCode}`}
                    alt="QR Code PIX"
                    width={224}
                    height={224}
                    unoptimized
                    className="mx-auto h-56 w-56 rounded-2xl bg-white p-3"
                  />

                  <p className="mt-4 text-sm font-semibold text-[#878787]">
                    Escaneie o QR Code com o app do seu banco.
                  </p>
                </div>
              ) : null}

              {payment.pixCopyPaste ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-bold text-[#08553F]">
                    PIX copia e cola
                  </p>

                  <textarea
                    readOnly
                    value={payment.pixCopyPaste}
                    className="h-32 w-full resize-none rounded-3xl border border-[#C6C6C6]/70 bg-[#F7F4E7] p-4 text-sm text-[#08553F] outline-none"
                  />
                </div>
              ) : null}

              {payment.invoiceUrl ? (
                <a
                  href={payment.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block rounded-2xl bg-[#08553F] px-6 py-4 text-center font-bold text-white transition hover:bg-[#064331]"
                >
                  Abrir link de pagamento
                </a>
              ) : null}

              {payment.boletoUrl ? (
                <a
                  href={payment.boletoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-2xl border border-[#08553F]/30 bg-[#F7F4E7] px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
                >
                  Abrir boleto
                </a>
              ) : null}

              {!payment.invoiceUrl &&
              !payment.pixQrCode &&
              !payment.pixCopyPaste &&
              !payment.boletoUrl ? (
                <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
                  A cobrança ainda não foi gerada. Tente atualizar a página em
                  alguns instantes.
                </div>
              ) : null}

              <Link
                href="/dashboard/paciente/pagamentos"
                className="mt-6 block rounded-2xl border border-[#08553F]/30 px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
              >
                Voltar aos pagamentos
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}