import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

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

export default async function AdminFinanceiroConciliacaoPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "ADMIN") redirect("/");

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
          {
            payment: null,
          },
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
              <p className="text-sm font-semibold text-[#878787]">
                Sem Meet
              </p>
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
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                  href={`/dashboard/admin/financeiro/${payment.id}`}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Consultas confirmadas sem pagamento pago"
              description="Consulta está CONFIRMED, mas não possui pagamento PAID vinculado."
              count={confirmedWithoutPaidPayment.length}
            >
              {confirmedWithoutPaidPayment.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <p className="font-extrabold text-[#08553F]">
                    {appointment.patient.user.name}
                  </p>
                  <p className="mt-1 text-sm text-[#878787]">
                    Médico: {appointment.doctor.user.name}
                  </p>
                  <p className="mt-1 text-sm text-[#878787]">
                    Consulta: {formatDate(appointment.date)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#08553F]">
                    Pagamento: {appointment.payment?.status ?? "Não existe"}
                  </p>
                </div>
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
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                  href={`/dashboard/admin/financeiro/${payment.id}`}
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
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                  href={`/dashboard/admin/financeiro/${payment.id}`}
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
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.doctorAmount)}
                  href={`/dashboard/admin/financeiro/${payment.id}`}
                />
              ))}
            </IssueSection>

            <IssueSection
              title="Repasses sem pagamentos vinculados"
              description="DoctorPayout criado, mas sem nenhum Payment vinculado."
              count={payoutsWithoutPayments.length}
            >
              {payoutsWithoutPayments.map((payout) => (
                <div
                  key={payout.id}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <p className="font-extrabold text-[#08553F]">
                    {payout.doctor.user.name}
                  </p>
                  <p className="mt-1 text-sm text-[#878787]">
                    Repasse: {payout.id}
                  </p>
                  <p className="mt-1 text-sm text-[#878787]">
                    Valor: {formatCurrency(Number(payout.amount))}
                  </p>

                  <Link
                    href={`/dashboard/admin/financeiro/repasses/${payout.id}`}
                    className="mt-4 inline-flex rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
                  >
                    Ver repasse
                  </Link>
                </div>
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
                  patientName={payment.patient.user.name}
                  doctorName={payment.doctor.user.name}
                  date={payment.createdAt}
                  amount={Number(payment.amount)}
                  href={`/dashboard/admin/financeiro/${payment.id}`}
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
  patientName,
  doctorName,
  date,
  amount,
  href,
}: Readonly<{
  paymentId: string;
  patientName: string;
  doctorName: string;
  date: Date;
  amount: number;
  href: string;
}>) {
  return (
    <div className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
      <p className="font-extrabold text-[#08553F]">{patientName}</p>
      <p className="mt-1 text-sm text-[#878787]">Médico: {doctorName}</p>
      <p className="mt-1 text-sm text-[#878787]">
        Data: {formatDate(date)}
      </p>
      <p className="mt-1 text-sm font-bold text-[#08553F]">
        Valor: {formatCurrency(amount)}
      </p>
      <p className="mt-2 max-w-full truncate text-xs text-[#878787]">
        {paymentId}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl bg-[#08553F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
      >
        Ver pagamento
      </Link>
    </div>
  );
}