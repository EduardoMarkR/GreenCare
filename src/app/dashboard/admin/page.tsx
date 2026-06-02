import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardAdminPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Painel Administrativo
          </h1>

          <p className="mt-4 text-gray-600">
            Gerencie médicos, pacientes, agendamentos e aprovações da plataforma.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Médicos</h2>
              <p className="mt-3 text-3xl font-bold text-green-600">3</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Pacientes</h2>
              <p className="mt-3 text-3xl font-bold text-green-600">0</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Consultas</h2>
              <p className="mt-3 text-3xl font-bold text-green-600">0</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Pendentes</h2>
              <p className="mt-3 text-3xl font-bold text-yellow-600">0</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}