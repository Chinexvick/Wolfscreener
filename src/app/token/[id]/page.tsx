import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { tokenById, tokens } from "@/lib/data";
import { getTokenBundle } from "@/lib/live/tokens";
import { LiveTokenView } from "./LiveTokenView";
import { TokenView } from "./TokenView";

export function generateStaticParams() {
  return tokens.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/token/[id]">): Promise<Metadata> {
  const id = (await params).id;
  const demo = tokenById(id);
  if (demo) return { title: `${demo.name} ($${demo.symbol})` };
  try {
    const b = await getTokenBundle(decodeURIComponent(id));
    return { title: b ? `${b.token.name} ($${b.token.symbol})` : "Token" };
  } catch {
    return { title: "Token" };
  }
}

async function Live({ id }: { id: string }) {
  // Render per request so a temporary upstream failure is never cached as the page.
  await connection();
  let bundle;
  try {
    bundle = await getTokenBundle(decodeURIComponent(id));
  } catch {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="font-display text-lg font-bold">Market data is busy</p>
        <p className="mt-1 text-sm text-muted">The public data providers are rate limiting right now. Please refresh in a few seconds.</p>
      </div>
    );
  }
  if (!bundle) notFound();
  return <LiveTokenView bundle={bundle} />;
}

export default async function TokenPage({ params }: PageProps<"/token/[id]">) {
  const id = (await params).id;
  const demo = tokenById(id);
  return <Suspense fallback={<div className="card h-64 animate-pulse" />}>{demo ? <TokenView id={demo.id} /> : <Live id={id} />}</Suspense>;
}
