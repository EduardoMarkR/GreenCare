function baseEmailTemplate(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; background: #F7F4E7; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e5e0c8;">
        <h1 style="color: #08553F; margin-top: 0;">CannaDoctor</h1>
        ${content}
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 13px; color: #878787;">
          Esta é uma mensagem automática da plataforma CannaDoctor.
        </p>
      </div>
    </div>
  `;
}

export function newAppointmentDoctorEmail(params: {
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  dashboardUrl: string;
}) {
  return baseEmailTemplate(`
    <h2 style="color: #08553F;">Nova consulta agendada</h2>
    <p>Olá, Dr(a). ${params.doctorName}.</p>
    <p>Uma nova consulta foi agendada e aguarda sua confirmação.</p>

    <p><strong>Paciente:</strong> ${params.patientName}</p>
    <p><strong>Data:</strong> ${params.date}</p>
    <p><strong>Horário:</strong> ${params.time}</p>

    <p style="margin-top: 28px;">
      <a href="${params.dashboardUrl}" style="background: #08553F; color: #ffffff; padding: 14px 22px; border-radius: 14px; text-decoration: none; font-weight: bold;">
        Acessar painel médico
      </a>
    </p>
  `);
}

export function appointmentConfirmedPatientEmail(params: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  meetUrl?: string | null;
  dashboardUrl: string;
}) {
  return baseEmailTemplate(`
    <h2 style="color: #08553F;">Sua consulta foi confirmada</h2>
    <p>Olá, ${params.patientName}.</p>
    <p>Sua consulta foi confirmada pelo médico.</p>

    <p><strong>Médico:</strong> Dr(a). ${params.doctorName}</p>
    <p><strong>Data:</strong> ${params.date}</p>
    <p><strong>Horário:</strong> ${params.time}</p>

    ${
      params.meetUrl
        ? `<p><strong>Link da consulta:</strong><br/><a href="${params.meetUrl}">${params.meetUrl}</a></p>`
        : `<p>O link da consulta estará disponível no painel quando for gerado.</p>`
    }

    <p style="margin-top: 28px;">
      <a href="${params.dashboardUrl}" style="background: #08553F; color: #ffffff; padding: 14px 22px; border-radius: 14px; text-decoration: none; font-weight: bold;">
        Acessar minha consulta
      </a>
    </p>
  `);
}

export function appointmentCancelledEmail(params: {
  title: string;
  name: string;
  message: string;
  date: string;
  time: string;
  dashboardUrl: string;
}) {
  return baseEmailTemplate(`
    <h2 style="color: #08553F;">${params.title}</h2>
    <p>Olá, ${params.name}.</p>
    <p>${params.message}</p>

    <p><strong>Data:</strong> ${params.date}</p>
    <p><strong>Horário:</strong> ${params.time}</p>

    <p style="margin-top: 28px;">
      <a href="${params.dashboardUrl}" style="background: #08553F; color: #ffffff; padding: 14px 22px; border-radius: 14px; text-decoration: none; font-weight: bold;">
        Acessar painel
      </a>
    </p>
  `);
}