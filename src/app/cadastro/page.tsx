import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPatientAccount } from "./actions";

export default function CadastroPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-6 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Criar conta</h1>

          <p className="mt-2 text-gray-600">
            Cadastre-se como paciente para agendar consultas na GreenCare.
          </p>

          <form action={createPatientAccount} className="mt-8 space-y-4">
            <input
              type="text"
              name="name"
              required
              placeholder="Nome completo"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="email"
              name="email"
              required
              placeholder="E-mail"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              type="password"
              name="password"
              required
              placeholder="Senha"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-600"
            />

            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
              Após criar sua conta, você poderá solicitar cadastro médico pelo
              painel do paciente, caso tenha CRM.
            </p>

            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
            >
              Criar conta
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}