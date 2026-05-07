import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "biweekly-report-board",
    checkedAt: new Date().toISOString(),
  });
}
