import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardMedicoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Painel do Médico
          </h1>

          <p className="mt-4 text-gray-600">
            Gerencie seu perfil, disponibilidade e consultas recebidas.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Perfil profissional</h2>
              <p className="mt-3 text-gray-600">Complete seus dados médicos.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Agenda</h2>
              <p className="mt-3 text-gray-600">Configure seus horários disponíveis.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Consultas</h2>
              <p className="mt-3 text-gray-600">Nenhuma consulta marcada.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}