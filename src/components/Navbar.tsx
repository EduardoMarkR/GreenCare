import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#C6C6C6] bg-[#F7F4E7]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col">
          <span className="text-2xl font-bold text-[#08553F]">
            CannaDoctor
          </span>

          <span className="text-xs font-medium tracking-wide text-[#878787]">
            Cannabis Medicinal
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="font-medium text-[#08553F] transition hover:text-[#00CF7B]"
          >
            Início
          </Link>

          <Link
            href="/medicos"
            className="font-medium text-[#08553F] transition hover:text-[#00CF7B]"
          >
            Médicos
          </Link>

          <Link
            href="/login"
            className="font-medium text-[#08553F] transition hover:text-[#00CF7B]"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="rounded-xl bg-[#08553F] px-5 py-3 font-semibold text-white transition hover:bg-[#00CF7B]"
          >
            Criar Conta
          </Link>
        </div>

        <div className="md:hidden">
          <Link
            href="/login"
            className="rounded-lg bg-[#08553F] px-4 py-2 text-sm font-semibold text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}