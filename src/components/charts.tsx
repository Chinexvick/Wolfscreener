import { cx } from "./ui";

export function AreaChart({ data, height = 120, color = "var(--up)", className }: { data: number[]; height?: number; color?: string; className?: string }) {
  const w = 300;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const y = (v: number) => height - 6 - ((v - min) / (max - min || 1)) * (height - 16);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${y(v)}`);
  const id = `g${Math.round(data[0] * 1000)}${data.length}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cx("w-full", className)} style={{ height }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="var(--border)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      ))}
      <polygon points={`0,${height} ${pts.join(" ")} ${w},${height}`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function Donut({ parts, size = 150, thickness = 22, center }: { parts: { pct: number; color: string; label: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offsets = parts.map((_, i) => parts.slice(0, i).reduce((a, p) => a + (p.pct / 100) * c, 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${p.pct}%`).join(", ")}>
        {parts.map((p, i) => {
          const len = (p.pct / 100) * c;
          return (
            <circle
              key={p.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
              strokeDashoffset={-offsets[i]}
            />
          );
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export function PressureBar({ buy, sell, labels = ["Buy", "Sell"] }: { buy: number; sell: number; labels?: [string, string] }) {
  const total = buy + sell || 1;
  const b = (buy / total) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-semibold">
        <span className="text-up">
          {labels[0]} {b.toFixed(0)}%
        </span>
        <span className="text-down">
          {labels[1]} {(100 - b).toFixed(0)}%
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-3">
        <div className="bg-up" style={{ width: `${b}%` }} />
        <div className="ml-0.5 flex-1 bg-down" />
      </div>
    </div>
  );
}

export function Columns({ data, height = 120, labels }: { data: { a: number; b?: number }[]; height?: number; labels?: string[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.a, d.b ?? 0)));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex h-full flex-1 items-end gap-0.5">
            <div className="flex-1 rounded-t bg-up" style={{ height: `${(d.a / max) * 100}%` }} />
            {d.b !== undefined && <div className="flex-1 rounded-t bg-down/80" style={{ height: `${(d.b / max) * 100}%` }} />}
          </div>
        ))}
      </div>
      {labels && (
        <div className="mt-1 flex gap-1 text-[10px] text-muted">
          {labels.map((l) => (
            <span key={l} className="flex-1 text-center">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
