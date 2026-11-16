import { connection, NextResponse, type NextRequest } from "next/server";
import { searchTokens } from "@/lib/live/tokens";

export async function GET(req: NextRequest) {
  await connection();
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const tokens = await searchTokens(q.slice(0, 80));
    return NextResponse.json({ tokens }, { headers: { "cache-control": "public, s-maxage=60" } });
  } catch {
    // Upstream is rate limited or down: tell the client so it can retry instead of showing "not found".
    return NextResponse.json({ tokens: [], unavailable: true }, { headers: { "cache-control": "no-store" } });
  }
}
