import { Resend } from "resend";

type LeadEmailArgs = {
  to: string;
  agentName: string;
  buyerName: string;
  recommendation: string;
  score: number;
  detailUrl: string;
};

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  if (!process.env.RESEND_API_KEY) {
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendLeadScoredEmail({
  to,
  agentName,
  buyerName,
  recommendation,
  score,
  detailUrl
}: LeadEmailArgs) {
  const client = getResendClient();
  if (!client) {
    return {
      queued: false
    };
  }

  await client.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "ShowReady <hello@showready.local>",
    to,
    subject: `${buyerName} is ${recommendation.toUpperCase()} (${score.toFixed(2)})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="font-family: 'Times New Roman', serif; font-size: 28px;">A new lead is ready</h2>
        <p>${agentName}, ${buyerName} just completed their intake.</p>
        <p><strong>Recommendation:</strong> ${recommendation.toUpperCase()}</p>
        <p><strong>Score:</strong> ${score.toFixed(2)}</p>
        <p><a href="${detailUrl}" style="color: #0f766e;">Open lead detail</a></p>
      </div>
    `
  });

  return {
    queued: true
  };
}

export async function queuePushNotification() {
  return {
    queued: false
  };
}
