import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function MedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-green-100 text-6xl">
                👨‍⚕️
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  Dr. Exemplo
                </h1>

                <p className="mt-2 text-green-700">
                  Neurologia
                </p>

                <p className="mt-2 text-gray-600">
                  CRM 123456-SP
                </p>

                <p className="mt-2 text-gray-600">
                  ID da página: {id}
                </p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-bold">
                Sobre o médico
              </h2>

              <p className="mt-4 text-gray-600">
                Especialista em cannabis medicinal,
                neurologia e acompanhamento terapêutico.
              </p>
            </div>

            <div className="mt-10">
              <button className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700">
                Agendar consulta
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}