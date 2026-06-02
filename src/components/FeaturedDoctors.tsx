import DoctorCard from "./DoctorCard";

export default function FeaturedDoctors() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Médicos em destaque
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Profissionais especializados em cannabis medicinal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DoctorCard
            name="Dra. Ana Oliveira"
            specialty="Neurologia"
            location="São Paulo - SP"
            price="Consulta a partir de R$ 250"
          />

          <DoctorCard
            name="Dr. Carlos Santos"
            specialty="Psiquiatria"
            location="Rio de Janeiro - RJ"
            price="Consulta a partir de R$ 300"
          />

          <DoctorCard
            name="Dra. Mariana Costa"
            specialty="Clínica Geral"
            location="Belo Horizonte - MG"
            price="Consulta a partir de R$ 220"
          />
        </div>
      </div>
    </section>
  );
}