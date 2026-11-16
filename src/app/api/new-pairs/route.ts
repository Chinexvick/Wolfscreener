import { connection, NextResponse } from "next/server";
import { getNewPairs } from "@/lib/live/tokens";

export async function GET() {
  await connection();
  const m = await getNewPairs();
  return NextResponse.json(m, { headers: { "cache-control": "public, s-maxage=45, stale-while-revalidate=300" } });
}
