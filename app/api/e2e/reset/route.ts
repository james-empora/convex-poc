import { NextResponse } from "next/server";
import { isE2ETestMode } from "@/lib/e2e/mode";

/**
 * POST /api/e2e/reset
 *
 * Called by preparePage() before each Playwright test.
 * The E2E database is seeded once at startup; individual tests
 * that mutate data can call this to re-seed if needed in the future.
 */
export async function POST() {
  if (!isE2ETestMode()) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
