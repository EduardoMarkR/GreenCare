import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import SubmitButton from "@/components/SubmitButton";
import { prisma } from "@/lib/prisma";
import { recreateGoogleMeet } from "./actions";

type Props = {
  searchParams?: Promise<{
    success?: string;
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

function getSuccessMessage(success?: string) {
  if (success === "meet-recriado") {
    return "Google Meet recriado com sucesso.";
  }

  return null;
}

function getErrorMessage(erro?: string) {
  if (erro === "pagamento-nao-informado") {
    return "Pagamento não informado.";
  }

  if (erro === "pagamento-nao-encontrado") {
    return "Pagamento não encontrado.";
  }

  if (erro === "consulta-nao-encontrada") {
    return "Consulta vinculada ao pagamento não encontrada.";
  }

  if (erro === "meet-ja-existe") {
    return "Esta consulta já possui link do Google Meet.";
  }

  if (erro === "horario-nao-encontrado") {
    return "Horário da consulta não encontrado.";
  }

  if (erro === "google-nao-conectado") {
    return "O médico ainda não conectou o Google Calendar.";
  }

  if (erro === "meet-nao-gerado") {
    return "O Google não retornou um link de Meet para esta consulta.";
  }

  if (erro === "erro-google-meet") {
    return "Não foi possível recriar o Google Meet. Verifique os escopos da integração Google Calendar.";
  }

  return null;
}

export default async function AdminFinanceiroConciliacaoPage({
  searchParams,
}: Props) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "ADMIN") redirect("/");

  const params = await searchParams;
  const successMessage = getSuccessMessage(params?.success);
  const errorMessage = getErrorMessage(params?.erro);

  const [
    paidWithPendingAppointment,
    confirmedWithoutPaidPayment,
    paidWithoutMeet,
    paidWithoutGateway,
    paidWithoutPayout,
    payoutsWithoutPayments,
    paymentsWithValueDivergence,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: "PAID",
        appointment: {
          status: "PENDING",
        },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { payment: null },
          {
            payment: {
              status: {
                not: "PAID",
              },
            },
          },
        ],
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: {
        status: "PAID",
        appointment: {
          meetingUrl: null,
        },
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: {
        status: "PAID",
        gatewayPaymentId: null,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: {
        status: "PAID",
        payoutId: null,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.doctorPayout.findMany({
      where: {
        payments: {
          none: {},
        },
      },
      include: {
        doctor: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.payment.findMany({
      where: {
        status: "PAID",
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const divergentPayments = paymentsWithValueDivergence.filter((payment) => {
    const amount = Number(payment.amount);
    const platformFee = Number(payment.platformFee);
    const doctorAmount = Number(payment.doctorAmount);

    return Math.abs(amount - (platformFee + doctorAmount)) > 0.01;
  });

  const totalIssues =
    paidWithPendingAppointment.length +
    confirmedWithoutPaidPayment.length +
    paidWithoutMeet.length +
    paidWithoutGateway.length +
    paidWithoutPayout.length +
    payoutsWithoutPayments.length +
    divergentPayments.length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Conciliação financeira"
          title="Central de conciliação"
          description="Identifique divergências entre pagamentos, consultas, Google Meet, gateway e repasses médicos."
          backHref="/dashboard/admin/financeiro"
          backLabel="Voltar ao financeiro"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          {successMessage ? (
            <div className="mb-8 rounded-2xl border border-[#00CF7B]/30 bg-[#00CF7B]/10 p-4 text-sm font-bold text-[#08553F] shadow-sm">
              ✅ {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm">
              ⚠️ {errorMessage}
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao financeiro
            </Link>

            <Link
              href="/dashboard/admin/financeiro/extrato"
              className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Ver extrato
            </Link>

            <Link
              href="/dashboard/admin/financeiro/repasses"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Ver repasses
            </Link>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Total de alertas
              </p>
              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {totalIssues}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Sem repasse
              </p>
              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paidWithoutPayout.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">Sem Meet</p>
              <p className="mt-3 text-5xl font-extrabold text-[#08553F]">
                {paidWithoutMeet.length}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Status geral
              </p>
              <p className="mt-3 text-3xl font-extrabold text-white">
                {totalIssues === 0 ? "Conciliado" : "Atenção"}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <IssueSection
              title="Pagamentos pagos com consulta pendente"
              description="Pagamento está PAID, mas a consulta ainda está PENDING."
              count={paidWithPendingAppointment.length}
            >
              {paidWithPendingAppointment.map((payment) => (
                <PaymentIssueCard
                  key={payment.id}
                  paymentId={payment.id}
                  appointmentId={payment.appointmentId}
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Consultas confirmadas sem pagamento pago"
              description="Consulta está CONFIRMED, mas não possui pagamento PAID vinculado."
              count={confirmedWithoutPaidPayment.length}
            >
              {confirmedWithoutPaidPayment.map((appointment) => (
                <AppointmentIssueCard
                  key={appointment.id}
                  appointmentId={appointment.id}
                  paymentId={appointment.payment?.id ?? null}
                  patientName={appointment.patient.user.name}
                  doctorName={appointment.doctor.user.name}
                  date={appointment.date}
                  paymentStatus={appointment.payment?.status ?? "Não existe"}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Pagamentos pagos sem Google Meet"
              description="Pagamento foi confirmado, mas a consulta não recebeu link de teleconsulta."
              count={paidWithoutMeet.length}
            >
              {paidWithoutMeet.map((payment) => (
                <PaymentIssueCard
                  key={payment.id}
                  paymentId={payment.id}
                  appointmentId={payment.appointmentId}
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                  showRecreateMeet
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Pagamentos pagos sem gatewayPaymentId"
              description="Pagamento está PAID, mas não possui ID do gateway salvo."
              count={paidWithoutGateway.length}
            >
              {paidWithoutGateway.map((payment) => (
                <PaymentIssueCard
                  key={payment.id}
                  paymentId={payment.id}
                  appointmentId={payment.appointmentId}
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Pagamentos pagos ainda sem repasse"
              description="Pagamentos PAID que ainda não foram vinculados a um DoctorPayout."
              count={paidWithoutPayout.length}
            >
              {paidWithoutPayout.map((payment) => (
                <PaymentIssueCard
                  key={payment.id}
                  paymentId={payment.id}
                  appointmentId={payment.appointmentId}
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.doctorAmount)}
                  highlightLabel="Valor médico"
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Repasses sem pagamentos vinculados"
              description="DoctorPayout criado, mas sem nenhum Payment vinculado."
              count={payoutsWithoutPayments.length}
            >
              {payoutsWithoutPayments.map((payout) => (
                <PayoutIssueCard
                  key={payout.id}
                  payoutId={payout.id}
                  doctorName={payout.doctor.user.name}
                  amount={Number(payout.amount)}
                  createdAt={payout.createdAt}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Pagamentos com divergência de valores"
              description="Valor bruto não bate com comissão + valor médico."
              count={divergentPayments.length}
            >
              {divergentPayments.map((payment) => (
                <PaymentIssueCard
                  key={payment.id}
                  paymentId={payment.id}
                  appointmentId={payment.appointmentId}
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                />
              ))}
            </IssueSection>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function IssueSection({
  title,
  description,
  count,
  children,
}: Readonly<{
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#08553F]">{title}</h2>
          <p className="mt-2 text-[#878787]">{description}</p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            count === 0
              ? "bg-[#00CF7B]/15 text-[#08553F]"
              : "bg-[#F3EFA1] text-[#08553F]"
          }`}
        >
          {count === 0 ? "OK" : `${count} alerta(s)`}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {count === 0 ? (
          <div className="rounded-2xl bg-[#F7F4E7] p-5">
            <p className="font-bold text-[#08553F]">
              Nenhuma inconsistência encontrada.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function PaymentIssueCard({
  paymentId,
  appointmentId,
  patientName,
  doctorName,
  date,
  amount,
  highlightLabel = "Valor",
  showRecreateMeet = false,
}: Readonly<{
  paymentId: string;
  appointmentId?: string | null;
  patientName: string;
  doctorName: string;
  date: Date;
  amount: number;
  highlightLabel?: string;
  showRecreateMeet?: boolean;
}>) {
  return (
    <div className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
      <p className="font-extrabold text-[#08553F]">{patientName}</p>

      <p className="mt-1 text-sm text-[#878787]">Médico: {doctorName}</p>

      <p className="mt-1 text-sm text-[#878787]">Data: {formatDate(date)}</p>

      <p className="mt-1 text-sm font-bold text-[#08553F]">
        {highlightLabel}: {formatCurrency(amount)}
      </p>

      <p className="mt-2 max-w-full truncate text-xs text-[#878787]">
        Pagamento: {paymentId}
      </p>

      {appointmentId ? (
        <p className="mt-1 max-w-full truncate text-xs text-[#878787]">
          Consulta: {appointmentId}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/admin/financeiro/${paymentId}`}
          className="rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
        >
          Abrir pagamento
        </Link>

        {appointmentId ? (
          <Link
            href={`/dashboard/admin/consultas?appointmentId=${appointmentId}`}
            className="rounded-xl border border-[#08553F]/30 bg-white px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Abrir consulta
          </Link>
        ) : null}

        {showRecreateMeet ? (
          <form action={recreateGoogleMeet}>
            <input type="hidden" name="paymentId" value={paymentId} />

            <SubmitButton
              loadingText="Recriando..."
              className="rounded-xl bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Recriar Meet
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function AppointmentIssueCard({
  appointmentId,
  paymentId,
  patientName,
  doctorName,
  date,
  paymentStatus,
}: Readonly<{
  appointmentId: string;
  paymentId: string | null;
  patientName: string;
  doctorName: string;
  date: Date;
  paymentStatus: string;
}>) {
  return (
    <div className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
      <p className="font-extrabold text-[#08553F]">{patientName}</p>

      <p className="mt-1 text-sm text-[#878787]">Médico: {doctorName}</p>

      <p className="mt-1 text-sm text-[#878787]">
        Consulta: {formatDate(date)}
      </p>

      <p className="mt-2 text-sm font-bold text-[#08553F]">
        Pagamento: {paymentStatus}
      </p>

      <p className="mt-2 max-w-full truncate text-xs text-[#878787]">
        Consulta: {appointmentId}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/admin/consultas?appointmentId=${appointmentId}`}
          className="rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
        >
          Abrir consulta
        </Link>

        {paymentId ? (
          <Link
            href={`/dashboard/admin/financeiro/${paymentId}`}
            className="rounded-xl border border-[#08553F]/30 bg-white px-4 py-2 text-sm font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
          >
            Abrir pagamento
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function PayoutIssueCard({
  payoutId,
  doctorName,
  amount,
  createdAt,
}: Readonly<{
  payoutId: string;
  doctorName: string;
  amount: number;
  createdAt: Date;
}>) {
  return (
    <div className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
      <p className="font-extrabold text-[#08553F]">{doctorName}</p>

      <p className="mt-1 text-sm text-[#878787]">
        Criado em: {formatDate(createdAt)}
      </p>

      <p className="mt-1 text-sm font-bold text-[#08553F]">
        Valor: {formatCurrency(amount)}
      </p>

      <p className="mt-2 max-w-full truncate text-xs text-[#878787]">
        Repasse: {payoutId}
      </p>

      <Link
        href={`/dashboard/admin/financeiro/repasses/${payoutId}`}
        className="mt-4 inline-flex rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
      >
        Abrir repasse
      </Link>
    </div>
  );
}