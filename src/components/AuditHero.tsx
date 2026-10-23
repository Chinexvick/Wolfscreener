import { ArrowRight, CircleCheck, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: ShieldCheck, label: "Rug Pull Risk" },
  { icon: CircleCheck, label: "Contract Safety" },
  { icon: Lock, label: "Honeypot Check" },
  { icon: Sparkles, label: "AI Score" },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`;
}

function AuditArt() {
  const score = 92;
  const cx = 214;
  const cy = 130;
  const r = 38;
  const end = 180 - (score / 100) * 180;
  return (
    <svg viewBox="0 0 300 200" className="h-auto w-full" role="img" aria-label="Security score 92 out of 100">
      <defs>
        <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ede9fe" />
          <stop offset="1" stopColor="#c7bdf5" />
        </linearGradient>
        <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#4c1d95" floodOpacity="0.22" />
        </filter>
      </defs>

      <polygon points="40,150 130,176 215,150 130,124" fill="#ddd6fe" opacity="0.55" />
      <g filter="url(#soft)">
        <rect x="28" y="28" width="120" height="132" rx="16" fill="url(#plate)" opacity="0.9" />
        <path d="M88 44 L130 58 V96 C130 124 112 142 88 152 C64 142 46 124 46 96 V58 Z" fill="url(#shield)" />
        <path d="M88 52 L123 63 V96 C123 119 108 135 88 144 C68 135 53 119 53 96 V63 Z" fill="#fff" opacity="0.14" />
        <path d="M70 98 L84 112 L108 82" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="rotate(5 214 110)" filter="url(#soft)">
        <rect x="156" y="52" width="116" height="116" rx="16" fill="#fff" />
        <path d="M172 72 l5 -2 v6 c0 3 -2 5 -5 6 c-3 -1 -5 -3 -5 -6 v-6 z" fill="#1e1b4b" transform="translate(-3 -3)" />
        <text x="184" y="76" fontSize="10" fontWeight="700" fill="#1e1b4b">
          Security Score
        </text>
        <path d={`M ${polar(cx, cy, r, 180)} A ${r} ${r} 0 0 1 ${polar(cx, cy, r, 0)}`} fill="none" stroke="#e5e7eb" strokeWidth="9" strokeLinecap="round" />
        <path d={`M ${polar(cx, cy, r, 180)} A ${r} ${r} 0 0 1 ${polar(cx, cy, r, end)}`} fill="none" stroke="url(#gauge)" strokeWidth="9" strokeLinecap="round" />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0c0b10">
          {score}
          <tspan fontSize="11" fontWeight="600" fill="#6b7280">
            /100
          </tspan>
        </text>
      </g>
    </svg>
  );
}

export function AuditHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#f6f2ff] via-[#fbfaff] to-[#e7e1ff] p-5 sm:p-8 dark:from-[#1a1230] dark:via-[#130e22] dark:to-[#241848]">
      <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative grid grid-cols-[1.1fr_1fr] items-center gap-x-2 gap-y-3 md:grid-cols-[1.8fr_1fr] md:gap-y-4">
        <div className="col-span-2 md:col-span-1 md:row-start-1">
          <span className="inline-flex rounded-full bg-brand px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">New Feature</span>
          <h1 className="mt-3 font-display text-[28px] leading-[1.05] font-extrabold tracking-tight sm:text-[52px]">
            <span className="text-brand">AI</span> Token Audit
          </h1>
        </div>

        <p className="col-start-1 row-start-2 max-w-md text-[13px] leading-snug text-ink/80 sm:text-base">
          Get instant risk analysis, security checks and smart contract insights — powered by AI.
        </p>

        <div className="col-start-2 row-start-2 md:row-span-3 md:row-start-1">
          <AuditArt />
        </div>

        <div className="col-span-2 row-start-3 md:col-span-1 md:col-start-1 md:row-start-3">
          <ul className="flex flex-wrap gap-2">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap shadow-sm sm:text-[11px]"
              >
                <Icon className="size-3.5 text-brand" />
                {label}
              </li>
            ))}
          </ul>
          <Link
            href="/audit"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-[#6d28d9] px-6 text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-110"
          >
            Try AI Audit Now <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
