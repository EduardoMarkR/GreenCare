export default function HowItWorks() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Como funciona
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Agendar sua consulta é simples e rápido.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl">🔍</div>

            <h3 className="text-xl font-bold">
              Busque um médico
            </h3>

            <p className="mt-3 text-gray-600">
              Encontre especialistas em cannabis medicinal através de filtros inteligentes.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl">📅</div>

            <h3 className="text-xl font-bold">
              Escolha um horário
            </h3>

            <p className="mt-3 text-gray-600">
              Consulte a agenda disponível e selecione o melhor horário para você.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl">💚</div>

            <h3 className="text-xl font-bold">
              Consulte com segurança
            </h3>

            <p className="mt-3 text-gray-600">
              Receba acompanhamento profissional e orientação personalizada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}