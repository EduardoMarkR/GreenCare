import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import Footer from "@/components/Footer";

export default function MedicosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Encontre seu médico
          </h1>

          <p className="mt-4 text-gray-600">
            Busque especialistas em cannabis medicinal por especialidade,
            cidade e disponibilidade.
          </p>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou cidade"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
            />
          </div>

          <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
}