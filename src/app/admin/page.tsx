import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const queues = [
  ["Verification requests", 18],
  ["Fraud reports", 7],
  ["Suspicious accounts", 23],
  ["Boost campaigns pending", 5],
  ["Quest approvals", 4],
  ["Wallet label reviews", 41],
];

const areas = ["Users", "Projects", "Tokens", "Audits", "Verification", "Reports", "Promotions", "Boost campaigns", "Rewards", "Quests", "Alerts", "Wallet labels", "Platform analytics"];

export default function AdminPage() {
  return (
    <>
      <PageHeader icon={<Settings className="size-7 text-muted" />} title="Admin" subtitle="Platform management. Promotions are managed separately from audit and risk data, which admins cannot edit." />
      <Card className="mb-4 grid grid-cols-2 gap-4 p-4 sm:mb-6 sm:grid-cols-4">
        <Stat label="Users" value="184.2K" sub="+2.1K today" tone="up" />
        <Stat label="Tokens indexed" value="1.92M" />
        <Stat label="Audits run (24h)" value="38,410" />
        <Stat label="Active alerts" value="612K" />
      </Card>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Review queues" />
          <ul className="px-4 pb-4 text-sm">
            {queues.map(([l, n]) => (
              <li key={l} className="flex justify-between border-t border-line py-2.5 first:border-t-0">
                <span>{l}</span>
                <b className="rounded-full bg-gold-soft px-2.5 text-gold-ink">{n}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Manage" />
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {areas.map((a) => (
              <span key={a} className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold">
                {a}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
