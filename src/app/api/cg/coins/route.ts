import { connection, NextResponse, type NextRequest } from "next/server";
import { getTopCoins } from "@/lib/live/coingecko";

export async function GET(req: NextRequest) {
  await connection();
  const category = (req.nextUrl.searchParams.get("category") ?? "").replace(/[^a-z0-9-]/g, "").slice(0, 60);
  const page = Math.max(1, Math.min(5, Number(req.nextUrl.searchParams.get("page") ?? 1) || 1));
  try {
    return NextResponse.json({ data: await getTopCoins(category, page) }, { headers: { "cache-control": "public, s-maxage=120" } });
  } catch {
    return NextResponse.json({ data: null, unavailable: true }, { headers: { "cache-control": "no-store" } });
  }
}
