"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { TokenTable } from "@/components/TokenTable";
import { PageHeader } from "@/components/ui";
import { tokens } from "@/lib/data";
import { useWatchlist } from "@/lib/watchlist";

export default function WatchlistPage() {
  const { ids } = useWatchlist();
  const list = tokens.filter((t) => ids.includes(t.id));
  return (
    <>
      <PageHeader
        icon={<Star className="size-7 fill-brand text-brand" />}
        title="Watchlist"
        subtitle="Tokens you follow. Your watchlist powers personalized alerts and your WOLF AI Daily Brief."
      />
      {list.length ? (
        <TokenTable source={list} tabs={["wolf", "gainers", "volume"]} defaultTab="wolf" showPromoted={false} />
      ) : (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Star className="size-10 text-brand" />
          <p className="max-w-sm text-sm text-muted">Tap the star on any token to follow it. You can also follow wallets, projects and narratives.</p>
          <Link href="/screener" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">
            Find tokens
          </Link>
        </div>
      )}
    </>
  );
}
