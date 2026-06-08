import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#C6C6C6] bg-[#08553F] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-bold">
              CannaDoctor
            </h3>

            <p className="mt-2 text-sm font-medium text-[#00CF7B]">
              Cannabis Medicinal
            </p>

            <p className="mt-6 max-w-md leading-relaxed text-white/80">
              Plataforma especializada em conectar pacientes a profissionais
              qualificados para acompanhamento e tratamentos com cannabis
              medicinal.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#F3EFA1]">
              Navegação
            </h4>

            <ul className="mt-4 space-y-3 text-white/80">
              <li>
                <Link href="/" className="hover:text-[#00CF7B]">
                  Início
                </Link>
              </li>

              <li>
                <Link href="/medicos" className="hover:text-[#00CF7B]">
                  Médicos
                </Link>
              </li>

              <li>
                <Link href="/login" className="hover:text-[#00CF7B]">
                  Entrar
                </Link>
              </li>

              <li>
                <Link href="/cadastro" className="hover:text-[#00CF7B]">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#F3EFA1]">
              Informações
            </h4>

            <ul className="mt-4 space-y-3 text-white/80">
              <li>Política de Privacidade</li>
              <li>Termos de Uso</li>
              <li>LGPD</li>
              <li>Suporte</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          © 2026 CannaDoctor. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}