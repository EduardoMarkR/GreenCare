import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-6 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Entrar
          </h1>

          <p className="mt-2 text-gray-600">
            Acesse sua conta GreenCare.
          </p>

          <form
            action={loginAction}
            className="mt-8 space-y-4"
          >
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Senha"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}