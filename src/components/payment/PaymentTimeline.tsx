type PaymentTimelineProps = {
  isPaid: boolean;
  hasMeetingUrl: boolean;
};

function getStepClass(active: boolean, completed: boolean) {
  if (completed) return "bg-[#00CF7B] text-white shadow-sm";
  if (active) return "bg-[#F3EFA1] text-[#08553F] shadow-sm";

  return "bg-[#F7F4E7] text-[#878787]";
}

export default function PaymentTimeline({
  isPaid,
  hasMeetingUrl,
}: PaymentTimelineProps) {
  const steps = [
    {
      number: "1",
      title: "Consulta criada",
      description: "Seu horário foi reservado.",
      active: true,
      completed: true,
    },
    {
      number: "2",
      title: "Pagamento",
      description: isPaid
        ? "Pagamento confirmado."
        : "Aguardando confirmação.",
      active: !isPaid,
      completed: isPaid,
    },
    {
      number: "3",
      title: "Teleconsulta",
      description: hasMeetingUrl
        ? "Sala liberada."
        : "Sala será criada após o pagamento.",
      active: isPaid && !hasMeetingUrl,
      completed: hasMeetingUrl,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.number}
          className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#C6C6C6]/60"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold ${getStepClass(
              step.active,
              step.completed
            )}`}
          >
            {step.completed ? "✓" : step.number}
          </div>

          <p className="mt-4 text-sm font-bold text-[#878787]">
            Etapa {step.number}
          </p>

          <p className="mt-1 text-lg font-extrabold text-[#08553F]">
            {step.title}
          </p>

          <p className="mt-2 text-sm leading-6 text-[#878787]">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}