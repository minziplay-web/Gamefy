import { NextResponse } from "next/server";

import { maybeAutoCreateDailyRun } from "@/lib/firebase/daily-auto-create";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleDailyRollover(request);
}

export async function POST(request: Request) {
  return handleDailyRollover(request);
}

async function handleDailyRollover(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await maybeAutoCreateDailyRun(new Date(), { force });
    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      force,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message
        : "Auto-Daily fehlgeschlagen.";
    console.error("[daily-rollover]", message, error);
    return NextResponse.json(
      {
        ok: false,
        checkedAt: new Date().toISOString(),
        force,
        error: message,
      },
      { status: 500 },
    );
  }
}
