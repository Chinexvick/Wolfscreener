import { connection, NextResponse } from "next/server";
import { getNativePrices } from "@/lib/live/coingecko";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ data: await getNativePrices() }, { headers: { "cache-control": "public, s-maxage=60" } });
  } catch {
    return NextResponse.json({ data: null, unavailable: true }, { headers: { "cache-control": "no-store" } });
  }
}
