import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPacientePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Painel do Paciente
          </h1>

          <p className="mt-4 text-gray-600">
            Acompanhe suas consultas, agendamentos e informações de atendimento.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Próxima consulta</h2>
              <p className="mt-3 text-gray-600">Nenhuma consulta agendada.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Histórico</h2>
              <p className="mt-3 text-gray-600">Você ainda não possui consultas anteriores.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Documentos</h2>
              <p className="mt-3 text-gray-600">Nenhum documento disponível.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}