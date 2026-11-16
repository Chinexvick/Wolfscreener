import { connection, NextResponse } from "next/server";
import { getWhales } from "@/lib/live/tokens";

export async function GET() {
  await connection();
  const moves = await getWhales();
  return NextResponse.json({ moves }, { headers: { "cache-control": "public, s-maxage=45, stale-while-revalidate=300" } });
}
