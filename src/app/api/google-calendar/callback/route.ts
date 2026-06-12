import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
};

async function getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais do Google Calendar não configuradas.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || data.error) {
    throw new Error(
      data.error_description || data.error || "Erro ao autenticar Google."
    );
  }

  return data;
}

async function getGoogleEmail(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GoogleUserInfoResponse;

  return data.email ?? null;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const activeProfile = cookieStore.get("activeProfile")?.value;

  if (!userId) {
    redirect("/login");
  }

  if (activeProfile !== "DOCTOR") {
    redirect("/");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const doctorIdFromState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    redirect(
      `/dashboard/medico?erro=${encodeURIComponent(
        "Conexão com Google Agenda cancelada ou negada."
      )}`
    );
  }

  if (!code || !doctorIdFromState) {
    redirect(
      `/dashboard/medico?erro=${encodeURIComponent(
        "Retorno inválido do Google Agenda."
      )}`
    );
  }

  const doctor = await prisma.doctor.findFirst({
    where: {
      id: doctorIdFromState,
      userId,
      approvalStatus: "APPROVED",
    },
  });

  if (!doctor) {
    redirect(
      `/dashboard/medico?erro=${encodeURIComponent(
        "Médico não encontrado ou sem permissão."
      )}`
    );
  }

  try {
    const tokens = await getGoogleTokens(code);

    if (!tokens.access_token) {
      redirect(
        `/dashboard/medico?erro=${encodeURIComponent(
          "Token de acesso do Google não retornado."
        )}`
      );
    }

    const googleEmail = await getGoogleEmail(tokens.access_token);

    const existingConnection =
      await prisma.googleCalendarConnection.findUnique({
        where: {
          doctorId: doctor.id,
        },
      });

    const refreshToken =
      tokens.refresh_token ?? existingConnection?.refreshToken;

    if (!refreshToken) {
      redirect(
        `/dashboard/medico?erro=${encodeURIComponent(
          "Token de atualização não retornado. Remova o acesso do app na sua Conta Google e tente conectar novamente."
        )}`
      );
    }

    const expiryDate = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await prisma.googleCalendarConnection.upsert({
      where: {
        doctorId: doctor.id,
      },
      update: {
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken,
        expiryDate,
      },
      create: {
        doctorId: doctor.id,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken,
        expiryDate,
      },
    });

    redirect("/dashboard/medico?googleCalendar=connected");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao conectar Google Agenda.";

    redirect(`/dashboard/medico?erro=${encodeURIComponent(message)}`);
  }
}