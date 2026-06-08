import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { updateUserRole } from "./actions";

type AdminUsuariosPageProps = {
  searchParams?: Promise<{
    busca?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function getRoleLabel(role: string) {
  if (role === "ADMIN") return "Administrador";
  if (role === "DOCTOR") return "Médico";
  if (role === "PATIENT") return "Paciente";

  return role;
}

function getRoleClass(role: string) {
  if (role === "ADMIN") return "bg-purple-100 text-purple-800";
  if (role === "DOCTOR") return "bg-green-100 text-green-800";
  if (role === "PATIENT") return "bg-blue-100 text-blue-800";

  return "bg-gray-100 text-gray-800";
}

export default async function AdminUsuariosPage({
  searchParams,
}: AdminUsuariosPageProps) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userRole = cookieStore.get("userRole")?.value;

  if (!userId || userRole !== "ADMIN") {
    redirect("/login");
  }

  const params = await searchParams;
  const searchTerm = params?.busca?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: searchTerm
      ? {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalUsers = await prisma.user.count();

  const totalAdmins = await prisma.user.count({
    where: {
      role: "ADMIN",
    },
  });

  const totalDoctors = await prisma.user.count({
    where: {
      role: "DOCTOR",
    },
  });

  const totalPatients = await prisma.user.count({
    where: {
      role: "PATIENT",
    },
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Área administrativa
              </p>

              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                Gestão de Usuários
              </h1>

              <p className="mt-3 text-gray-600">
                Visualize usuários cadastrados e gerencie seus papéis na
                plataforma.
              </p>
            </div>

            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao Painel
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total de usuários</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalUsers}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Administradores</p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {totalAdmins}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Médicos</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {totalDoctors}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pacientes</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {totalPatients}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Buscar usuário
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Busque por nome ou e-mail.
                </p>
              </div>

              {searchTerm && (
                <p className="text-sm text-gray-500">
                  Resultado para:{" "}
                  <span className="font-semibold text-gray-800">
                    {searchTerm}
                  </span>
                </p>
              )}
            </div>

            <form
              action="/dashboard/admin/usuarios"
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                name="busca"
                defaultValue={searchTerm}
                placeholder="Buscar por nome ou e-mail"
                className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Buscar
              </button>

              {searchTerm && (
                <Link
                  href="/dashboard/admin/usuarios"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Limpar
                </Link>
              )}
            </form>
          </div>

          <div className="mt-10 grid gap-4">
            {users.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-gray-600">
                  Nenhum usuário encontrado para os critérios informados.
                </p>
              </div>
            )}

            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {user.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      E-mail: {user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Cadastrado em: {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <span
                      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getRoleClass(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {user.role !== "ADMIN" && (
                        <form action={updateUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value="ADMIN" />

                          <button
                            type="submit"
                            className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-200"
                          >
                            Tornar admin
                          </button>
                        </form>
                      )}

                      {user.role !== "PATIENT" && user.id !== userId && (
                        <form action={updateUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value="PATIENT" />

                          <button
                            type="submit"
                            className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-200"
                          >
                            Tornar paciente
                          </button>
                        </form>
                      )}

                      {user.role !== "DOCTOR" && (
                        <form action={updateUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value="DOCTOR" />

                          <button
                            type="submit"
                            className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-200"
                          >
                            Tornar médico
                          </button>
                        </form>
                      )}
                    </div>

                    {user.id === userId && (
                      <p className="text-xs text-gray-500">
                        Você está logado com este usuário.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}