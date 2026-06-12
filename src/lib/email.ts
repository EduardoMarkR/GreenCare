import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "CannaDoctor <onboarding@resend.dev>";

export const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY não configurada. E-mail não enviado."
    );

    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(
        "Erro Resend ao enviar e-mail:",
        error
      );

      return false;
    }

    console.log(
      "E-mail enviado pelo Resend:",
      data
    );

    return true;
  } catch (error) {
    console.error(
      "Erro inesperado ao enviar e-mail:",
      error
    );

    return false;
  }
}