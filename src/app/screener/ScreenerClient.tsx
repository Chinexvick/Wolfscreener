"use client";

import { Bookmark, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TokenTable } from "@/components/TokenTable";
import { cx } from "@/components/ui";
import { tokens, type Risk, type Token } from "@/lib/data";

type Range = [number | "", number | ""];
interface Filters {
  mcap: Range;
  fdv: Range;
  liquidity: Range;
  volume: Range;
  volumeChange: Range;
  change24h: Range;
  ageHours: Range;
  txns: Range;
  holders: Range;
  holderGrowth: Range;
  buySellRatio: Range;
  liquidityChange: Range;
  whale: Range;
  smart: Range;
  social: Range;
  wolfScore: Range;
  auditScore: Range;
  risk: Risk[];
  verifiedOnly: boolean;
}

const empty: Filters = {
  mcap: ["", ""],
  fdv: ["", ""],
  liquidity: ["", ""],
  volume: ["", ""],
  volumeChange: ["", ""],
  change24h: ["", ""],
  ageHours: ["", ""],
  txns: ["", ""],
  holders: ["", ""],
  holderGrowth: ["", ""],
  buySellRatio: ["", ""],
  liquidityChange: ["", ""],
  whale: ["", ""],
  smart: ["", ""],
  social: ["", ""],
  wolfScore: ["", ""],
  auditScore: ["", ""],
  risk: [],
  verifiedOnly: false,
};

const fields: { key: keyof Filters; label: string; get: (t: Token) => number; unit?: string }[] = [
  { key: "mcap", label: "Market Cap ($)", get: (t) => t.mcap },
  { key: "fdv", label: "FDV ($)", get: (t) => t.fdv },
  { key: "liquidity", label: "Liquidity ($)", get: (t) => t.liquidity },
  { key: "volume", label: "24h Volume ($)", get: (t) => t.volume24h },
  { key: "volumeChange", label: "Volume Change (%)", get: (t) => t.volumeChange },
  { key: "change24h", label: "Price Change 24h (%)", get: (t) => t.change24h },
  { key: "ageHours", label: "Token Age (hours)", get: (t) => t.ageMinutes / 60 },
  { key: "txns", label: "Transactions 24h", get: (t) => t.txns24h },
  { key: "holders", label: "Holders", get: (t) => t.holders },
  { key: "holderGrowth", label: "Holder Growth (%)", get: (t) => t.holderGrowth },
  { key: "buySellRatio", label: "Buy/Sell Ratio", get: (t) => t.buys / (t.sells || 1) },
  { key: "liquidityChange", label: "Liquidity Change (%)", get: (t) => t.liquidityChange },
  { key: "whale", label: "Whale Activity (0–100)", get: (t) => t.whaleActivity },
  { key: "smart", label: "Smart Money (0–100)", get: (t) => t.smartMoney },
  { key: "social", label: "Social Activity (0–100)", get: (t) => t.social },
  { key: "wolfScore", label: "WOLF Score", get: (t) => t.wolfScore },
  { key: "auditScore", label: "Audit Score", get: (t) => t.auditScore },
];

const presets: { name: string; f: Partial<Filters> }[] = [
  { name: "Safe-ish new gems", f: { ageHours: ["", 72], auditScore: [70, ""], liquidity: [50_000, ""] } },
  { name: "Whale magnets", f: { whale: [70, ""], smart: [60, ""] } },
  { name: "Holder momentum", f: { holderGrowth: [10, ""], buySellRatio: [1.2, ""] } },
  { name: "Verified only", f: { verifiedOnly: true, risk: ["Low"] } },
];

const STORE = "wolf-screens";

export function ScreenerClient() {
  const [f, setF] = useState<Filters>(empty);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<{ name: string; f: Filters }[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(JSON.parse(localStorage.getItem(STORE) ?? "[]"));
    } catch {}
  }, []);

  const persist = (next: typeof saved) => {
    setSaved(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {}
  };

  const source = useMemo(
    () =>
      tokens.filter((t) => {
        for (const fd of fields) {
          const [lo, hi] = f[fd.key] as Range;
          const v = fd.get(t);
          if (lo !== "" && v < lo) return false;
          if (hi !== "" && v > hi) return false;
        }
        if (f.risk.length && !f.risk.includes(t.risk)) return false;
        if (f.verifiedOnly && !t.verified) return false;
        return true;
      }),
    [f],
  );

  const active = fields.filter((fd) => (f[fd.key] as Range).some((x) => x !== "")).length + (f.risk.length ? 1 : 0) + (f.verifiedOnly ? 1 : 0);

  const setRange = (key: keyof Filters, i: 0 | 1, v: string) => {
    const r = [...(f[key] as Range)] as Range;
    r[i] = v === "" ? "" : Number(v);
    setF({ ...f, [key]: r });
  };

  const panel = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {fields.map((fd) => (
          <div key={fd.key}>
            <div className="mb-1 text-[11px] font-semibold text-muted">{fd.label}</div>
            <div className="flex gap-1.5">
              {[0, 1].map((i) => (
                <input
                  key={i}
                  type="number"
                  inputMode="decimal"
                  placeholder={i === 0 ? "Min" : "Max"}
                  value={(f[fd.key] as Range)[i]}
                  onChange={(e) => setRange(fd.key, i as 0 | 1, e.target.value)}
                  className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface-2 px-2.5 text-sm outline-none focus:border-brand"
                />
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="mb-1 text-[11px] font-semibold text-muted">Risk Level</div>
          <div className="flex gap-1.5">
            {(["Low", "Medium", "High"] as Risk[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setF({ ...f, risk: f.risk.includes(r) ? f.risk.filter((x) => x !== r) : [...f.risk, r] })}
                className={cx("h-9 flex-1 rounded-lg border text-xs font-semibold", f.risk.includes(r) ? "border-brand bg-brand text-white" : "border-line")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" checked={f.verifiedOnly} onChange={(e) => setF({ ...f, verifiedOnly: e.target.checked })} className="size-4 accent-[var(--brand)]" />
          Verified projects only
        </label>
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this screen…"
          className="h-10 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            persist([...saved.filter((s) => s.name !== name.trim()), { name: name.trim(), f }]);
            setName("");
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white"
        >
          <Bookmark className="size-4" /> Save screen
        </button>
        <button type="button" onClick={() => setF(empty)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold">
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-bg"
        >
          <SlidersHorizontal className="size-4" /> Filters {active > 0 && <span className="rounded-full bg-brand px-1.5 text-white">{active}</span>}
        </button>
        {presets.map((p) => (
          <button
            type="button"
            key={p.name}
            onClick={() => setF({ ...empty, ...p.f })}
            className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold hover:border-brand/60"
          >
            {p.name}
          </button>
        ))}
        {saved.map((s) => (
          <span key={s.name} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand/60 bg-brand-soft py-2 pr-2 pl-3.5 text-xs font-semibold text-brand-ink">
            <button type="button" onClick={() => setF(s.f)}>
              ★ {s.name}
            </button>
            <button type="button" onClick={() => persist(saved.filter((x) => x.name !== s.name))} aria-label={`Delete ${s.name}`}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <>
          <div className="card hidden p-4 md:block">{panel}</div>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-surface p-4 pb-8" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Filters</h2>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">
                  Show {source.length}
                </button>
              </div>
              {panel}
            </div>
          </div>
        </>
      )}

      <TokenTable source={source} pageSize={15} tabs={["trending", "gainers", "volume", "liquidity", "holders", "new", "wolf"]} defaultTab="trending" />
    </div>
  );
}
