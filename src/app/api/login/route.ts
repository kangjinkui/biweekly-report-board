import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  getSessionCookieOptions,
  LEGACY_SESSION_COOKIE_NAME,
  normalizeEmail,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    console.info("[auth] login rejected: invalid form");
    return redirectTo(request, "/login?error=invalid");
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizeEmail(parsed.data.email) },
  });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    console.info("[auth] login rejected: bad credentials", {
      email: normalizeEmail(parsed.data.email),
      hasUser: Boolean(user),
    });
    return redirectTo(request, "/login?error=invalid");
  }

  const session = await createSessionToken(user.id);
  const redirectPath = user.role === "team_user" ? "/my" : "/admin";
  const response = redirectTo(request, redirectPath);
  response.cookies.set(
    SESSION_COOKIE_NAME,
    session.token,
    getSessionCookieOptions(session.expiresAt, isSecureRequest(request)),
  );
  response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
  console.info("[auth] login accepted", {
    email: user.email,
    role: user.role,
    status: user.status,
    redirect: getAbsoluteUrl(request, redirectPath),
    cookieSecure: getSessionCookieOptions(session.expiresAt, isSecureRequest(request)).secure,
  });

  return response;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(getAbsoluteUrl(request, path), 303);
}

function getAbsoluteUrl(request: NextRequest, path: string) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "") ??
    "http";

  return `${protocol}://${host}${path}`;
}

function isSecureRequest(request: NextRequest) {
  if (process.env.SESSION_COOKIE_SECURE === "true") return true;
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto === "https";

  return request.nextUrl.protocol === "https:";
}
