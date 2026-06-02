export default function Hero() {
  return (
    <section className="bg-green-50">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
          Cannabis medicinal com orientação profissional
        </span>

        <h2 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
          Encontre médicos especializados em Cannabis Medicinal
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Busque profissionais qualificados, veja disponibilidade e agende sua consulta online com segurança.
        </p>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-md md:flex-row">
          <input
            type="text"
            placeholder="Busque por médico, especialidade ou cidade"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
          />

          <button className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700">
            Buscar
          </button>
        </div>
      </div>
    </section>
  );
}