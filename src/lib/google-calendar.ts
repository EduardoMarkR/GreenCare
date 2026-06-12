import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

type GoogleCalendarConnection = {
  id: string;
  doctorId: string;
  googleEmail: string | null;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date | null;
};

type BusyInterval = {
  start: Date;
  end: Date;
};

type FreeSlot = {
  date: Date;
  startTime: string;
  endTime: string;
};

type ScheduleSettings = {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  workStartTime: string;
  workEndTime: string;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  slotDurationMinutes: number;
  intervalMinutes: number;
  daysToSync: number;
};

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais do Google Calendar não configuradas.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function getValidOAuthClient(connection: GoogleCalendarConnection) {
  const oauth2Client = getOAuthClient();

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.expiryDate?.getTime(),
  });

  const isExpired =
    !connection.expiryDate || connection.expiryDate.getTime() <= Date.now();

  if (isExpired) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Não foi possível renovar o token do Google Calendar.");
    }

    const updatedConnection = await prisma.googleCalendarConnection.update({
      where: {
        id: connection.id,
      },
      data: {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : connection.expiryDate,
      },
    });

    oauth2Client.setCredentials({
      access_token: updatedConnection.accessToken,
      refresh_token: updatedConnection.refreshToken,
      expiry_date: updatedConnection.expiryDate?.getTime(),
    });
  }

  return oauth2Client;
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function buildLocalDateTime(date: Date, time: string) {
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

function normalizeDateToUtcMidnight(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

function getAvailabilityDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getSlotKey(slot: {
  date: Date;
  startTime: string;
  endTime: string;
}) {
  return `${getAvailabilityDateKey(slot.date)}|${slot.startTime}|${slot.endTime}`;
}

function overlaps(slotStart: Date, slotEnd: Date, busy: BusyInterval[]) {
  return busy.some((interval) => {
    return slotStart < interval.end && slotEnd > interval.start;
  });
}

function isDayEnabled(date: Date, settings: ScheduleSettings) {
  const day = date.getUTCDay();

  if (day === 0) return settings.sunday;
  if (day === 1) return settings.monday;
  if (day === 2) return settings.tuesday;
  if (day === 3) return settings.wednesday;
  if (day === 4) return settings.thursday;
  if (day === 5) return settings.friday;
  if (day === 6) return settings.saturday;

  return false;
}

function overlapsLunch({
  slotStartMinutes,
  slotEndMinutes,
  lunchStartTime,
  lunchEndTime,
}: {
  slotStartMinutes: number;
  slotEndMinutes: number;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
}) {
  if (!lunchStartTime || !lunchEndTime) return false;

  const lunchStartMinutes = parseTimeToMinutes(lunchStartTime);
  const lunchEndMinutes = parseTimeToMinutes(lunchEndTime);

  return (
    slotStartMinutes < lunchEndMinutes && slotEndMinutes > lunchStartMinutes
  );
}

export async function getGoogleCalendarBusyIntervals({
  connection,
  startDate,
  endDate,
}: {
  connection: GoogleCalendarConnection;
  startDate: Date;
  endDate: Date;
}) {
  const auth = await getValidOAuthClient(connection);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [
        {
          id: "primary",
        },
      ],
    },
  });

  const busy =
    response.data.calendars?.primary?.busy?.map((item) => ({
      start: new Date(item.start ?? ""),
      end: new Date(item.end ?? ""),
    })) ?? [];

  return busy.filter((item) => {
    return (
      !Number.isNaN(item.start.getTime()) && !Number.isNaN(item.end.getTime())
    );
  });
}

export async function generateFreeSlotsFromGoogleCalendar({
  connection,
  startDate,
  settings,
}: {
  connection: GoogleCalendarConnection;
  startDate: Date;
  settings: ScheduleSettings;
}) {
  const normalizedStartDate = normalizeDateToUtcMidnight(startDate);

  const endDate = new Date(normalizedStartDate);
  endDate.setUTCDate(endDate.getUTCDate() + settings.daysToSync);

  const busyIntervals = await getGoogleCalendarBusyIntervals({
    connection,
    startDate: normalizedStartDate,
    endDate,
  });

  const freeSlots: FreeSlot[] = [];

  const startMinutes = parseTimeToMinutes(settings.workStartTime);
  const endMinutes = parseTimeToMinutes(settings.workEndTime);

  for (let dayIndex = 0; dayIndex < settings.daysToSync; dayIndex += 1) {
    const currentDate = new Date(normalizedStartDate);
    currentDate.setUTCDate(normalizedStartDate.getUTCDate() + dayIndex);

    if (!isDayEnabled(currentDate, settings)) {
      continue;
    }

    for (
      let currentMinutes = startMinutes;
      currentMinutes + settings.slotDurationMinutes <= endMinutes;
      currentMinutes += settings.slotDurationMinutes + settings.intervalMinutes
    ) {
      const slotStartMinutes = currentMinutes;
      const slotEndMinutes = currentMinutes + settings.slotDurationMinutes;

      if (
        overlapsLunch({
          slotStartMinutes,
          slotEndMinutes,
          lunchStartTime: settings.lunchStartTime,
          lunchEndTime: settings.lunchEndTime,
        })
      ) {
        continue;
      }

      const slotStartTime = minutesToTime(slotStartMinutes);
      const slotEndTime = minutesToTime(slotEndMinutes);

      const slotStart = buildLocalDateTime(currentDate, slotStartTime);
      const slotEnd = buildLocalDateTime(currentDate, slotEndTime);

      if (!overlaps(slotStart, slotEnd, busyIntervals)) {
        freeSlots.push({
          date: new Date(
            Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate()
            )
          ),
          startTime: slotStartTime,
          endTime: slotEndTime,
        });
      }
    }
  }

  return freeSlots;
}