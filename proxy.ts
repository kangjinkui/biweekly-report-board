import { NextResponse, type NextRequest } from "next/server";
import { checkIpAccess } from "@/lib/ip-access";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const access = checkIpAccess(request.headers);

  if (!access.allowed) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-client-ip": access.clientIp ?? "unknown",
        "x-block-reason": access.reason ?? "blocked",
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  if (access.clientIp) {
    requestHeaders.set("x-verified-client-ip", access.clientIp);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
}
