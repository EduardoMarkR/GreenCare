import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

type CreateGoogleMeetEventParams = {
  appointmentId: string;
};

function getDatePart(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function createGoogleMeetEvent({
  appointmentId,
}: CreateGoogleMeetEventParams) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      availability: true,
      doctor: {
        include: {
          user: true,
          googleCalendarConnection: true,
        },
      },
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error("Consulta não encontrada.");
  }

  if (!appointment.availability) {
    throw new Error("Disponibilidade da consulta não encontrada.");
  }

  const connection = appointment.doctor.googleCalendarConnection;

  if (!connection) {
    throw new Error("Médico não conectou a Google Agenda.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.expiryDate?.getTime(),
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const datePart = getDatePart(appointment.availability.date);

  const startDateTime = `${datePart}T${appointment.availability.startTime}:00-03:00`;
  const endDateTime = `${datePart}T${appointment.availability.endTime}:00-03:00`;

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Consulta CannaDoctor - ${appointment.patient.user.name}`,
      description: `Consulta online entre ${appointment.doctor.user.name} e ${appointment.patient.user.name}.`,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Sao_Paulo",
      },
      conferenceData: {
        createRequest: {
          requestId: appointment.id,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  const googleEventId = event.data.id;
  const meetingUrl =
    event.data.hangoutLink ||
    event.data.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === "video"
    )?.uri;

  if (!googleEventId || !meetingUrl) {
    throw new Error("Não foi possível gerar o Google Meet.");
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      googleEventId,
      meetingUrl,
    },
  });

  return {
    googleEventId,
    meetingUrl,
  };
}