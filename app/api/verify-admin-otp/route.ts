import { createHash, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

type VerifyOtpPayload = {
  code?: string;
  idToken?: string;
  uid?: string;
};

type OtpChallenge = {
  attempts?: number;
  codeHash?: string;
  expiresAt?: string;
  salt?: string;
};

const getEnv = (key: string) => process.env[key]?.trim();

const getDatabaseUrl = () => getEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL")?.replace(/\/$/, "");

const firebaseRequest = async (path: string, idToken: string, init?: RequestInit) => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) throw new Error("Firebase database URL is missing.");

  return fetch(`${databaseUrl}/${path}.json?auth=${encodeURIComponent(idToken)}`, init);
};

const hashOtp = (code: string, salt: string) => {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
};

const hashesMatch = (expectedHash: string, actualHash: string) => {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export async function POST(request: Request) {
  const payload = (await request.json()) as VerifyOtpPayload;
  const uid = payload.uid?.trim();
  const code = payload.code?.trim();
  const idToken = payload.idToken?.trim();

  if (!uid || !code || !idToken) {
    return Response.json({ error: "Admin user, OTP, and auth token are required." }, { status: 400 });
  }

  const challengeResponse = await firebaseRequest(`admin_otp_challenges/${uid}`, idToken);
  const challenge = (await challengeResponse.json()) as OtpChallenge | null;

  if (!challengeResponse.ok || !challenge) {
    return Response.json({ error: "OTP was not found. Please request a new code." }, { status: 404 });
  }

  const attempts = Number(challenge.attempts || 0);
  const expiresAt = challenge.expiresAt ? new Date(challenge.expiresAt).getTime() : 0;

  if (!challenge.codeHash || !challenge.salt || Date.now() > expiresAt) {
    await firebaseRequest(`admin_otp_challenges/${uid}`, idToken, { method: "DELETE" });
    return Response.json({ error: "OTP expired. Please request a new code." }, { status: 400 });
  }

  if (attempts >= 5) {
    await firebaseRequest(`admin_otp_challenges/${uid}`, idToken, { method: "DELETE" });
    return Response.json({ error: "Too many incorrect OTP attempts. Please request a new code." }, { status: 429 });
  }

  const actualHash = hashOtp(code, challenge.salt);
  if (!hashesMatch(challenge.codeHash, actualHash)) {
    await firebaseRequest(`admin_otp_challenges/${uid}`, idToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempts: attempts + 1, lastAttemptAt: new Date().toISOString() }),
    });
    return Response.json({ error: "Invalid OTP. Please check the code and try again." }, { status: 400 });
  }

  await firebaseRequest(`admin_otp_challenges/${uid}`, idToken, { method: "DELETE" });
  return Response.json({ ok: true });
}
