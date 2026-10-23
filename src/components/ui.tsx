import Link from "next/link";
import { BadgeCheck, Flame, Lock, Unlock, CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { chainById, type ChainId, type Confidence, type LpStatus, type Risk, type Token } from "@/lib/data";
import { pct } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function TokenAvatar({ token, size = 36 }: { token: Pick<Token, "symbol" | "hue">; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-bold text-white ring-2 ring-surface"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(135deg, hsl(${token.hue} 70% 55%), hsl(${(token.hue + 40) % 360} 65% 38%))`,
      }}
      aria-hidden
    >
      {token.symbol.slice(0, 2)}
    </span>
  );
}

export function ChainDot({ chain, label = false }: { chain: ChainId; label?: boolean }) {
  const c = chainById[chain];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-2 rounded-full" style={{ background: c.color }} />
      {label && c.short}
    </span>
  );
}

export function Change({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cx("tabular font-semibold", value >= 0 ? "text-up" : "text-down", className)}>{pct(value)}</span>
  );
}

const riskStyle: Record<Risk, string> = {
  Low: "bg-up-soft text-up",
  Medium: "bg-warn-soft text-warn",
  High: "bg-down-soft text-down",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", riskStyle[risk])}>{risk}</span>
  );
}

export function scoreColor(score: number) {
  return score >= 72 ? "var(--up)" : score >= 52 ? "var(--warn)" : "var(--down)";
}

export function ScoreRing({ score, size = 36, stroke = 3.5, label }: { score: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center leading-none">
        <span className="tabular font-display font-bold" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
        {label && <span className="sr-only">{label}</span>}
      </span>
    </span>
  );
}

export function Sparkline({ data, up, width = 96, height = 28 }: { data: number[]; up?: boolean; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / (max - min || 1)) * (height - 4) - 2}`);
  const rising = up ?? data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={rising ? "var(--up)" : "var(--down)"} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={cx("size-4 shrink-0 text-accent", className)} aria-label="Verified" />;
}

export function PromotedTag() {
  return (
    <span className="rounded-md border border-brand/60 bg-brand-soft px-1.5 py-px text-[10px] font-bold tracking-wide text-brand-ink">
      PROMOTED
    </span>
  );
}

const lpStyle: Record<LpStatus, [string, ReactNode]> = {
  LOCKED: ["bg-up-soft text-up", <Lock key="l" className="size-3" />],
  BURNED: ["bg-accent-soft text-accent", <Flame key="b" className="size-3" />],
  UNLOCKED: ["bg-down-soft text-down", <Unlock key="u" className="size-3" />],
  UNKNOWN: ["bg-surface-3 text-muted", <CircleHelp key="q" className="size-3" />],
};

export function LpBadge({ status }: { status: LpStatus }) {
  const [cls, icon] = lpStyle[status];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", cls)}>
      {icon} LP {status}
    </span>
  );
}

export function ConfidenceTag({ c }: { c: Confidence }) {
  return (
    <span
      className={cx(
        "rounded px-1.5 py-px text-[10px] font-bold tracking-wide",
        c === "CONFIRMED" ? "bg-up-soft text-up" : "border border-dashed border-warn text-warn",
      )}
      title={c === "CONFIRMED" ? "Ownership confirmed by on-chain evidence" : "Possible association inferred from funding/transfer patterns"}
    >
      {c}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("card", className)}>{children}</section>;
}

export function CardHeader({ icon, title, action, href }: { icon?: ReactNode; title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
      <h2 className="flex items-center gap-2 font-display text-[15px] font-bold">
        {icon}
        {title}
      </h2>
      {action && href && (
        <Link href={href} className="text-xs font-semibold text-accent hover:underline">
          {action} →
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {icon}
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "up" | "down" }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className="tabular truncate font-display text-base font-bold sm:text-lg">{value}</div>
      {sub && <div className={cx("text-xs font-semibold", tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-muted")}>{sub}</div>}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
        active ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink hover:border-brand/60",
      )}
    >
      {children}
    </button>
  );
}

export function Bar({ value, color = "var(--accent)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

export function DemoNote() {
  return (
    <p className="mt-6 text-center text-[11px] text-muted">
      Informational intelligence only — not financial advice. WOLF Screener does not execute trades.
    </p>
  );
}
