const steps = [
  {
    number: "01",
    title: "Busque um médico",
    description:
      "Encontre profissionais especializados em cannabis medicinal e veja informações importantes antes de agendar.",
  },
  {
    number: "02",
    title: "Escolha um horário",
    description:
      "Acesse a agenda disponível do profissional e selecione o melhor horário para sua rotina.",
  },
  {
    number: "03",
    title: "Consulte com segurança",
    description:
      "Faça sua consulta com acompanhamento profissional, organização de documentos e mais clareza no cuidado.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#F7F4E7] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#08553F] shadow-sm">
            Jornada do paciente
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#08553F] md:text-5xl">
            Como funciona
          </h2>

          <p className="mt-5 text-lg leading-8 text-[#878787]">
            Uma experiência pensada para ser simples, transparente e segura do
            primeiro acesso até o acompanhamento.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] bg-[#00CF7B]/15" />

              <p className="text-sm font-extrabold text-[#00CF7B]">
                {step.number}
              </p>

              <h3 className="mt-6 text-2xl font-extrabold text-[#08553F]">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-[#878787]">
                {step.description}
              </p>

              <div className="mt-8 h-2 w-20 rounded-full bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}