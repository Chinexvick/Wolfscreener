import { connection, NextResponse } from "next/server";
import { getCategories } from "@/lib/live/coingecko";

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ data: await getCategories() }, { headers: { "cache-control": "public, s-maxage=300" } });
  } catch {
    return NextResponse.json({ data: null, unavailable: true }, { headers: { "cache-control": "no-store" } });
  }
}
