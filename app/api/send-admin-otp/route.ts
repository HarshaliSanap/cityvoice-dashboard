import nodemailer from "nodemailer";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";

type AdminOtpPayload = {
  uid?: string;
  email?: string;
  idToken?: string;
  name?: string;
};

const getEnv = (key: string) => process.env[key]?.trim();

const getDatabaseUrl = () => getEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL")?.replace(/\/$/, "");

const hashOtp = (code: string, salt: string) => {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
};

const firebaseRequest = async (path: string, idToken: string, init?: RequestInit) => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) throw new Error("Firebase database URL is missing.");

  return fetch(`${databaseUrl}/${path}.json?auth=${encodeURIComponent(idToken)}`, init);
};

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

  const payload = (await request.json()) as AdminOtpPayload;
  const uid = payload.uid?.trim();
  const email = payload.email?.trim();
  const idToken = payload.idToken?.trim();
  const name = payload.name?.trim() || "Admin";

  if (!uid || !email || !idToken) {
    return Response.json({ error: "Admin user, email, and auth token are required." }, { status: 400 });
  }

  const profileResponse = await firebaseRequest(`admin_profiles/${uid}`, idToken);
  const profile = (await profileResponse.json()) as { email?: string; status?: string } | null;

  if (!profileResponse.ok || !profile || profile.status === "disabled" || profile.email !== email) {
    return Response.json({ error: "Unable to verify this admin account for OTP." }, { status: 403 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = randomBytes(16).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);

  const challengeResponse = await firebaseRequest(`admin_otp_challenges/${uid}`, idToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codeHash: hashOtp(code, salt),
      salt,
      email,
      status: "pending",
      attempts: 0,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }),
  });

  if (!challengeResponse.ok) {
    return Response.json({ error: "Unable to store OTP challenge." }, { status: 500 });
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

  const text = [
    `Hello ${name},`,
    "",
    "Use this OTP to verify your CityVoice admin login:",
    code,
    "",
    "This code expires in 10 minutes.",
    "If you did not request this login, please ignore this email and change your password.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">CityVoice Admin Verification</h2>
      <p>Hello ${name},</p>
      <p>Use this OTP to verify your CityVoice admin login.</p>
      <p style="display: inline-block; margin: 12px 0; padding: 12px 18px; border-radius: 10px; background: #eff6ff; color: #1d4ed8; font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
      <p style="color: #6b7280; font-size: 13px;">If you did not request this login, please ignore this email and change your password.</p>
    </div>
  `;

  await transporter.sendMail({
    from: getEnv("SMTP_FROM") || smtpUser,
    to: email,
    subject: "CityVoice admin OTP verification",
    text,
    html,
  });

  return Response.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
