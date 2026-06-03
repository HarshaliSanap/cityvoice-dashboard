import nodemailer from "nodemailer";

export const runtime = "nodejs";

type AuthorityEmailPayload = {
  authorityEmail?: string;
  authorityName?: string;
  postCategory?: string;
  postDescription?: string;
  postImageUrl?: string;
  postLocation?: string;
  postReporter?: string;
  postTimestamp?: string;
};

const getEnv = (key: string) => process.env[key]?.trim();

export async function POST(request: Request) {
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const missingConfig = [
    ["SMTP_USER", smtpUser],
    ["SMTP_PASS", smtpPass],
  ].flatMap(([key, value]) => (value ? [] : [key]));

  if (missingConfig.length > 0) {
    return Response.json(
      {
        error: `Missing mail configuration in .env.local: ${missingConfig.join(", ")}`,
      },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as AuthorityEmailPayload;

  if (!payload.authorityEmail || !payload.postDescription) {
    return Response.json(
      { error: "Authority email and post description are required." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: getEnv("SMTP_HOST") || "smtp.gmail.com",
    port: Number(getEnv("SMTP_PORT") || 465),
    secure: getEnv("SMTP_SECURE") !== "false",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = `CityVoice report escalation: ${payload.postCategory || "Citizen Report"}`;
  const text = [
    `Hello ${payload.authorityName || "Authority"},`,
    "",
    "A CityVoice report has been escalated to your office.",
    "",
    `Category: ${payload.postCategory || "General"}`,
    `Location: ${payload.postLocation || "Not provided"}`,
    `Reporter: ${payload.postReporter || "Anonymous"}`,
    `Submitted: ${payload.postTimestamp || "Not available"}`,
    "",
    "Report:",
    payload.postDescription,
    "",
    payload.postImageUrl ? `Attachment/Image URL: ${payload.postImageUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">CityVoice Report Escalation</h2>
      <p>Hello ${payload.authorityName || "Authority"},</p>
      <p>A CityVoice report has been escalated to your office.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Category</td><td>${payload.postCategory || "General"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Location</td><td>${payload.postLocation || "Not provided"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Reporter</td><td>${payload.postReporter || "Anonymous"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: 700;">Submitted</td><td>${payload.postTimestamp || "Not available"}</td></tr>
      </table>
      <h3 style="margin: 16px 0 8px;">Report</h3>
      <p>${payload.postDescription}</p>
      ${
        payload.postImageUrl
          ? `<p><a href="${payload.postImageUrl}" target="_blank" rel="noreferrer">View attached image</a></p>`
          : ""
      }
    </div>
  `;

  await transporter.sendMail({
    from: getEnv("SMTP_FROM") || smtpUser,
    to: payload.authorityEmail,
    subject,
    text,
    html,
  });

  return Response.json({ ok: true });
}
