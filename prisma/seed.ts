import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const UserRole = {
  DOCTOR: "DOCTOR",
} as const;

async function main() {
  console.log("Iniciando seed...");

  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const doctorUser1 = await prisma.user.create({
    data: {
      name: "Dra. Ana Oliveira",
      email: "ana.oliveira@greencare.com",
      password: "senha-temporaria",
      role: UserRole.DOCTOR,
      doctor: {
        create: {
          crm: "123456",
          crmUf: "SP",
          specialty: "Neurologia",
          bio: "Especialista em neurologia e cannabis medicinal.",
          price: 250,
          telemedicine: true,
          approved: true,
        },
      },
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      name: "Dr. Carlos Santos",
      email: "carlos.santos@greencare.com",
      password: "senha-temporaria",
      role: UserRole.DOCTOR,
      doctor: {
        create: {
          crm: "654321",
          crmUf: "RJ",
          specialty: "Psiquiatria",
          bio: "Atuação em saúde mental, ansiedade, sono e cannabis medicinal.",
          price: 300,
          telemedicine: true,
          approved: true,
        },
      },
    },
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      name: "Dra. Mariana Costa",
      email: "mariana.costa@greencare.com",
      password: "senha-temporaria",
      role: UserRole.DOCTOR,
      doctor: {
        create: {
          crm: "789123",
          crmUf: "MG",
          specialty: "Clínica Geral",
          bio: "Clínica geral com foco em cuidado integral e terapias canabinoides.",
          price: 220,
          telemedicine: true,
          approved: true,
        },
      },
    },
  });

  console.log("Médicos criados:", {
    doctorUser1: doctorUser1.email,
    doctorUser2: doctorUser2.email,
    doctorUser3: doctorUser3.email,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed finalizado com sucesso.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });