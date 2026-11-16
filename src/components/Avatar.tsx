"use client";

import { useState } from "react";

function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generated avatar for tokens with no published logo: a symmetric pattern unique to the token. */
function Identicon({ symbol, hue, size }: { symbol: string; hue: number; size: number }) {
  const bits = seed(symbol + hue);
  const cells: [number, number][] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if ((bits >> (row * 3 + col)) & 1) {
        cells.push([col, row]);
        if (col < 2) cells.push([4 - col, row]);
      }
    }
  }
  const fg = `hsl(${hue} 72% 50%)`;
  const bg = `hsl(${(hue + 30) % 360} 60% 92%)`;
  return (
    <svg width={size} height={size} viewBox="0 0 5 5" className="inline-block shrink-0 rounded-full ring-2 ring-surface" role="img" aria-label={`${symbol} (no logo published yet)`}>
      <title>{symbol}: no logo published yet</title>
      <rect width="5" height="5" fill={bg} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fg} />
      ))}
    </svg>
  );
}

/** Real token logo. Falls back to a generated avatar when there is no logo or it fails to load. */
export function Avatar({ symbol, hue, image, size }: { symbol: string; hue: number; image?: string; size: number }) {
  const [failed, setFailed] = useState(false);
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
  return <Identicon symbol={symbol} hue={hue} size={size} />;
}
