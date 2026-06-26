import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    paymentId: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date?: Date | null) {
  if (!date) return "Não informado";

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

function getPaymentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "PAID") return "Pago";
  if (status === "FAILED") return "Falhou";
  if (status === "REFUNDED") return "Reembolsado";
  if (status === "CANCELLED") return "Cancelado";

  return status;
}

function getAppointmentStatusLabel(status: string) {
  if (status === "PENDING") return "Pendente";
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

function getMethodLabel(method?: string | null) {
  if (method === "PIX") return "PIX";
  if (method === "CREDIT_CARD") return "Cartão de crédito";
  if (method === "DEBIT_CARD") return "Cartão de débito";
  if (method === "BOLETO") return "Boleto";
  if (method === "BANK_TRANSFER") return "Transferência";
  if (method === "MANUAL") return "Manual";

  return "Não informado";
}

function getStatusClass(status: string) {
  if (status === "PAID" || status === "CONFIRMED" || status === "COMPLETED") {
    return "bg-[#00CF7B]/15 text-[#08553F]";
  }

  if (status === "PENDING") return "bg-[#F3EFA1] text-[#08553F]";
  if (status === "CANCELLED") return "bg-[#C6C6C6]/30 text-[#878787]";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  if (status === "REFUNDED") return "bg-blue-100 text-blue-700";

  return "bg-white text-[#08553F]";
}

function getGatewayPayloadSummary(payload: unknown) {
  if (!payload) return "Nenhum payload salvo.";

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return "Não foi possível exibir o payload.";
  }
}

function getReconciliationItems(payment: {
  status: string;
  gatewayPaymentId: string | null;
  invoiceUrl: string | null;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  paidAt: Date | null;
  amount: unknown;
  platformFee: unknown;
  doctorAmount: unknown;
  appointment: {
    status: string;
    meetingUrl: string | null;
    googleEventId: string | null;
  };
}) {
  const items: {
    label: string;
    status: "ok" | "warning" | "error";
    description: string;
  }[] = [];

  if (payment.status === "PAID" && payment.appointment.status === "CONFIRMED") {
    items.push({
      label: "Pagamento e consulta",
      status: "ok",
      description: "Pagamento pago e consulta confirmada.",
    });
  } else if (
    payment.status === "PENDING" &&
    payment.appointment.status === "PENDING"
  ) {
    items.push({
      label: "Pagamento e consulta",
      status: "ok",
      description: "Pagamento pendente e consulta ainda pendente.",
    });
  } else if (
    payment.status === "PAID" &&
    payment.appointment.status === "PENDING"
  ) {
    items.push({
      label: "Pagamento e consulta",
      status: "error",
      description:
        "Pagamento está pago, mas a consulta ainda está pendente. Verificar webhook/atualização automática.",
    });
  } else if (
    ["FAILED", "CANCELLED", "REFUNDED"].includes(payment.status) &&
    payment.appointment.status === "CONFIRMED"
  ) {
    items.push({
      label: "Pagamento e consulta",
      status: "error",
      description:
        "Pagamento não está ativo, mas a consulta permanece confirmada.",
    });
  } else {
    items.push({
      label: "Pagamento e consulta",
      status: "warning",
      description: `Pagamento ${payment.status} e consulta ${payment.appointment.status}. Revisar manualmente.`,
    });
  }

  if (payment.gatewayPaymentId) {
    items.push({
      label: "ID do gateway",
      status: "ok",
      description: "Pagamento possui gatewayPaymentId vinculado.",
    });
  } else {
    items.push({
      label: "ID do gateway",
      status: "warning",
      description: "Pagamento ainda não possui gatewayPaymentId.",
    });
  }

  if (payment.status === "PAID" && payment.paidAt) {
    items.push({
      label: "Data de pagamento",
      status: "ok",
      description: "Pagamento possui data de confirmação.",
    });
  } else if (payment.status === "PAID" && !payment.paidAt) {
    items.push({
      label: "Data de pagamento",
      status: "warning",
      description: "Pagamento pago sem paidAt salvo.",
    });
  }

  if (payment.status === "PAID" && payment.appointment.meetingUrl) {
    items.push({
      label: "Google Meet",
      status: "ok",
      description: "Consulta confirmada com link de teleconsulta.",
    });
  } else if (payment.status === "PAID" && !payment.appointment.meetingUrl) {
    items.push({
      label: "Google Meet",
      status: "warning",
      description:
        "Pagamento pago, mas a consulta ainda não possui link do Google Meet.",
    });
  }

  if (Number(payment.amount) === Number(payment.platformFee) + Number(payment.doctorAmount)) {
    items.push({
      label: "Divisão financeira",
      status: "ok",
      description: "Valor bruto bate com comissão + valor médico.",
    });
  } else {
    items.push({
      label: "Divisão financeira",
      status: "error",
      description:
        "Valor bruto não bate com comissão + valor médico. Revisar cálculo financeiro.",
    });
  }

  return items;
}

function ReconciliationBadge({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") {
    return (
      <span className="rounded-full bg-[#00CF7B]/15 px-3 py-1 text-xs font-bold text-[#08553F]">
        OK
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="rounded-full bg-[#F3EFA1] px-3 py-1 text-xs font-bold text-[#08553F]">
        Atenção
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      Divergência
    </span>
  );
}

function InfoCard({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#08553F]">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: Readonly<{
  label: string;
  value?: string | number | null;
}>) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#878787]">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-[#08553F]">
        {value || "Não informado"}
      </p>
    </div>
  );
}

export default async function AdminFinanceiroPagamentoPage({ params }: Props) {
  const { paymentId } = await params;
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "ADMIN") {
    redirect("/");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      appointment: {
        include: {
          availability: true,
        },
      },
      patient: {
        include: {
          user: true,
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

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        {
          entityId: payment.id,
        },
        {
          entityId: payment.appointmentId,
        },
        {
          entityId: payment.patientId,
        },
        {
          entityId: payment.doctorId,
        },
        {
          details: {
            contains: payment.id,
            mode: "insensitive",
          },
        },
        {
          details: {
            contains: payment.appointmentId,
            mode: "insensitive",
          },
        },
        ...(payment.gatewayPaymentId
          ? [
              {
                details: {
                  contains: payment.gatewayPaymentId,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 50,
  });

  const reconciliationItems = getReconciliationItems(payment);
  const hasError = reconciliationItems.some((item) => item.status === "error");
  const hasWarning = reconciliationItems.some(
    (item) => item.status === "warning"
  );

  const reconciliationLabel = hasError
    ? "Divergência encontrada"
    : hasWarning
      ? "Conciliado com alertas"
      : "Conciliado";

  const reconciliationClass = hasError
    ? "bg-red-100 text-red-700"
    : hasWarning
      ? "bg-[#F3EFA1] text-[#08553F]"
      : "bg-[#00CF7B]/15 text-[#08553F]";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Detalhe financeiro"
          title="Detalhes do pagamento"
          description="Visão completa do pagamento, consulta, paciente, médico, gateway e conciliação operacional."
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/admin/financeiro/extrato"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao extrato
            </Link>

            <Link
              href="/dashboard/admin/financeiro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Voltar ao financeiro
            </Link>

            {payment.invoiceUrl ? (
              <a
                href={payment.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center font-bold text-white shadow-sm transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Abrir cobrança
              </a>
            ) : null}

            {payment.appointment.meetingUrl ? (
              <a
                href={payment.appointment.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#F3EFA1] px-5 py-3 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#00CF7B]"
              >
                Abrir teleconsulta
              </a>
            ) : null}
          </div>

          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
                  Pagamento
                </p>

                <h1 className="mt-2 break-all text-3xl font-extrabold text-[#08553F] md:text-4xl">
                  {payment.id}
                </h1>

                <p className="mt-3 text-[#878787]">
                  Criado em {formatDateTime(payment.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                    payment.status
                  )}`}
                >
                  {getPaymentStatusLabel(payment.status)}
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(
                    payment.appointment.status
                  )}`}
                >
                  Consulta {getAppointmentStatusLabel(payment.appointment.status)}
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${reconciliationClass}`}
                >
                  {reconciliationLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor bruto
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {formatCurrency(Number(payment.amount))}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#08553F] p-6 shadow-sm">
              <p className="text-sm font-semibold text-white/70">
                Comissão plataforma
              </p>
              <p className="mt-3 text-3xl font-extrabold text-white">
                {formatCurrency(Number(payment.platformFee))}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {Number(payment.commissionRate)}%
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Valor médico
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {formatCurrency(Number(payment.doctorAmount))}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#878787]">
                Método
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#08553F]">
                {getMethodLabel(payment.method)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <InfoCard title="Paciente">
              <InfoRow label="Nome" value={payment.patient.user.name} />
              <InfoRow label="E-mail" value={payment.patient.user.email} />
              <InfoRow label="Telefone" value={payment.patient.phone} />
              <InfoRow label="CPF/CNPJ" value={payment.patient.cpfCnpj} />
              <InfoRow
                label="Customer ID"
                value={payment.patient.paymentCustomerId}
              />
            </InfoCard>

            <InfoCard title="Médico">
              <InfoRow label="Nome" value={payment.doctor.user.name} />
              <InfoRow label="E-mail" value={payment.doctor.user.email} />
              <InfoRow label="Especialidade" value={payment.doctor.specialty} />
              <InfoRow
                label="CRM"
                value={`${payment.doctor.crm}/${payment.doctor.crmUf}`}
              />
              <InfoRow
                label="Preço da consulta"
                value={formatCurrency(Number(payment.doctor.price))}
              />
            </InfoCard>

            <InfoCard title="Consulta">
              <InfoRow label="ID da consulta" value={payment.appointment.id} />
              <InfoRow label="Data" value={formatDate(payment.appointment.date)} />
              <InfoRow
                label="Horário"
                value={payment.appointment.availability?.startTime}
              />
              <InfoRow
                label="Status"
                value={getAppointmentStatusLabel(payment.appointment.status)}
              />
              <InfoRow
                label="Google Event ID"
                value={payment.appointment.googleEventId}
              />
              <InfoRow label="Google Meet" value={payment.appointment.meetingUrl} />
            </InfoCard>

            <InfoCard title="Gateway / Asaas">
              <InfoRow label="Gateway" value={payment.gateway} />
              <InfoRow label="Gateway Payment ID" value={payment.gatewayPaymentId} />
              <InfoRow label="Gateway Customer ID" value={payment.gatewayCustomerId} />
              <InfoRow label="Invoice URL" value={payment.invoiceUrl} />
              <InfoRow label="External ID" value={payment.externalId} />
              <InfoRow label="External URL" value={payment.externalUrl} />
              <InfoRow label="Pago em" value={formatDateTime(payment.paidAt)} />
              <InfoRow
                label="Cancelado em"
                value={formatDateTime(payment.cancelledAt)}
              />
              <InfoRow
                label="Reembolsado em"
                value={formatDateTime(payment.refundedAt)}
              />
            </InfoCard>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Conciliação operacional
            </h2>

            <p className="mt-2 text-[#878787]">
              Conferência automática entre pagamento, consulta, gateway, valores
              e teleconsulta.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {reconciliationItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-extrabold text-[#08553F]">
                      {item.label}
                    </h3>

                    <ReconciliationBadge status={item.status} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#878787]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-[#08553F]">
              Timeline de auditoria
            </h2>

            <p className="mt-2 text-[#878787]">
              Eventos encontrados no AuditLog relacionados a este pagamento,
              consulta, paciente, médico ou gateway.
            </p>

            <div className="mt-6 space-y-4">
              {auditLogs.length === 0 ? (
                <div className="rounded-2xl bg-[#F7F4E7] p-5">
                  <p className="font-bold text-[#878787]">
                    Nenhum log relacionado foi encontrado.
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-extrabold text-[#08553F]">
                          {log.action}
                        </p>

                        <p className="mt-1 text-sm text-[#878787]">
                          Entidade: {log.entity}
                          {log.entityId ? ` • ${log.entityId}` : ""}
                        </p>

                        {log.details ? (
                          <p className="mt-3 text-sm leading-6 text-[#878787]">
                            {log.details}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-sm font-bold text-[#08553F] md:text-right">
                        <p>{formatDateTime(log.createdAt)}</p>
                        <p className="mt-1 text-xs text-[#878787]">
                          {log.user?.name ?? "Sistema"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#C6C6C6]/60 bg-[#08553F] p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-white">
              Payload do webhook / gateway
            </h2>

            <p className="mt-2 text-white/70">
              Dados brutos salvos no pagamento para análise técnica e suporte.
            </p>

            <pre className="mt-6 max-h-[520px] overflow-auto rounded-2xl bg-black/20 p-5 text-xs leading-6 text-white">
              {getGatewayPayloadSummary(payment.webhookPayload)}
            </pre>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}