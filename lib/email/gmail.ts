import nodemailer from 'nodemailer'

const smtpHost = process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.GMAIL_SMTP_PORT || '465')
const smtpSecure = process.env.GMAIL_SMTP_SECURE
  ? process.env.GMAIL_SMTP_SECURE !== 'false'
  : smtpPort === 465
const smtpUser = process.env.GMAIL_SMTP_USER
const smtpPass = process.env.GMAIL_SMTP_PASS
const fromEmail = process.env.GMAIL_FROM_EMAIL || smtpUser || ''
const fromName = process.env.GMAIL_FROM_NAME || 'Equipe DigitalFlow'

export const hasGmailTransport = Boolean(smtpUser && smtpPass)

const transporter = hasGmailTransport
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser!,
        pass: smtpPass!,
      },
    })
  : null

type InviteEmailPayload = {
  to: string
  inviteUrl: string
  invitedName?: string
}

const buildInviteEmailHtml = ({ inviteUrl, invitedName }: { inviteUrl: string; invitedName?: string }) => {
  const greeting = invitedName ? `Olá, ${invitedName}!` : 'Olá!'
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0f172a;padding:32px 0;font-family:'Inter',Arial,sans-serif;color:#f8fafc;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#020617;padding:32px;border-radius:24px;border:1px solid rgba(148,163,184,0.15);text-align:left;">
            <tr>
              <td style="font-size:24px;font-weight:600;letter-spacing:-0.02em;padding-bottom:12px;">Convite para acessar o DigitalFlow</td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.6;padding-bottom:24px;">${greeting} Você foi convidado para acessar o painel do DigitalFlow. Clique no botão abaixo para concluir seu cadastro.</td>
            </tr>
            <tr>
              <td style="padding-bottom:32px;">
                <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#0f172a;font-weight:600;padding:14px 28px;border-radius:999px;text-decoration:none;">Aceitar convite</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;line-height:1.6;color:#94a3b8;">Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${inviteUrl}" style="color:#67e8f9;text-decoration:none;">${inviteUrl}</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export async function sendInviteEmail(payload: InviteEmailPayload) {
  if (!transporter) {
    throw new Error('Gmail SMTP não configurado corretamente.')
  }

  await transporter.sendMail({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    to: payload.to,
    subject: 'Você foi convidado para o DigitalFlow',
    html: buildInviteEmailHtml(payload),
    text: `Acesse o link para concluir seu cadastro: ${payload.inviteUrl}`,
  })
}

// Tipo para envio de automação de email
type AutomationEmailPayload = {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
}

/**
 * Envia um email de automação
 * Substitui variáveis como {{nome}} e {{email}} no conteúdo
 */
export async function sendAutomationEmail(payload: AutomationEmailPayload) {
  if (!transporter) {
    throw new Error('Gmail SMTP não configurado corretamente.')
  }

  await transporter.sendMail({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    to: payload.to,
    subject: payload.subject,
    html: payload.htmlContent,
    text: payload.textContent || payload.htmlContent.replace(/<[^>]*>/g, ''),
  })
}

/**
 * Processa variáveis de template em uma mensagem
 */
export function processTemplateVariables(
  template: string,
  variables: { nome?: string; email?: string; [key: string]: string | undefined }
): string {
  let processed = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'gi')
    processed = processed.replace(regex, value || '')
  })
  
  return processed
}
