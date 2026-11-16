import { Flame } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ProjectsClient } from "./ProjectsClient";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        icon={<Flame className="size-7 text-down" />}
        title="WOLF Projects"
        subtitle="Browse top projects by sector with live prices, market caps and 7-day trends. Open any project for its full CoinGecko profile."
      />
      <ProjectsClient />
    </>
  );
}
