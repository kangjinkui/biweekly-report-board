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
  const response = loginCompleteResponse(request, redirectPath);
  response.cookies.set(
    SESSION_COOKIE_NAME,
    session.token,
    getSessionCookieOptions(session.expiresAt),
  );
  response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
  console.info("[auth] login accepted", {
    email: user.email,
    role: user.role,
    status: user.status,
    redirect: getAbsoluteUrl(request, redirectPath),
    cookieSecure: getSessionCookieOptions(session.expiresAt).secure,
  });

  return response;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(getAbsoluteUrl(request, path), 303);
}

function loginCompleteResponse(request: NextRequest, path: string) {
  const url = getAbsoluteUrl(request, path);
  return new NextResponse(
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>로그인 완료</title>
  </head>
  <body>
    <p>로그인 완료</p>
    <p><a href="${escapeHtml(url)}">계속</a></p>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
