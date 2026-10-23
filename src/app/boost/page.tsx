import { Check, Megaphone, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, cx } from "@/components/ui";
import { boostPackages } from "@/lib/data";

export const metadata: Metadata = { title: "WOLF Boost" };

const products = [
  "Featured Token",
  "Featured Project",
  "Trending Sponsorship",
  "New Project Promotion",
  "Narrative Promotion",
  "Sponsored Announcement",
  "Banner Advertising",
  "Profile Promotion",
  "Launch Campaign",
  "Community Campaign",
];

const never = ["WOLF Audit Score", "Risk Score", "Contract analysis", "Security findings", "Organic data rankings", "Holder data", "Liquidity data"];

export default function BoostPage() {
  return (
    <>
      <PageHeader
        icon={<Megaphone className="size-7 text-brand" />}
        title="WOLF Boost"
        subtitle="Paid visibility for projects. Every paid placement is labeled PROMOTED or SPONSORED."
      />

      <Card className="mb-4 overflow-hidden sm:mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2">
          <div className="bg-gradient-to-br from-[#5b21b6] to-[#0b0712] p-5 text-white sm:p-6">
            <ShieldCheck className="size-8 text-violet-300" />
            <h2 className="mt-2 font-display text-2xl font-extrabold">The audit cannot be bought. Visibility can.</h2>
            <p className="mt-2 text-sm text-white/80">A project cannot pay to make a risky token look safe. Boost buys exposure — nothing else.</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="mb-2 text-xs font-bold text-muted uppercase">Paying for Boost never changes</div>
            <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {never.map((n) => (
                <li key={n} className="flex items-center gap-2">
                  <X className="size-4 text-down" /> {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {boostPackages.map((p) => (
          <Card key={p.name} className={cx("relative flex flex-col p-5", p.popular && "border-brand ring-2 ring-brand/40")}>
            {p.popular && <span className="absolute -top-3 left-5 rounded-full bg-brand px-3 py-0.5 text-[11px] font-bold text-white">Most popular</span>}
            <h3 className="font-display text-xl font-extrabold">{p.name}</h3>
            <p className="text-sm text-muted">{p.blurb}</p>
            <div className="my-4 font-display text-2xl font-bold">Contact for pricing</div>
            <ul className="flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-up" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/developer" className={cx("mt-5 rounded-xl py-2.5 text-center text-sm font-bold", p.popular ? "bg-brand text-white" : "border border-line")}>
              Choose {p.name}
            </Link>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5 sm:mt-6">
        <h2 className="font-display text-[15px] font-bold">Promotion products</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {products.map((p) => (
            <span key={p} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold">
              {p}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
