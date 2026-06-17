import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, LEGACY_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const user = await getCurrentUser();
  const sessionCookie =
    cookieStore.get(SESSION_COOKIE_NAME) ?? cookieStore.get(LEGACY_SESSION_COOKIE_NAME);
  const loginProbeCookie = cookieStore.get("login_cookie_probe");

  return NextResponse.json({
    authenticated: Boolean(user),
    hasSessionCookie: Boolean(sessionCookie?.value),
    sessionCookieLength: sessionCookie?.value.length ?? 0,
    hasLoginProbeCookie: Boolean(loginProbeCookie?.value),
    allCookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    user: user
      ? {
          email: user.email,
          role: user.role,
          status: user.status,
          teamId: user.teamId,
          teamName: user.team?.name ?? null,
          departmentName: user.team?.departmentName ?? null,
        }
      : null,
  });
}
