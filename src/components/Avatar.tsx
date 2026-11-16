"use client";

import { useState } from "react";

/** Real token logo with a gradient-initials fallback when it is missing or fails to load. */
export function Avatar({ symbol, hue, image, size }: { symbol: string; hue: number; image?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const base = { width: size, height: size, fontSize: size * 0.34 };
  if (image && !failed) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="inline-block shrink-0 rounded-full bg-surface-3 object-cover ring-2 ring-surface"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-bold text-white ring-2 ring-surface"
      style={{ ...base, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 65% 38%))` }}
      aria-hidden
    >
      {symbol.slice(0, 2)}
    </span>
  );
}
