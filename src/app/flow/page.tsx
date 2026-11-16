import { Waves } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { FlowClient } from "./FlowClient";

export const metadata: Metadata = { title: "WOLF Flow" };

export default function FlowPage() {
  return (
    <>
      <PageHeader icon={<Waves className="size-7 text-accent" />} title="WOLF Flow" subtitle="Where buy and sell pressure is building right now, across the market and per chain." />
      <FlowClient />
    </>
  );
}
