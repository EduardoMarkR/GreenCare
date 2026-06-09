import Link from "next/link";
import CannaLeafPattern from "@/components/CannaLeafPattern";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#C6C6C6]/60 bg-gradient-to-br from-[#F7F4E7] via-white to-[#F3EFA1]/70">
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#00CF7B]/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#F3EFA1]/70 blur-3xl" />

      <CannaLeafPattern className="absolute -bottom-24 right-4 h-96 w-96 rotate-12 text-[#08553F]/5" />
      <CannaLeafPattern className="absolute bottom-20 right-80 hidden h-48 w-48 -rotate-12 text-[#00CF7B]/10 lg:block" />
      <CannaLeafPattern className="absolute top-12 right-44 hidden h-32 w-32 rotate-[22deg] text-[#08553F]/5 xl:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full border border-[#00CF7B]/40 bg-white px-5 py-3 text-sm font-bold text-[#08553F] shadow-sm">
            🌿 Cannabis medicinal com orientação segura
          </span>

          <h1 className="mt-8 max-w-3xl text-5xl font-extrabold tracking-tight text-[#08553F] md:text-7xl">
            Cuidado especializado para tratamentos com cannabis medicinal.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#878787]">
            Encontre profissionais aprovados, envie seus documentos e agende sua
            consulta online com mais segurança, clareza e acompanhamento.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/medicos"
              className="rounded-2xl bg-[#08553F] px-7 py-4 text-center font-bold text-white shadow-lg transition hover:bg-[#00CF7B] hover:text-[#08553F]"
            >
              Encontrar médicos
            </Link>

            <Link
              href="/cadastro"
              className="rounded-2xl border border-[#08553F]/30 bg-white px-7 py-4 text-center font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]"
            >
              Criar conta gratuita
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#08553F] to-[#00CF7B] p-1 shadow-2xl">
            <div className="rounded-[1.8rem] bg-[#F7F4E7] p-8">
              <div className="rounded-3xl bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#08553F] text-2xl text-white">
                    ✳
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#878787]">
                      Plataforma CannaDoctor
                    </p>

                    <p className="text-xl font-bold text-[#08553F]">
                      Jornada segura do paciente
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Escolha um médico aprovado",
                    "Agende uma consulta online",
                    "Envie documentos com segurança",
                    "Acompanhe seu tratamento",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-[#F7F4E7] p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00CF7B] text-sm font-bold text-[#08553F]">
                        ✓
                      </span>

                      <p className="font-semibold text-[#08553F]">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-[#F3EFA1] p-4">
                  <p className="text-sm font-semibold text-[#08553F]">
                    Simples. Esclarecedora. Transparente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden rounded-3xl bg-[#08553F] p-5 text-white shadow-xl md:block">
            <p className="text-sm text-white/80">Médicos aprovados</p>
            <p className="text-3xl font-extrabold">100%</p>
          </div>
        </div>
      </div>
    </section>
  );
}