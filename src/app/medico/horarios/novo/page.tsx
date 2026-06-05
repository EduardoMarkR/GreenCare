import { createAvailability } from "./actions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NovoHorarioPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">
              Novo Horário
            </h1>

            <p className="mt-2 text-gray-600">
              Cadastre uma nova disponibilidade para consultas.
            </p>

            <form
              action={createAvailability}
              className="mt-8 space-y-6"
            >
              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Data
                </label>

                <input
                  type="date"
                  name="date"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Hora Inicial
                </label>

                <input
                  type="time"
                  name="startTime"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">
                  Hora Final
                </label>

                <input
                  type="time"
                  name="endTime"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Salvar Horário
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}