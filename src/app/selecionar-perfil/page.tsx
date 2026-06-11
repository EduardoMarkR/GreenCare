import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";
import { selectProfile } from "./actions";

export default async function SelecionarPerfilPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const hasPatientProfile = Boolean(user.patient);
  const hasApprovedDoctorProfile =
    Boolean(user.doctor) && user.doctor?.approvalStatus === "APPROVED";

  if (!hasPatientProfile && hasApprovedDoctorProfile) {
    redirect("/dashboard/medico");
  }

  if (hasPatientProfile && !hasApprovedDoctorProfile) {
    redirect("/dashboard/paciente");
  }

  if (!hasPatientProfile && !hasApprovedDoctorProfile) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Escolha de perfil"
          title={`Como deseja acessar, ${user.name}?`}
          description="Sua conta possui acesso como paciente e como médico aprovado. Escolha o painel que deseja usar agora."
        />

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <form action={selectProfile}>
              <input type="hidden" name="profile" value="PATIENT" />

              <button
                type="submit"
                className="group block h-full w-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

                <div className="flex h-full flex-col p-8">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F7F4E7] text-3xl">
                    🧑
                  </div>

                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Entrar como paciente
                  </h2>

                  <p className="mt-3 leading-7 text-[#878787]">
                    Acesse suas consultas, documentos, dados pessoais e
                    histórico como paciente da plataforma.
                  </p>

                  <p className="mt-auto pt-8 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                    Acessar painel do paciente →
                  </p>
                </div>
              </button>
            </form>

            <form action={selectProfile}>
              <input type="hidden" name="profile" value="DOCTOR" />

              <button
                type="submit"
                className="group block h-full w-full overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-2 bg-gradient-to-r from-[#F3EFA1] to-[#00CF7B]" />

                <div className="flex h-full flex-col p-8">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F3EFA1] text-3xl">
                    ⚕️
                  </div>

                  <h2 className="text-2xl font-extrabold text-[#08553F]">
                    Entrar como médico
                  </h2>

                  <p className="mt-3 leading-7 text-[#878787]">
                    Gerencie sua agenda, consultas, perfil profissional e
                    atendimentos médicos.
                  </p>

                  <p className="mt-auto pt-8 font-bold text-[#08553F] group-hover:text-[#00CF7B]">
                    Acessar painel médico →
                  </p>
                </div>
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="font-bold text-[#08553F]">
              Você poderá alternar entre os painéis depois.
            </p>

            <p className="mt-2 text-sm leading-6 text-[#878787]">
              Para facilitar o uso, também vamos manter botões de acesso entre
              paciente e médico nos dashboards.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}