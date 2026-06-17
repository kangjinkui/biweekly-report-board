import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return NextResponse.json({
    probeCookie: cookieStore.get("cookie_probe")?.value ?? null,
    allCookieNames: cookieStore.getAll().map((cookie) => cookie.name),
    cookieHeaderLength: headerStore.get("cookie")?.length ?? 0,
    host: headerStore.get("host"),
  });
}
