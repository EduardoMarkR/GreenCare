"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentStatusWatcherProps = {
  paymentId: string;
  initialPaymentStatus: string;
  initialAppointmentStatus: string;
  initialMeetingUrl?: string | null;
};

type PaymentStatusResponse = {
  ok: boolean;
  paymentStatus?: string;
  appointmentStatus?: string;
  meetingUrl?: string | null;
  paidAt?: string | null;
};

function getPaymentLabel(status: string) {
  if (status === "PAID") return "Pagamento confirmado";
  if (status === "PENDING") return "Aguardando pagamento";
  if (status === "FAILED") return "Pagamento falhou";
  if (status === "REFUNDED") return "Pagamento reembolsado";
  if (status === "CANCELLED") return "Pagamento cancelado";

  return status;
}

function getAppointmentLabel(status: string) {
  if (status === "CONFIRMED") return "Confirmada";
  if (status === "PENDING") return "Aguardando pagamento";
  if (status === "CANCELLED") return "Cancelada";
  if (status === "COMPLETED") return "Concluída";

  return status;
}

export default function PaymentStatusWatcher({
  paymentId,
  initialPaymentStatus,
  initialAppointmentStatus,
  initialMeetingUrl,
}: PaymentStatusWatcherProps) {
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [appointmentStatus, setAppointmentStatus] = useState(
    initialAppointmentStatus
  );
  const [meetingUrl, setMeetingUrl] = useState(initialMeetingUrl);

  const isPaid = paymentStatus === "PAID";
  const isChecking = paymentStatus === "PENDING";

  useEffect(() => {
    if (paymentStatus !== "PENDING") {
      return;
    }

    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`, {
          cache: "no-store",
        });

        const data = (await response.json()) as PaymentStatusResponse;

        if (!data.ok) {
          return;
        }

        if (data.paymentStatus) {
          setPaymentStatus(data.paymentStatus);
        }

        if (data.appointmentStatus) {
          setAppointmentStatus(data.appointmentStatus);
        }

        if (data.meetingUrl) {
          setMeetingUrl(data.meetingUrl);
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      }
    }

    const interval = window.setInterval(checkPaymentStatus, 5000);

    return () => window.clearInterval(interval);
  }, [paymentId, paymentStatus]);

  return (
    <div
      className={`mt-8 rounded-3xl border p-6 ${
        isPaid
          ? "border-[#00CF7B]/30 bg-[#00CF7B]/10"
          : "border-[#C6C6C6]/60 bg-[#F7F4E7]"
      }`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
        Acompanhamento automático
      </p>

      <h3 className="mt-3 text-2xl font-extrabold text-[#08553F]">
        {isPaid ? "Consulta confirmada 🎉" : getPaymentLabel(paymentStatus)}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#878787]">
        {isPaid
          ? "Recebemos a confirmação do pagamento. Sua consulta já foi confirmada."
          : "Estamos verificando automaticamente o status do pagamento. Você não precisa atualizar a página."}
      </p>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
            Pagamento
          </p>

          <p className="mt-1 font-extrabold text-[#08553F]">
            {getPaymentLabel(paymentStatus)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
            Consulta
          </p>

          <p className="mt-1 font-extrabold text-[#08553F]">
            {getAppointmentLabel(appointmentStatus)}
          </p>
        </div>
      </div>

      {isChecking ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#08553F]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-[#00CF7B]" />
          Verificando pagamento a cada 5 segundos...
        </div>
      ) : null}

      {isPaid && meetingUrl ? (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block rounded-2xl bg-[#08553F] px-6 py-4 text-center font-bold text-white transition hover:bg-[#064331]"
        >
          Entrar na teleconsulta
        </a>
      ) : null}

      {isPaid ? (
        <Link
          href="/dashboard/paciente"
          className="mt-4 block rounded-2xl border border-[#08553F]/30 bg-white px-6 py-4 text-center font-bold text-[#08553F] transition hover:bg-[#F3EFA1]"
        >
          Ver minhas consultas
        </Link>
      ) : null}
    </div>
  );
}