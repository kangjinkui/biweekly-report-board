import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const url = getAbsoluteUrl(request, "/api/debug/cookie-check");
  const response = new NextResponse(
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>쿠키 테스트</title>
  </head>
  <body>
    <p>쿠키 테스트 값을 저장했습니다.</p>
    <p><a href="${escapeHtml(url)}">쿠키 확인</a></p>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );

  response.cookies.set("cookie_probe", "ok", {
    path: "/",
    sameSite: "lax",
    maxAge: 300,
  });
  response.cookies.set("cookie_probe_http_only", "ok", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 300,
  });

  return response;
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
