import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const UserRole = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
} as const;

async function main() {
  console.log("Iniciando seed...");

  const defaultPassword = await bcrypt.hash("senha-temporaria", 10);
  const patientPassword = await bcrypt.hash("123456", 10);

  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      name: "Administrador GreenCare",
      email: "admin@greencare.com",
      password: defaultPassword,
      role: UserRole.ADMIN,
    },
  });

  const doctorUser1 = await prisma.user.create({
    data: {
      name: "Dra. Ana Oliveira",
      email: "ana.oliveira@greencare.com",
      password: defaultPassword,
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
          approvalStatus: "APPROVED",
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      name: "Dr. Carlos Santos",
      email: "carlos.santos@greencare.com",
      password: defaultPassword,
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
          approvalStatus: "APPROVED",
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  const doctorUser3 = await prisma.user.create({
    data: {
      name: "Dra. Mariana Costa",
      email: "mariana.costa@greencare.com",
      password: defaultPassword,
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
          approvalStatus: "APPROVED",
        },
      },
    },
    include: {
      doctor: true,
    },
  });

  const patientUser = await prisma.user.create({
    data: {
      name: "Paciente Teste",
      email: "paciente@greencare.com",
      password: patientPassword,
      role: UserRole.PATIENT,
      patient: {
        create: {
          phone: "(11) 99999-9999",
          birthDate: new Date("1995-01-01T12:00:00"),
        },
      },
    },
    include: {
      patient: true,
    },
  });

  const doctors = await prisma.doctor.findMany();

  for (const doctor of doctors) {
    await prisma.availability.createMany({
      data: [
        {
          doctorId: doctor.id,
          date: new Date("2026-06-10T12:00:00"),
          startTime: "09:00",
          endTime: "10:00",
        },
        {
          doctorId: doctor.id,
          date: new Date("2026-06-10T12:00:00"),
          startTime: "14:00",
          endTime: "15:00",
        },
        {
          doctorId: doctor.id,
          date: new Date("2026-06-11T12:00:00"),
          startTime: "10:00",
          endTime: "11:00",
        },
      ],
    });
  }

  if (
    !patientUser.patient ||
    !doctorUser1.doctor ||
    !doctorUser2.doctor ||
    !doctorUser3.doctor
  ) {
    throw new Error("Erro ao criar dados relacionados do seed.");
  }

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patientUser.patient.id,
        doctorId: doctorUser1.doctor.id,
        date: new Date("2026-06-12T12:00:00"),
        status: "PENDING",
        notes: "Consulta inicial para avaliação.",
      },
      {
        patientId: patientUser.patient.id,
        doctorId: doctorUser2.doctor.id,
        date: new Date("2026-06-13T12:00:00"),
        status: "CONFIRMED",
        notes: "Retorno para acompanhamento.",
      },
      {
        patientId: patientUser.patient.id,
        doctorId: doctorUser3.doctor.id,
        date: new Date("2026-06-14T12:00:00"),
        status: "COMPLETED",
        notes: "Consulta concluída de teste.",
      },
    ],
  });

  console.log("Administrador criado:", adminUser.email);
  console.log("Paciente criado:", patientUser.email);

  console.log("Médicos criados:", {
    doctorUser1: doctorUser1.email,
    doctorUser2: doctorUser2.email,
    doctorUser3: doctorUser3.email,
  });

  console.log("Horários criados com sucesso.");
  console.log("Consultas de teste criadas com sucesso.");
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