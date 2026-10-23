import { BadgeCheck, Flame } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, LpBadge, PageHeader, PromotedTag, ScoreRing, TokenAvatar, cx } from "@/components/ui";
import { tokenById } from "@/lib/data";
import { projects } from "@/lib/data";
import { num } from "@/lib/format";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        icon={<Flame className="size-7 text-down" />}
        title="WOLF Projects"
        subtitle="Project profiles with verification that clearly states what was checked. Verification is not a guarantee of any project or token."
      >
        <Link href="/developer" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white">
          List your project
        </Link>
      </PageHeader>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const t = tokenById(p.tokenId)!;
          const done = p.verifications.filter((v) => v.done).length;
          return (
            <Card key={p.tokenId} className="p-4">
              <div id={t.id} className="flex items-center gap-3">
                <TokenAvatar token={t} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/token/${t.id}?tab=project`} className="-my-1 inline-block py-1 font-display font-bold hover:underline">
                      {t.name}
                    </Link>
                    {done === 5 && <BadgeCheck className="size-4 text-accent" />}
                    {t.promoted && <PromotedTag />}
                  </div>
                  <div className="text-xs text-muted">
                    ${t.symbol} · {t.narrative} · {num(p.followers)} followers
                  </div>
                </div>
                <ScoreRing score={t.auditScore} size={38} />
              </div>
              <p className="mt-3 text-sm text-muted">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.verifications.map((v) => (
                  <span key={v.label} className={cx("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", v.done ? "bg-up-soft text-up" : "bg-surface-3 text-muted")}>
                    {v.done ? "✓" : "○"} {v.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <LpBadge status={t.lp} />
                <Link href={`/token/${t.id}`} className="text-xs font-semibold text-accent">
                  View intelligence →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
