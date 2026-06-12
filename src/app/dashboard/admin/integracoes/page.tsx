import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CannaPageHero from "@/components/CannaPageHero";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminIntegracoesPage() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      googleCalendarConnection: true,
      appointments: {
        where: {
          meetingUrl: {
            not: null,
          },
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDoctors = doctors.length;

  const connectedDoctors = doctors.filter(
    (doctor) => doctor.googleCalendarConnection
  ).length;

  const approvedDoctors = doctors.filter(
    (doctor) => doctor.approvalStatus === "APPROVED"
  ).length;

  const doctorsWithMeet = doctors.filter(
    (doctor) => doctor.appointments.length > 0
  ).length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F7F4E7]">
        <CannaPageHero
          badge="Administração"
          title="Integrações"
          description="Acompanhe quais médicos conectaram a Google Agenda e quais já possuem teleconsultas com Google Meet."
          backHref="/dashboard/admin"
          backLabel="Voltar ao painel admin"
        />

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 grid gap-6 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">
                Médicos cadastrados
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {totalDoctors}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">
                Médicos aprovados
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {approvedDoctors}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">
                Google conectado
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {connectedDoctors}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#878787]">
                Com Google Meet
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#08553F]">
                {doctorsWithMeet}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#08553F]">
                  Médicos e integrações Google
                </h2>

                <p className="mt-2 text-[#878787]">
                  Veja o status da conexão Google Calendar e o uso de Google
                  Meet por médico.
                </p>
              </div>

              <Link
                href="/dashboard/admin/medicos"
                className="rounded-2xl bg-[#08553F] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
              >
                Gerenciar médicos
              </Link>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-[#878787]">
                    <th className="px-4 py-2">Médico</th>
                    <th className="px-4 py-2">CRM</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Google Calendar</th>
                    <th className="px-4 py-2">E-mail Google</th>
                    <th className="px-4 py-2">Meet gerados</th>
                    <th className="px-4 py-2">Conectado em</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="rounded-2xl bg-[#F7F4E7] px-4 py-6 text-center font-bold text-[#08553F]"
                      >
                        Nenhum médico cadastrado.
                      </td>
                    </tr>
                  )}

                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="bg-[#F7F4E7]">
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-extrabold text-[#08553F]">
                          {doctor.user.name}
                        </p>

                        <p className="mt-1 text-sm text-[#878787]">
                          {doctor.specialty}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-[#08553F]">
                        {doctor.crm}/{doctor.crmUf}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#08553F]">
                          {doctor.approvalStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {doctor.googleCalendarConnection ? (
                          <span className="rounded-full bg-[#00CF7B]/15 px-3 py-2 text-xs font-bold text-[#08553F]">
                            Conectado
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
                            Não conectado
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-[#878787]">
                        {doctor.googleCalendarConnection?.googleEmail ??
                          "Não informado"}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-[#08553F]">
                        {doctor.appointments.length}
                      </td>

                      <td className="rounded-r-2xl px-4 py-4 text-sm text-[#878787]">
                        {formatDate(
                          doctor.googleCalendarConnection?.createdAt ?? null
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}