export type EmailMessage = { to: string; subject: string; html: string; text: string };

/** Transactional email adapter. Keyless environments intentionally record a no-op. */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { sent: false };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }) });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`);
  const payload = await response.json() as { id?: string };
  return { sent: true, id: payload.id };
}
