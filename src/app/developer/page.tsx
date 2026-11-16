import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DeveloperClient } from "./DeveloperClient";

export const metadata: Metadata = { title: "Developer Hub" };

export default function DeveloperPage() {
  return (
    <>
      <PageHeader
        sample="Project analytics need accounts and a database. Numbers here are examples."
        icon={<LayoutDashboard className="size-7 text-accent" />}
        title="Developer Hub"
        subtitle="List → Verify → Analyze → Promote → Grow. Your project dashboard, promotion analytics, growth tools and AI assistant."
      />
      <DeveloperClient />
    </>
  );
}
