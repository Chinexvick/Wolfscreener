"use client";

import { Bookmark, Copy, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Donut } from "@/components/charts";
import { Card, CardHeader, Stat, TokenAvatar, cx } from "@/components/ui";
import { chainById, chains, hashString, rng, smartWallets, tokens } from "@/lib/data";
import { num, price, shortAddr, usd } from "@/lib/format";

const palette = ["#7c3aed", "#c4b5fd", "#0052ff", "#9945ff", "#e5484d", "#12a150", "#d99100", "#6b7266"];
const STORE = "wolf-saved-wallets";

export function WalletClient() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("address") ?? "";
  const [input, setInput] = useState(q);
  const [saved, setSaved] = useState<{ addr: string; name: string }[]>([]);
  const [nick, setNick] = useState("");

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(JSON.parse(localStorage.getItem(STORE) ?? "[]"));
    } catch {}
  }, []);

  const data = useMemo(() => {
    if (!q) return null;
    const known = smartWallets.find((w) => w.label.toLowerCase() === q.toLowerCase());
    const r = rng(hashString(q));
    const address = known?.address ?? (q.startsWith("@") ? "0x" + hashString(q).toString(16).padEnd(40, "0") : q);
    const holdings = [...tokens]
      .sort(() => r() - 0.5)
      .slice(0, 7)
      .map((t) => {
        const value = 2_000 + Math.pow(r(), 2) * 400_000;
        const pnl = (r() - 0.35) * value;
        return { t, value, pnl, entry: t.price * (1 - pnl / value) };
      })
      .sort((a, b) => b.value - a.value);
    const total = holdings.reduce((a, h) => a + h.value, 0);
    const byChain = chains
      .map((c) => ({ label: c.name, pct: +((holdings.filter((h) => h.t.chain === c.id).reduce((a, h) => a + h.value, 0) / total) * 100).toFixed(1), color: c.color }))
      .filter((c) => c.pct > 0);
    const txs = Array.from({ length: 8 }, (_, i) => {
      const h = holdings[Math.floor(r() * holdings.length)];
      return { side: r() > 0.45 ? "Received" : "Sent", t: h.t, usd: Math.round(500 + r() * 60_000), when: `${1 + i * 5}h ago` };
    });
    const activity = Array.from({ length: 24 }, () => r());
    return { label: known?.label ?? (q.startsWith("@") ? q : null), address, holdings, total, byChain, txs, activity, ageDays: Math.round(30 + r() * 1500) };
  }, [q]);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) router.push(`/wallet?address=${encodeURIComponent(input.trim())}`);
  };

  const save = () => {
    if (!data) return;
    const next = [...saved.filter((s) => s.addr !== q), { addr: q, name: nick.trim() || data.label || shortAddr(data.address) }];
    setSaved(next);
    setNick("");
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <form onSubmit={go} className="card flex flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Wallet address or @label (e.g. @WolfAlpha)"
            className="h-12 w-full rounded-xl border border-line bg-surface-2 pr-3 pl-10 font-mono text-sm outline-none focus:border-brand"
          />
        </div>
        <button type="submit" className="h-12 rounded-xl bg-brand px-6 text-sm font-bold text-white">
          Analyze wallet
        </button>
      </form>

      {saved.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {saved.map((s) => (
            <Link key={s.addr} href={`/wallet?address=${encodeURIComponent(s.addr)}`} className="shrink-0 rounded-full border border-brand/60 bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand-ink">
              ★ {s.name}
            </Link>
          ))}
        </div>
      )}

      {!data && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-4">
          {smartWallets.slice(0, 4).map((w) => (
            <Link key={w.label} href={`/wallet?address=${encodeURIComponent(w.label)}`} className="card p-4 hover:border-brand/60">
              <div className="font-display font-bold text-accent">{w.label}</div>
              <div className="font-mono text-[11px] text-muted">{shortAddr(w.address)}</div>
              <div className="mt-2 text-sm font-semibold">{usd(w.value)}</div>
            </Link>
          ))}
        </div>
      )}

      {data && (
        <>
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-extrabold">{data.label ?? "Wallet"}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                    <Eye className="size-3" /> READ-ONLY
                  </span>
                </div>
                <button type="button" onClick={() => navigator.clipboard?.writeText(data.address)} className="flex items-center gap-1 font-mono text-xs text-muted">
                  {shortAddr(data.address)} <Copy className="size-3" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="Custom name"
                  className="h-10 w-36 rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand"
                />
                <button type="button" onClick={save} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-bold text-white">
                  <Bookmark className="size-4" /> Save
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
              <Stat label="Portfolio value" value={usd(data.total)} />
              <Stat
                label="Unrealized P&L"
                value={usd(Math.abs(data.holdings.reduce((a, h) => a + h.pnl, 0)))}
                sub={data.holdings.reduce((a, h) => a + h.pnl, 0) >= 0 ? "profit" : "loss"}
                tone={data.holdings.reduce((a, h) => a + h.pnl, 0) >= 0 ? "up" : "down"}
              />
              <Stat label="Wallet age" value={`${data.ageDays} days`} />
              <Stat label="Chains" value={data.byChain.length} />
            </div>
          </Card>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <CardHeader title="Holdings" />
              <ul>
                {data.holdings.map((h) => (
                  <li key={h.t.id} className="flex items-center gap-3 border-t border-line px-4 py-2.5">
                    <TokenAvatar token={h.t} size={30} />
                    <Link href={`/token/${h.t.id}`} className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{h.t.symbol}</div>
                      <div className="text-[11px] text-muted">Avg entry {price(h.entry)}</div>
                    </Link>
                    <div className="text-right">
                      <div className="tabular text-sm font-semibold">{usd(h.value)}</div>
                      <div className={cx("text-[11px] font-semibold", h.pnl >= 0 ? "text-up" : "text-down")}>
                        {h.pnl >= 0 ? "+" : "-"}
                        {usd(Math.abs(h.pnl))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-4 sm:space-y-5">
              <Card>
                <CardHeader title="Allocation" />
                <div className="flex items-center gap-4 px-4 pb-4">
                  <Donut parts={data.holdings.map((h, i) => ({ label: h.t.symbol, pct: (h.value / data.total) * 100, color: palette[i % palette.length] }))} size={120} thickness={18} />
                  <ul className="flex-1 space-y-1 text-xs">
                    {data.holdings.map((h, i) => (
                      <li key={h.t.id} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
                        <span className="flex-1">{h.t.symbol}</span>
                        <b>{((h.value / data.total) * 100).toFixed(1)}%</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
              <Card>
                <CardHeader title="Chain exposure" />
                <ul className="space-y-2 px-4 pb-4 text-xs">
                  {data.byChain.map((c) => (
                    <li key={c.label} className="flex items-center gap-2">
                      <span className="w-20 font-semibold">{c.label}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <span className="block h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                      </span>
                      <b className="w-10 text-right">{c.pct}%</b>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Activity by hour (UTC)" />
                <div className="grid grid-cols-12 gap-1 px-4 pb-4">
                  {data.activity.map((v, i) => (
                    <span key={i} title={`${i}:00`} className="aspect-square rounded" style={{ background: `color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--surface-3))` }} />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Recent transfers" />
            <ul>
              {data.txs.map((x, i) => (
                <li key={i} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                  <span className={cx("w-16 text-xs font-bold", x.side === "Received" ? "text-up" : "text-down")}>{x.side}</span>
                  <Link href={`/token/${x.t.id}`} className="flex-1 font-semibold">
                    ${x.t.symbol} <span className="text-xs font-normal text-muted">· {chainById[x.t.chain].short}</span>
                  </Link>
                  <span className="tabular font-semibold">{usd(x.usd)}</span>
                  <span className="w-14 text-right text-xs text-muted">{x.when}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line p-3 text-[11px] text-muted">
              P&L and entries are estimates where calculable from on-chain transfers. {num(data.txs.length)} recent events shown.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
