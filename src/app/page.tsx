"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const TreemapView = dynamic(() => import("@/components/TreemapView"), { ssr: false });
const SwarmView = dynamic(() => import("@/components/SwarmView"), { ssr: false });
const BubbleView = dynamic(() => import("@/components/BubbleView"), { ssr: false });

type SubscriptionRecord = {
  id: string;
  serviceName: string;
  category: "Streaming" | "Music" | "Gaming" | "Shopping" | "News" | "Utilities" | "Other";
  status: "Active" | "Cancelled" | "Paused" | "Trial";
  billingCycle: "Monthly" | "Annual";
  monthlyCost: number;
  annualCost?: number;
  startDate: string;
  renewalDate: string;
  usage?: number;
  notes?: string;
};

const sampleData: SubscriptionRecord[] = [
  { id: "SUB-001", serviceName: "Netflix", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 15.49, annualCost: 185.88, startDate: "2024-01-12", renewalDate: "2025-01-12", usage: 40 },
  { id: "SUB-002", serviceName: "Amazon Prime", category: "Shopping", status: "Active", billingCycle: "Annual", monthlyCost: 11.58, annualCost: 139, startDate: "2024-03-02", renewalDate: "2025-03-02", usage: 12 },
  { id: "SUB-003", serviceName: "Disney+", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 13.99, annualCost: 167.88, startDate: "2024-02-15", renewalDate: "2025-02-15", usage: 25 },
  { id: "SUB-004", serviceName: "Spotify", category: "Music", status: "Active", billingCycle: "Monthly", monthlyCost: 10.99, annualCost: 131.88, startDate: "2023-11-04", renewalDate: "2024-11-04", usage: 60 },
  { id: "SUB-005", serviceName: "YouTube Premium", category: "Streaming", status: "Trial", billingCycle: "Monthly", monthlyCost: 0, annualCost: 0, startDate: "2024-05-10", renewalDate: "2024-06-10", usage: 15 },
  { id: "SUB-006", serviceName: "Apple iCloud", category: "Utilities", status: "Active", billingCycle: "Monthly", monthlyCost: 2.99, annualCost: 35.88, startDate: "2024-04-08", renewalDate: "2025-04-08", usage: 200 },
  { id: "SUB-007", serviceName: "Xbox Game Pass", category: "Gaming", status: "Paused", billingCycle: "Monthly", monthlyCost: 16.99, annualCost: 203.88, startDate: "2023-09-01", renewalDate: "2025-09-01", usage: 10 },
  { id: "SUB-008", serviceName: "Hulu", category: "Streaming", status: "Cancelled", billingCycle: "Monthly", monthlyCost: 7.99, annualCost: 95.88, startDate: "2024-06-14", renewalDate: "2025-06-14", usage: 5 },
  { id: "SUB-009", serviceName: "Audible", category: "News", status: "Active", billingCycle: "Monthly", monthlyCost: 14.95, annualCost: 179.4, startDate: "2023-12-22", renewalDate: "2024-12-22", usage: 8 },
  { id: "SUB-010", serviceName: "NYTimes", category: "News", status: "Active", billingCycle: "Monthly", monthlyCost: 8, annualCost: 96, startDate: "2024-07-02", renewalDate: "2024-08-02", usage: 20 },
  { id: "SUB-011", serviceName: "HBO Max", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 15.99, annualCost: 191.88, startDate: "2024-01-20", renewalDate: "2025-01-20", usage: 35 },
  { id: "SUB-012", serviceName: "Apple Music", category: "Music", status: "Active", billingCycle: "Monthly", monthlyCost: 10.99, annualCost: 131.88, startDate: "2024-02-10", renewalDate: "2025-02-10", usage: 80 },
  { id: "SUB-013", serviceName: "PlayStation Plus", category: "Gaming", status: "Active", billingCycle: "Annual", monthlyCost: 5, annualCost: 60, startDate: "2024-03-15", renewalDate: "2025-03-15", usage: 25 },
  { id: "SUB-014", serviceName: "LinkedIn Premium", category: "Utilities", status: "Trial", billingCycle: "Monthly", monthlyCost: 0, annualCost: 0, startDate: "2024-06-01", renewalDate: "2024-07-01", usage: 5 },
  { id: "SUB-015", serviceName: "Peacock", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 5.99, annualCost: 71.88, startDate: "2024-04-12", renewalDate: "2025-04-12", usage: 18 },
];

const categories: SubscriptionRecord["category"][] = ["Streaming", "Music", "Gaming", "Shopping", "News", "Utilities", "Other"];
const statuses: SubscriptionRecord["status"][] = ["Active", "Cancelled", "Paused", "Trial"];
const billingCycles: SubscriptionRecord["billingCycle"][] = ["Monthly", "Annual"];

type ViewMode = "treemap" | "swarm" | "bubble";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function monthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${new Date(Number(year), Number(month) - 1, 1).toLocaleString("en", { month: "short", year: "2-digit" })}`;
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function hashToRange(seed: string, range: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % range) + range) % range;
}

function monthlyValue(item: SubscriptionRecord) {
  if (item.billingCycle === "Annual") {
    return (item.annualCost ?? item.monthlyCost * 12) / 12;
  }
  return item.monthlyCost;
}

function annualValue(item: SubscriptionRecord) {
  if (item.billingCycle === "Annual") {
    return item.annualCost ?? item.monthlyCost * 12;
  }
  return item.monthlyCost * 12;
}

function toCSV(rows: SubscriptionRecord[]) {
  const header = [
    "id",
    "serviceName",
    "category",
    "status",
    "billingCycle",
    "monthlyCost",
    "annualCost",
    "startDate",
    "renewalDate",
    "usage",
    "notes",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.serviceName,
      r.category,
      r.status,
      r.billingCycle,
      r.monthlyCost,
      r.annualCost ?? "",
      r.startDate,
      r.renewalDate,
      r.usage ?? "",
      r.notes ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadFile(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const [entries, setEntries] = useState<SubscriptionRecord[]>([]);
  const [view, setView] = useState<ViewMode>("treemap");
  const [categoryFilter, setCategoryFilter] = useState<string>("All categories");
  const [cycleFilter, setCycleFilter] = useState<string>("All billing");
  const [statusFilter, setStatusFilter] = useState<string>("All statuses");
  const [metric, setMetric] = useState<"count" | "revenue">("revenue");
  const [shareOpen, setShareOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<SubscriptionRecord, "id">>({
    serviceName: "",
    category: "Streaming",
    status: "Active",
    billingCycle: "Monthly",
    startDate: "",
    renewalDate: "",
    monthlyCost: 15,
    annualCost: 180,
    usage: 0,
    notes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    const m = params.get("metric");
    const s = params.get("step");
    const c = params.get("category");
    const b = params.get("billing");
    const st = params.get("status");
    if (v === "treemap" || v === "swarm" || v === "bubble") setView(v);
    if (m === "count" || m === "revenue") setMetric(m);
    if (s === "2") setStep(2);
    if (c) setCategoryFilter(c);
    if (b) setCycleFilter(b);
    if (st) setStatusFilter(st);
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((sub) => {
      const categoryOk = categoryFilter === "All categories" || sub.category === categoryFilter;
      const cycleOk = cycleFilter === "All billing" || sub.billingCycle === cycleFilter;
      const statusOk = statusFilter === "All statuses" || sub.status === statusFilter;
      return categoryOk && cycleOk && statusOk;
    });
  }, [entries, categoryFilter, cycleFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalMonthly = filtered.reduce((sum, item) => sum + monthlyValue(item), 0);
    const totalAnnual = filtered.reduce((sum, item) => sum + annualValue(item), 0);
    const cancelled = filtered.filter((f) => f.status === "Cancelled").length;
    const active = filtered.filter((f) => f.status === "Active").length;
    const avgMonthlyPerSub = filtered.length ? totalMonthly / filtered.length : 0;
    return { totalMonthly, totalAnnual, cancelled, active, avgMonthlyPerSub };
  }, [filtered]);

  const heatmapData = useMemo(() => {
    const months = Array.from(new Set(filtered.map((s) => monthKey(s.startDate)))).sort();
    const services = Array.from(new Set(filtered.map((s) => s.serviceName))).sort();
    const matrix = services.map((service) =>
      months.map((month) => {
        const entriesForCell = filtered.filter((s) => s.serviceName === service && monthKey(s.startDate) === month);
        if (metric === "count") return entriesForCell.length;
        return entriesForCell.reduce((sum, item) => sum + monthlyValue(item), 0);
      }),
    );
    const flat = matrix.flat();
    const max = Math.max(...flat, 1);
    const min = Math.min(...flat, 0);
    return { months, services, matrix, min, max };
  }, [filtered, metric]);



  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    url.searchParams.set("metric", metric);
    url.searchParams.set("step", String(step));
    if (categoryFilter !== "All categories") url.searchParams.set("category", categoryFilter);
    if (cycleFilter !== "All billing") url.searchParams.set("billing", cycleFilter);
    if (statusFilter !== "All statuses") url.searchParams.set("status", statusFilter);
    return url.toString();
  }, [metric, categoryFilter, cycleFilter, statusFilter, step, view]);

  // Update URL when shareUrl changes
  useEffect(() => {
    if (typeof window !== "undefined" && shareUrl) {
      window.history.replaceState(null, "", shareUrl);
    }
  }, [shareUrl]);

  function handleAdd() {
    if (!draft.serviceName.trim()) {
      alert("Please enter a service name");
      return;
    }

    const start =
      draft.startDate && draft.startDate.trim().length > 0
        ? draft.startDate
        : new Date().toISOString().slice(0, 10);
    const renewal =
      draft.renewalDate && draft.renewalDate.trim().length > 0
        ? draft.renewalDate
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            .toISOString()
            .slice(0, 10);
    setEntries((prev) => [
      ...prev,
      {
        ...draft,
        startDate: start,
        renewalDate: renewal,
        id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    ]);
    setDraft({
      serviceName: "",
      category: "Streaming",
      status: "Active",
      billingCycle: "Monthly",
      startDate: "",
      renewalDate: "",
      monthlyCost: 15,
      annualCost: 180,
      usage: 0,
      notes: "",
    });
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((p) => p.id !== id));
  }

  function handleExportCSV() {
    const csv = toCSV(filtered);
    downloadFile("subscriptions.csv", "text/csv", csv);
  }

  function handleExportJSON() {
    downloadFile("subscriptions.json", "application/json", JSON.stringify(filtered, null, 2));
  }

  function handleShareNative() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    navigator
      .share({
        title: "Subscription analytics",
        text: "Check out my subscription dashboard",
        url: shareUrl,
      })
      .catch(() => undefined);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 text-slate-900 md:px-6 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Subscription Visualizer</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Manage & visualize subscriptions</h1>
            <p className="text-sm text-slate-600">Step {step} of 2 • {entries.length} subscription{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={entries.length === 0}
            >
              Share / Export
            </button>
            <button
              type="button"
              onClick={() => {
                if (step === 1 && entries.length === 0) return;
                setStep((prev) => (prev === 1 ? 2 : 1));
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={step === 1 && entries.length === 0}
            >
              {step === 1 ? "View Analytics →" : "← Back to Input"}
            </button>
          </div>
        </header>

        {step === 1 && (
          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Enter your subscriptions</h2>
                <p className="text-sm text-slate-600">Add your records or load sample data to preview analytics.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEntries(sampleData)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                >
                  Load sample data
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEntries([])}
                    className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:border-red-400 hover:bg-red-50"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
              <TextField label="Service name *" value={draft.serviceName} onChange={(v) => setDraft((p) => ({ ...p, serviceName: v }))} placeholder="Netflix" />
              <SelectField label="Category" value={draft.category} options={categories} onChange={(v) => setDraft((p) => ({ ...p, category: v as SubscriptionRecord["category"] }))} />
              <SelectField label="Status" value={draft.status} options={statuses} onChange={(v) => setDraft((p) => ({ ...p, status: v as SubscriptionRecord["status"] }))} />
              <SelectField label="Billing cycle" value={draft.billingCycle} options={billingCycles} onChange={(v) => setDraft((p) => ({ ...p, billingCycle: v as SubscriptionRecord["billingCycle"] }))} />
              <TextField label="Monthly cost" value={draft.monthlyCost.toString()} onChange={(v) => setDraft((p) => ({ ...p, monthlyCost: Number(v) || 0 }))} type="number" step="0.01" placeholder="15.00" />
              <TextField label="Annual cost (optional)" value={(draft.annualCost ?? 0).toString()} onChange={(v) => setDraft((p) => ({ ...p, annualCost: Number(v) || 0 }))} type="number" step="0.01" placeholder="180.00" />
              <TextField label="Start date" value={draft.startDate} onChange={(v) => setDraft((p) => ({ ...p, startDate: v }))} type="date" />
              <TextField label="Renewal date" value={draft.renewalDate} onChange={(v) => setDraft((p) => ({ ...p, renewalDate: v }))} type="date" />
              <TextField label="Usage (hrs, optional)" value={(draft.usage ?? 0).toString()} onChange={(v) => setDraft((p) => ({ ...p, usage: Number(v) || 0 }))} type="number" placeholder="0" />
              <TextField label="Notes (optional)" value={draft.notes ?? ""} onChange={(v) => setDraft((p) => ({ ...p, notes: v }))} placeholder="Family plan" />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                + Add subscription
              </button>
            </div>

            {entries.length > 0 && (
              <div className="overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Billing</th>
                      <th className="px-4 py-3 text-right">Monthly</th>
                      <th className="px-4 py-3 text-right">Annual</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">Renewal</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {entries.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.serviceName}</td>
                        <td className="px-4 py-3 text-slate-600">{row.category}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.billingCycle}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{currency.format(monthlyValue(row))}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{currency.format(annualValue(row))}</td>
                        <td className="px-4 py-3 text-slate-600">{row.startDate}</td>
                        <td className="px-4 py-3 text-slate-600">{row.renewalDate}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {entries.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-600">No subscriptions yet</p>
                <p className="mt-1 text-xs text-slate-500">Add your first subscription or load sample data to get started</p>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <>
            {entries.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-lg font-medium text-slate-700">No data to visualize</p>
                <p className="mt-2 text-sm text-slate-600">Go back and add subscriptions first</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  ← Back to Input
                </button>
              </div>
            ) : (
              <>
                <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard title="Monthly Spend" value={currency.format(summary.totalMonthly)} hint="Total monthly cost (annual plans prorated)" color="sky" />
                  <SummaryCard title="Annual Spend" value={currency.format(summary.totalAnnual)} hint="Total annualized cost" color="violet" />
                  <SummaryCard title="Active / Cancelled" value={`${summary.active} / ${summary.cancelled}`} hint="Current subscription status" color="emerald" />
                  <SummaryCard title="Avg Monthly Cost" value={currency.format(summary.avgMonthlyPerSub)} hint="Average cost per subscription" color="amber" />
                </section>

                <FiltersBar
                  categoryFilter={categoryFilter}
                  cycleFilter={cycleFilter}
                  statusFilter={statusFilter}
                  metric={metric}
                  onCategoryChange={setCategoryFilter}
                  onCycleChange={setCycleFilter}
                  onStatusChange={setStatusFilter}
                  onMetricChange={setMetric}
                  recordCount={filtered.length}
                />

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["treemap", "swarm", "bubble"] as ViewMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setView(mode)}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                            view === mode 
                              ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm" 
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {mode === "treemap" && "🗂️ Treemap"}
                          {mode === "swarm" && "🎯 Swarm Plot"}
                          {mode === "bubble" && "⚫ Bubble Chart"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white p-4">
                    {view === "treemap" && <TreemapView data={filtered} metric={metric} />}
                    {view === "swarm" && <SwarmView data={filtered} />}
                    {view === "bubble" && <BubbleView data={filtered} />}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          <p>Built with Next.js 16, React 19, and Tailwind CSS v4 • Subscription Visualizer © 2026</p>
        </footer>
      </div>

      {shareOpen && (
        <ShareExportModal
          onClose={() => setShareOpen(false)}
          view={view}
          metric={metric}
          categoryFilter={categoryFilter}
          cycleFilter={cycleFilter}
          statusFilter={statusFilter}
          shareUrl={shareUrl}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onShareNative={handleShareNative}
          count={filtered.length}
        />
      )}
    </main>
  );
}

type SummaryCardProps = { title: string; value: string; hint: string; color: "sky" | "violet" | "emerald" | "amber" };
function SummaryCard({ title, value, hint, color }: SummaryCardProps) {
  const colorClasses = {
    sky: "from-sky-50 to-sky-100 border-sky-200",
    violet: "from-violet-50 to-violet-100 border-violet-200",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200",
    amber: "from-amber-50 to-amber-100 border-amber-200",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm ${colorClasses[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionRecord["status"] }) {
  const styles = {
    Active: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Cancelled: "bg-red-100 text-red-700 border-red-300",
    Paused: "bg-amber-100 text-amber-700 border-amber-300",
    Trial: "bg-sky-100 text-sky-700 border-sky-300",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

type FiltersBarProps = {
  categoryFilter: string;
  cycleFilter: string;
  statusFilter: string;
  metric: "count" | "revenue";
  onCategoryChange: (v: string) => void;
  onCycleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onMetricChange: (v: "count" | "revenue") => void;
  recordCount: number;
};

function FiltersBar({ categoryFilter, cycleFilter, statusFilter, metric, onCategoryChange, onCycleChange, onStatusChange, onMetricChange, recordCount }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Selector label="Category" value={categoryFilter} onChange={onCategoryChange} options={["All categories", ...categories]} />
      <Selector label="Billing" value={cycleFilter} onChange={onCycleChange} options={["All billing", ...billingCycles]} />
      <Selector label="Status" value={statusFilter} onChange={onStatusChange} options={["All statuses", ...statuses]} />
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-500">{recordCount} record{recordCount !== 1 ? 's' : ''}</span>
        <div className="h-6 w-px bg-slate-300"></div>
        <span className="text-xs font-semibold uppercase text-slate-500">Metric</span>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {(["revenue", "count"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMetricChange(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${metric === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {m === "revenue" ? "💵 Cost" : "📊 Count"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type SelectorProps = { label: string; value: string; options: string[]; onChange: (v: string) => void };
function Selector({ label, value, options, onChange }: SelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextFieldProps = { label: string; value: string; onChange: (v: string) => void; type?: string; step?: string; placeholder?: string };
function TextField({ label, value, onChange, type = "text", step, placeholder }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={step}
        placeholder={placeholder}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
    </label>
  );
}

type SelectFieldProps = { label: string; value: string; options: string[]; onChange: (v: string) => void };
function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}



type ShareExportModalProps = {
  onClose: () => void;
  view: ViewMode;
  metric: "count" | "revenue";
  categoryFilter: string;
  cycleFilter: string;
  statusFilter: string;
  shareUrl: string;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onShareNative: () => void;
  count: number;
};

function ShareExportModal({ onClose, view, metric, categoryFilter, cycleFilter, statusFilter, shareUrl, onExportCSV, onExportJSON, onShareNative, count }: ShareExportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Share & Export</h3>
            <p className="mt-1 text-sm text-slate-600">
              View: <span className="font-medium">{view}</span> • Metric: <span className="font-medium">{metric}</span> • Records: <span className="font-medium">{count}</span>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Share Link Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">📤 Share Link</p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="break-all text-sm text-slate-700">{shareUrl}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton value={shareUrl} />
              <button 
                type="button" 
                onClick={onShareNative} 
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                📱 Native Share
              </button>
            </div>
          </div>

          {/* Social Media Share */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">🌐 Social Media</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <SocialButton label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} />
              <SocialButton label="X / Twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out my subscription analytics!')}`} />
              <SocialButton label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} />
              <SocialButton label="Reddit" href={`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('My Subscription Analytics')}`} />
            </div>
          </div>

          {/* Export Data */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">💾 Export Data</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                type="button" 
                onClick={onExportCSV} 
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                📊 Download CSV
              </button>
              <button 
                type="button" 
                onClick={onExportJSON} 
                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
              >
                📄 Download JSON
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {count > 0 
                ? `Exports include ${count} filtered record${count !== 1 ? 's' : ''} based on current filters`
                : 'No records to export with current filters'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "✓ Copied!" : "📋 Copy Link"}
    </button>
  );
}

function SocialButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}
