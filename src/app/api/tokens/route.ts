import { connection, NextResponse } from "next/server";
import { getMarket } from "@/lib/live/tokens";

export async function GET() {
  await connection();
  const m = await getMarket();
  return NextResponse.json(m, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
