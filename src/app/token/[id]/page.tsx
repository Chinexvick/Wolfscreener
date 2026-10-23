import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { tokenById, tokens } from "@/lib/data";
import { TokenView } from "./TokenView";

export function generateStaticParams() {
  return tokens.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/token/[id]">): Promise<Metadata> {
  const t = tokenById((await params).id);
  return { title: t ? `${t.name} ($${t.symbol})` : "Token" };
}

export default async function TokenPage({ params }: PageProps<"/token/[id]">) {
  const t = tokenById((await params).id);
  if (!t) notFound();
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse" />}>
      <TokenView id={t.id} />
    </Suspense>
  );
}
