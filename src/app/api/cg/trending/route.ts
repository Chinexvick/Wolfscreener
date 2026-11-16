import { connection, NextResponse } from "next/server";
import { getTrending } from "@/lib/live/coingecko";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ data: await getTrending() }, { headers: { "cache-control": "public, s-maxage=120" } });
  } catch {
    return NextResponse.json({ data: null, unavailable: true }, { headers: { "cache-control": "no-store" } });
  }
}
