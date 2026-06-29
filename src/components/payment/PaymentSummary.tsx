type PaymentSummaryProps = {
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  methodLabel: string;
  amount: string;
  paymentStatusLabel: string;
  appointmentStatusLabel: string;
};

export default function PaymentSummary({
  doctorName,
  specialty,
  date,
  time,
  methodLabel,
  amount,
  paymentStatusLabel,
  appointmentStatusLabel,
}: PaymentSummaryProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm">
      <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

      <div className="p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
          Resumo da consulta
        </p>

        <h2 className="mt-3 text-3xl font-extrabold text-[#08553F]">
          {doctorName}
        </h2>

        <p className="mt-2 text-sm font-semibold text-[#878787]">
          {specialty}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[#F7F4E7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
              Data
            </p>

            <p className="mt-2 text-lg font-extrabold text-[#08553F]">
              {date}
            </p>
          </div>

          <div className="rounded-3xl bg-[#F7F4E7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
              Horário
            </p>

            <p className="mt-2 text-lg font-extrabold text-[#08553F]">
              {time}
            </p>
          </div>

          <div className="rounded-3xl bg-[#F7F4E7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
              Método
            </p>

            <p className="mt-2 text-lg font-extrabold text-[#08553F]">
              {methodLabel}
            </p>
          </div>

          <div className="rounded-3xl bg-[#F7F4E7] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
              Valor
            </p>

            <p className="mt-2 text-lg font-extrabold text-[#08553F]">
              {amount}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                Pagamento
              </p>

              <p className="mt-1 font-extrabold text-[#08553F]">
                {paymentStatusLabel}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-[#878787]">
                Consulta
              </p>

              <p className="mt-1 font-extrabold text-[#08553F]">
                {appointmentStatusLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}