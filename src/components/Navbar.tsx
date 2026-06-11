import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function Navbar() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  const user = userId
    ? await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          patient: true,
          doctor: true,
        },
      })
    : null;

  const hasPatientProfile = Boolean(user?.patient);

  const hasApprovedDoctorProfile =
    Boolean(user?.doctor) && user?.doctor?.approvalStatus === "APPROVED";

  const isAdmin = user?.role === "ADMIN";
  const isDoctorActive = activeProfile === "DOCTOR";
  const isPatientActive = activeProfile === "PATIENT";
  const canSwitchProfile = hasPatientProfile && hasApprovedDoctorProfile;

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

          {!user && (
            <>
              <Link
                href="/login"
                className="font-medium text-[#08553F] transition hover:text-[#00CF7B]"
              >
                Entrar
              </Link>

              <Link
                href="/cadastro"
                className="rounded-xl bg-[#08553F] px-5 py-3 font-semibold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Criar Conta
              </Link>
            </>
          )}

          {user && (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl bg-white px-5 py-3 font-bold text-[#08553F] shadow-sm transition hover:bg-[#F3EFA1]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#08553F] text-sm font-extrabold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>

                <span className="max-w-[220px] truncate">{user.name}</span>

                <span className="text-xs transition group-open:rotate-180">
                  ▼
                </span>
              </summary>

              <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-[#C6C6C6]/60 bg-white shadow-xl">
                <div className="border-b border-[#C6C6C6]/40 p-5">
                  <p className="truncate font-extrabold text-[#08553F]">
                    {user.name}
                  </p>

                  <p className="mt-1 truncate text-sm text-[#878787]">
                    {user.email}
                  </p>

                  {activeProfile && (
                    <p className="mt-3 w-fit rounded-full bg-[#F7F4E7] px-3 py-1 text-xs font-bold text-[#08553F]">
                      Perfil ativo:{" "}
                      {activeProfile === "DOCTOR"
                        ? "Médico"
                        : activeProfile === "PATIENT"
                          ? "Paciente"
                          : "Administrador"}
                    </p>
                  )}
                </div>

                <div className="p-3">
                  {isAdmin && (
                    <>
                      <Link
                        href="/dashboard/admin"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Painel administrativo
                      </Link>

                      <Link
                        href="/dashboard/admin/usuarios"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Gestão de usuários
                      </Link>

                      <Link
                        href="/dashboard/admin/consultas"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Gestão de consultas
                      </Link>
                    </>
                  )}

                  {!isAdmin && isPatientActive && hasPatientProfile && (
                    <>
                      <Link
                        href="/dashboard/paciente"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Painel do paciente
                      </Link>

                      <Link
                        href="/dashboard/paciente/perfil"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Meu perfil
                      </Link>

                      <Link
                        href="/dashboard/paciente/documentos"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Meus documentos
                      </Link>
                    </>
                  )}

                  {!isAdmin && isDoctorActive && hasApprovedDoctorProfile && (
                    <>
                      <Link
                        href="/dashboard/medico"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Painel médico
                      </Link>

                      <Link
                        href="/dashboard/medico/perfil"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Meu perfil médico
                      </Link>

                      <Link
                        href="/medico/horarios"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Minha agenda
                      </Link>

                      <Link
                        href="/medico/consultas"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Minhas consultas
                      </Link>

                      <Link
                        href="/medico/historico"
                        className="block rounded-xl px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#F7F4E7]"
                      >
                        Histórico médico
                      </Link>
                    </>
                  )}

                  {!isAdmin && canSwitchProfile && (
                    <>
                      <div className="my-2 h-px bg-[#C6C6C6]/40" />

                      <Link
                        href="/selecionar-perfil"
                        className="block rounded-xl bg-[#F3EFA1] px-4 py-3 text-sm font-bold text-[#08553F] transition hover:bg-[#00CF7B]"
                      >
                        Alternar perfil
                      </Link>
                    </>
                  )}

                  <div className="my-2 h-px bg-[#C6C6C6]/40" />

                  <Link
                    href="/logout"
                    className="block rounded-xl px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                  >
                    Sair
                  </Link>
                </div>
              </div>
            </details>
          )}
        </div>

        <div className="md:hidden">
          {!user ? (
            <Link
              href="/login"
              className="rounded-lg bg-[#08553F] px-4 py-2 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          ) : canSwitchProfile ? (
            <Link
              href="/selecionar-perfil"
              className="rounded-lg bg-[#08553F] px-4 py-2 text-sm font-semibold text-white"
            >
              Alternar
            </Link>
          ) : (
            <Link
              href={
                isAdmin
                  ? "/dashboard/admin"
                  : isDoctorActive
                    ? "/dashboard/medico"
                    : "/dashboard/paciente"
              }
              className="rounded-lg bg-[#08553F] px-4 py-2 text-sm font-semibold text-white"
            >
              Conta
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}