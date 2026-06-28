import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    payoutId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusLabel(status: string) {
  if (status === "PAID") return "Pago";
  if (status === "PENDING") return "Pendente";
  if (status === "FAILED") return "Falhou";
  if (status === "REFUNDED") return "Reembolsado";
  if (status === "CANCELLED") return "Cancelado";

  return status;
}

export default async function DoctorPayoutDetailPage({ params }: Props) {
  const { payoutId } = await params;
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "DOCTOR") redirect("/");

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
  });

  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    redirect("/login");
  }

  const payout = await prisma.doctorPayout.findFirst({
    where: {
      id: payoutId,
      doctorId: doctor.id,
    },
    include: {
      payments: {
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          appointment: {
            include: {
              availability: true,
            },
          },
        },
        orderBy: {
          paidAt: "asc",
        },
      },
    },
  });

  if (!payout) {
    notFound();
  }

  const grossAmount = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const platformFee = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.platformFee),
    0
  );

  const doctorAmount = payout.payments.reduce(
    (sum, payment) => sum + Number(payment.doctorAmount),
    0
  );

  const isBalanced = Number(payout.amount) === doctorAmount;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Detalhe do repasse"
          title="Meu repasse"
          description="Consulte os pagamentos e valores vinculados a este fechamento financeiro."
          backHref="/dashboard/medico/financeiro"
          backLabel="Voltar ao financeiro"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/medico/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao financeiro
            </Link>

            <a
              href={`/dashboard/medico/financeiro/repasses/${payout.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
            >
              Baixar PDF
            </a>
          </div>

          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
              Repasse
            </p>

            <h1 className="mt-2 break-all text-3xl font-extrabold text-[#08553F] md:text-4xl">
              {payout.id}
            </h1>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-sm font-bold text-[#08553F]">
                {payout.payments.length} pagamento(s)
              </span>

              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  isBalanced
                    ? "bg-[#00CF7B]/15 text-[#08553F]"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isBalanced ? "Conciliado" : "Divergência"}
              </span>

              <span className="rounded-full bg-[#F3EFA1] px-4 py-2 text-sm font-bold text-[#08553F]">
                Criado em {formatDate(payout.createdAt)}
              </span>
            </div>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor bruto
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {formatCurrency(grossAmount)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">Comissão</p>
              <p className="mt-3 text-3xl font-extrabold text-white">
                {formatCurrency(platformFee)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor médico
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {formatCurrency(doctorAmount)}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor do repasse
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {formatCurrency(Number(payout.amount))}
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Período
            </h2>

            <div className="mt-5 space-y-3 text-[#08553F]">
              <p>
                <strong>Período:</strong> {formatDate(payout.startDate)} até{" "}
                {formatDate(payout.endDate)}
              </p>
              <p>
                <strong>Criado em:</strong> {formatDateTime(payout.createdAt)}
              </p>
              <p>
                <strong>Observação:</strong>{" "}
                {payout.notes ?? "Sem observações."}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
            <div className="border-b border-[#C6C6C6]/60 p-6">
              <h2 className="text-2xl font-extrabold text-[#08553F]">
                Pagamentos vinculados
              </h2>

              <p className="mt-2 text-[#878787]">
                Pagamentos que fazem parte deste fechamento.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead className="bg-[#F7F4E7] text-sm text-[#08553F]">
                  <tr>
                    <th className="px-5 py-4 font-extrabold">Pago em</th>
                    <th className="px-5 py-4 font-extrabold">Paciente</th>
                    <th className="px-5 py-4 font-extrabold">Consulta</th>
                    <th className="px-5 py-4 font-extrabold">Status</th>
                    <th className="px-5 py-4 font-extrabold">Bruto</th>
                    <th className="px-5 py-4 font-extrabold">Comissão</th>
                    <th className="px-5 py-4 font-extrabold">Médico</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#C6C6C6]/50">
                  {payout.payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center font-bold text-[#878787]"
                      >
                        Nenhum pagamento vinculado a este repasse.
                      </td>
                    </tr>
                  ) : (
                    payout.payments.map((payment) => (
                      <tr key={payment.id} className="align-top">
                        <td className="px-5 py-4 text-sm text-[#878787]">
                          {payment.paidAt
                            ? formatDateTime(payment.paidAt)
                            : "Não informado"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-[#08553F]">
                            {payment.patient.user.name}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#878787]">
                          <p className="font-bold text-[#08553F]">
                            {formatDate(payment.appointment.date)}
                          </p>
                          <p className="mt-1">
                            {payment.appointment.availability?.startTime ??
                              "Horário não informado"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#00CF7B]/15 px-4 py-2 text-xs font-bold text-[#08553F]">
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-[#08553F]">
                          {formatCurrency(Number(payment.amount))}
                        </td>

                        <td className="px-5 py-4 text-[#878787]">
                          {formatCurrency(Number(payment.platformFee))}
                        </td>

                        <td className="px-5 py-4 font-bold text-[#08553F]">
                          {formatCurrency(Number(payment.doctorAmount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}