"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createGoogleMeetForAppointment } from "@/lib/google-calendar";

const CONCILIACAO_PATH = "/dashboard/admin/financeiro/conciliacao";

function redirectWithError(error: string): never {
  redirect(`${CONCILIACAO_PATH}?erro=${error}`);
}

function redirectWithSuccess(success: string): never {
  redirect(`${CONCILIACAO_PATH}?success=${success}`);
}

function buildAppointmentDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
}

export async function recreateGoogleMeet(formData: FormData) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) redirect("/login");
  if (activeProfile !== "ADMIN") redirect("/");

  const paymentId = String(formData.get("paymentId") ?? "");

  if (!paymentId) {
    redirectWithError("pagamento-nao-informado");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      appointment: {
        include: {
          availability: true,
        },
      },
    },
  });

  if (!payment) {
    redirectWithError("pagamento-nao-encontrado");
  }

  if (!payment.appointment) {
    redirectWithError("consulta-nao-encontrada");
  }

  if (payment.appointment.meetingUrl) {
    redirectWithError("meet-ja-existe");
  }

  if (!payment.appointment.availability) {
    redirectWithError("horario-nao-encontrado");
  }

  const connection = await prisma.googleCalendarConnection.findFirst({
    where: {
      doctorId: payment.doctorId,
    },
  });

  if (!connection) {
    redirectWithError("google-nao-conectado");
  }

  const startDateTime = buildAppointmentDateTime(
    payment.appointment.date,
    payment.appointment.availability.startTime
  );

  const endDateTime = buildAppointmentDateTime(
    payment.appointment.date,
    payment.appointment.availability.endTime
  );

  try {
    const meet = await createGoogleMeetForAppointment({
      connection,
      summary: `Consulta CannaDoctor - ${payment.patient.user.name}`,
      description: `Consulta entre ${payment.patient.user.name} e Dr(a). ${payment.doctor.user.name}.`,
      startDateTime,
      endDateTime,
    });

    if (!meet.meetingUrl) {
      redirectWithError("meet-nao-gerado");
    }

    await prisma.appointment.update({
      where: {
        id: payment.appointment.id,
      },
      data: {
        meetingUrl: meet.meetingUrl,
        googleEventId: meet.googleEventId,
      },
    });

    await createAuditLog({
      userId,
      action: "RECREATE_GOOGLE_MEET",
      entity: "Appointment",
      entityId: payment.appointment.id,
      details: `Google Meet recriado pela conciliação financeira para o pagamento ${payment.id}.`,
    });

    revalidatePath(CONCILIACAO_PATH);
    revalidatePath(`/dashboard/admin/financeiro/${payment.id}`);

    redirectWithSuccess("meet-recriado");
  } catch (error) {
    console.error("Erro ao recriar Google Meet:", error);
    redirectWithError("erro-google-meet");
  }
}