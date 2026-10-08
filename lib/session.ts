import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ecotool_admin";
const SESSION_SECONDS = 60 * 60 * 12;

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function credentialsAreConfigured() {
  return Boolean(process.env.ADMIN_EMAIL?.trim() && (process.env.ADMIN_PASSWORD?.length ?? 0) >= 12 && (process.env.SESSION_SECRET?.length ?? 0) >= 32);
}

export function isDefaultProductionPassword() {
  return process.env.NODE_ENV === "production" &&
    (process.env.ADMIN_EMAIL === "admin@ecotool.local" || process.env.ADMIN_PASSWORD === "EcoTool-demo-2026!");
}

export function matchesAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  const emailMatches = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordMatches = safeEqual(password, expectedPassword);
  return emailMatches && passwordMatches;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function createAdminSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin:${expires}`;
  const value = `${Buffer.from(payload).toString("base64url")}.${signature(payload, secret)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

export async function isAdmin() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [encoded, suppliedSignature] = value.split(".");
  if (!encoded || !suppliedSignature) return false;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expected = signature(payload, secret);
  if (!safeEqual(suppliedSignature, expected)) return false;
  const match = /^admin:(\d+)$/.exec(payload);
  return Boolean(match && Number(match[1]) > Math.floor(Date.now() / 1000));
}
