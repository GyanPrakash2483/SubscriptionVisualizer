"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

type SubscriptionRecord = {
  id: string;
  serviceName: string;
  category: "Streaming" | "Music" | "Gaming" | "Shopping" | "News" | "Utilities" | "Other";
  status: "Active" | "Cancelled" | "Paused" | "Trial";
  billingCycle: "Monthly" | "Annual";
  monthlyCost: number;
  notes?: string;
};

const TreemapView = dynamic<{ data: SubscriptionRecord[] }>(() => import("@/components/TreemapView"), { ssr: false });
const SwarmView = dynamic<{ data: SubscriptionRecord[] }>(() => import("@/components/SwarmView"), { ssr: false });
const BubbleView = dynamic<{ data: SubscriptionRecord[] }>(() => import("@/components/BubbleView"), { ssr: false });

const sampleData: SubscriptionRecord[] = [
  { id: "SUB-001", serviceName: "Netflix", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 15.49 },
  { id: "SUB-002", serviceName: "Amazon Prime", category: "Shopping", status: "Active", billingCycle: "Annual", monthlyCost: 11.58 },
  { id: "SUB-003", serviceName: "Disney+", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 13.99 },
  { id: "SUB-004", serviceName: "Spotify", category: "Music", status: "Active", billingCycle: "Monthly", monthlyCost: 10.99 },
  { id: "SUB-005", serviceName: "YouTube Premium", category: "Streaming", status: "Trial", billingCycle: "Monthly", monthlyCost: 0 },
  { id: "SUB-006", serviceName: "Apple iCloud", category: "Utilities", status: "Active", billingCycle: "Monthly", monthlyCost: 2.99 },
  { id: "SUB-007", serviceName: "Xbox Game Pass", category: "Gaming", status: "Paused", billingCycle: "Monthly", monthlyCost: 16.99 },
  { id: "SUB-008", serviceName: "Hulu", category: "Streaming", status: "Cancelled", billingCycle: "Monthly", monthlyCost: 7.99 },
  { id: "SUB-009", serviceName: "Audible", category: "News", status: "Active", billingCycle: "Monthly", monthlyCost: 14.95 },
  { id: "SUB-010", serviceName: "NYTimes", category: "News", status: "Active", billingCycle: "Monthly", monthlyCost: 8 },
  { id: "SUB-011", serviceName: "HBO Max", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 15.99 },
  { id: "SUB-012", serviceName: "Apple Music", category: "Music", status: "Active", billingCycle: "Monthly", monthlyCost: 10.99 },
  { id: "SUB-013", serviceName: "PlayStation Plus", category: "Gaming", status: "Active", billingCycle: "Annual", monthlyCost: 5 },
  { id: "SUB-014", serviceName: "LinkedIn Premium", category: "Utilities", status: "Trial", billingCycle: "Monthly", monthlyCost: 0 },
  { id: "SUB-015", serviceName: "Peacock", category: "Streaming", status: "Active", billingCycle: "Monthly", monthlyCost: 5.99 },
];

const categories: SubscriptionRecord["category"][] = ["Streaming", "Music", "Gaming", "Shopping", "News", "Utilities", "Other"];
const statuses: SubscriptionRecord["status"][] = ["Active", "Cancelled", "Paused", "Trial"];
const billingCycles: SubscriptionRecord["billingCycle"][] = ["Monthly", "Annual"];

type ViewMode = "treemap" | "swarm" | "bubble";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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
    return item.monthlyCost / 12;
  }
  return item.monthlyCost;
}

function annualValue(item: SubscriptionRecord) {
  if (item.billingCycle === "Annual") {
    return item.monthlyCost;
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
      annualValue(r),
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
  const [shareOpen, setShareOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportAuthor, setReportAuthor] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<SubscriptionRecord, "id">>({
    serviceName: "",
    category: "Streaming",
    status: "Active",
    billingCycle: "Monthly",
    monthlyCost: 15,
    notes: "",
  });

  // Load report from MongoDB if reportId is in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rid = params.get("reportId");
    
    if (rid) {
      setReportId(rid);
      setLoadingReport(true);
      // Load report from API
      fetch(`/api/reports?id=${rid}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch report: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success && data.report) {
            // Load subscriptions first
            const loadedSubscriptions = data.report.subscriptions || [];
            setEntries(loadedSubscriptions);
            
            // Load author name
            if (data.report.authorName) {
              setReportAuthor(data.report.authorName);
            }
            
            // Load view
            if (data.report.view) setView(data.report.view);
            
            // Load filters (only if they exist, otherwise keep defaults)
            if (data.report.filters) {
              if (data.report.filters.category) {
                setCategoryFilter(data.report.filters.category);
              } else {
                setCategoryFilter("All categories");
              }
              if (data.report.filters.billing) {
                setCycleFilter(data.report.filters.billing);
              } else {
                setCycleFilter("All billing");
              }
              if (data.report.filters.status) {
                setStatusFilter(data.report.filters.status);
              } else {
                setStatusFilter("All statuses");
              }
            }
            
            // Only go to analytics if we have subscriptions
            if (loadedSubscriptions.length > 0) {
              setStep(2);
            } else {
              setStep(1);
            }
          } else {
            console.error("Report data invalid:", data);
            alert("Failed to load report. The link may be invalid or expired.");
          }
        })
        .catch((err) => {
          console.error("Failed to load report:", err);
          alert("Failed to load report. Please check your connection and try again.");
        })
        .finally(() => {
          setLoadingReport(false);
        });
      return;
    }

    // Otherwise load from URL params (legacy support)
    const v = params.get("view");
    const s = params.get("step");
    const c = params.get("category");
    const b = params.get("billing");
    const st = params.get("status");
    if (v === "treemap" || v === "swarm" || v === "bubble") setView(v);
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



  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.origin + window.location.pathname);
    
    // If we have a reportId, use that for sharing
    if (reportId) {
      url.searchParams.set("reportId", reportId);
      return url.toString();
    }
    
    // Otherwise use query params (legacy)
    url.searchParams.set("view", view);
    url.searchParams.set("step", String(step));
    if (categoryFilter !== "All categories") url.searchParams.set("category", categoryFilter);
    if (cycleFilter !== "All billing") url.searchParams.set("billing", cycleFilter);
    if (statusFilter !== "All statuses") url.searchParams.set("status", statusFilter);
    return url.toString();
  }, [categoryFilter, cycleFilter, statusFilter, step, view, reportId]);

  async function handleSaveReport(authorName: string) {
    if (entries.length === 0) {
      alert("No subscriptions to save");
      return null;
    }

    if (!authorName || authorName.trim().length === 0) {
      alert("Please enter your name to save the report");
      return null;
    }

    setSavingReport(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptions: entries,
          filters: {
            category: categoryFilter !== "All categories" ? categoryFilter : undefined,
            billing: cycleFilter !== "All billing" ? cycleFilter : undefined,
            status: statusFilter !== "All statuses" ? statusFilter : undefined,
          },
          view,
          summary,
          authorName: authorName.trim(),
        }),
      });

      const data = await response.json();
      if (data.success && data.reportId) {
        setReportId(data.reportId);
        // Update URL with reportId
        const url = new URL(window.location.href);
        url.searchParams.delete("view");
        url.searchParams.delete("step");
        url.searchParams.delete("category");
        url.searchParams.delete("billing");
        url.searchParams.delete("status");
        url.searchParams.set("reportId", data.reportId);
        window.history.replaceState(null, "", url.toString());
        return data.reportId;
      } else {
        throw new Error(data.error || "Failed to save report");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report. Please try again.");
      return null;
    } finally {
      setSavingReport(false);
    }
  }

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

    setEntries((prev) => [
      ...prev,
      {
        ...draft,
        id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    ]);
    setDraft({
      serviceName: "",
      category: "Streaming",
      status: "Active",
      billingCycle: "Monthly",
      monthlyCost: 15,
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
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {reportAuthor ? `Report by ${reportAuthor}` : "Manage & visualize subscriptions"}
            </h1>
            <p className="text-sm text-slate-600">
              {reportAuthor ? `Shared subscription report • ${entries.length} subscription${entries.length !== 1 ? 's' : ''}` : `Step ${step} of 2 • ${entries.length} subscription${entries.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (step === 1 && entries.length === 0) return;
                setStep((prev) => (prev === 1 ? 2 : 1));
              }}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={step === 1 && entries.length === 0}
            >
              {step === 1 ? "View Analytics" : "Back to Input"}
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={entries.length === 0}
            >
              Share / Export
            </button>
          </div>
        </header>

        {step === 1 && (
          <section className="grid gap-4 rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Enter your subscriptions</h2>
                <p className="text-sm text-slate-600">Add your records or load sample data to preview analytics.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEntries(sampleData)}
                  className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10"
                >
                  Load sample data
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEntries([])}
                    className="rounded-full border border-red-200 bg-white/70 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/10"
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
              <TextField label="Notes (optional)" value={draft.notes ?? ""} onChange={(v) => setDraft((p) => ({ ...p, notes: v }))} placeholder="Family plan" />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20"
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
            {loadingReport ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
                <p className="mt-4 text-lg font-medium text-slate-700">Loading report...</p>
                <p className="mt-2 text-sm text-slate-600">Please wait while we fetch your subscription data</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-lg font-medium text-slate-700">No data to visualize</p>
                <p className="mt-2 text-sm text-slate-600">Go back and add subscriptions first</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Back to Input
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
                  onCategoryChange={setCategoryFilter}
                  onCycleChange={setCycleFilter}
                  onStatusChange={setStatusFilter}
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
                          {mode === "treemap" && "Treemap"}
                          {mode === "swarm" && "Swarm Plot"}
                          {mode === "bubble" && "Bubble Chart"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white p-4">
                    {view === "treemap" && <TreemapView data={filtered} />}
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
          categoryFilter={categoryFilter}
          cycleFilter={cycleFilter}
          statusFilter={statusFilter}
          shareUrl={shareUrl}
          reportId={reportId}
          reportAuthor={reportAuthor}
          onSaveReport={handleSaveReport}
          savingReport={savingReport}
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
  onCategoryChange: (v: string) => void;
  onCycleChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  recordCount: number;
};

function FiltersBar({ categoryFilter, cycleFilter, statusFilter, onCategoryChange, onCycleChange, onStatusChange, recordCount }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm backdrop-blur">
      <Selector label="Category" value={categoryFilter} onChange={onCategoryChange} options={["All categories", ...categories]} />
      <Selector label="Billing" value={cycleFilter} onChange={onCycleChange} options={["All billing", ...billingCycles]} />
      <Selector label="Status" value={statusFilter} onChange={onStatusChange} options={["All statuses", ...statuses]} />
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-500">{recordCount} record{recordCount !== 1 ? 's' : ''}</span>
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
        className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
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
        className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
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
        className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
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
  categoryFilter: string;
  cycleFilter: string;
  statusFilter: string;
  shareUrl: string;
  reportId: string | null;
  reportAuthor: string | null;
  onSaveReport: (authorName: string) => Promise<string | null>;
  savingReport: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onShareNative: () => void;
  count: number;
};

function ShareExportModal({ onClose, view, categoryFilter, cycleFilter, statusFilter, shareUrl, reportId, reportAuthor, onSaveReport, savingReport, onExportCSV, onExportJSON, onShareNative, count }: ShareExportModalProps) {
  const [savedReportId, setSavedReportId] = useState<string | null>(reportId);
  const [shareableUrl, setShareableUrl] = useState(shareUrl);
  const [authorName, setAuthorName] = useState<string>("");

  const handleSaveAndShare = async () => {
    if (!authorName.trim()) {
      alert("Please enter your name to save the report");
      return;
    }
    const id = await onSaveReport(authorName.trim());
    if (id) {
      setSavedReportId(id);
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set("reportId", id);
      setShareableUrl(url.toString());
    }
  };

  const displayUrl = savedReportId ? shareableUrl : shareUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl backdrop-blur" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Share & Export</h3>
            <p className="mt-1 text-sm text-slate-600">
              View: <span className="font-medium">{view}</span> • Records: <span className="font-medium">{count}</span>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Save Report Section */}
          {!savedReportId && (
            <div className="rounded-2xl border border-sky-200/60 bg-sky-50/70 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Save Report</p>
              <p className="mt-2 text-sm text-slate-600">
                Save your subscriptions and filters to generate a permanent shareable link. Anyone with the link can view your report.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                />
                <p className="mt-1 text-xs text-slate-500">Your name will be displayed when others view this report</p>
              </div>
              <button
                type="button"
                onClick={handleSaveAndShare}
                disabled={savingReport || !authorName.trim()}
                className="mt-4 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingReport ? "Saving..." : "Save Report & Generate Link"}
              </button>
            </div>
          )}

          {/* Share Link Section */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              {savedReportId ? "Shareable Link" : "Sharing"}
            </p>
            {!savedReportId ? (
              <p className="mt-2 text-sm text-slate-600">
                Save the report to generate a shareable link that works in a new tab or on another device.
              </p>
            ) : (
              <>
                {reportAuthor && (
                  <p className="mt-1 text-xs text-slate-600">
                    Report by <span className="font-semibold">{reportAuthor}</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-green-600">
                  Report saved. This link will work for anyone with access to it.
                </p>
                <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/80 p-3">
                  <p className="break-all text-sm text-slate-700">{displayUrl}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton value={displayUrl} />
                  <button
                    type="button"
                    onClick={onShareNative}
                    className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10"
                  >
                    Native Share
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Social Media Share (only when report is saved) */}
          {savedReportId && (
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Social Media</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SocialButton label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`} />
                <SocialButton label="X / Twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(displayUrl)}&text=${encodeURIComponent('Check out my subscription analytics!')}`} />
                <SocialButton label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayUrl)}`} />
                <SocialButton label="Reddit" href={`https://reddit.com/submit?url=${encodeURIComponent(displayUrl)}&title=${encodeURIComponent('My Subscription Analytics')}`} />
              </div>
            </div>
          )}

          {/* Export Data */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Export Data</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                type="button" 
                onClick={onExportCSV} 
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20"
              >
                Download CSV
              </button>
              <button 
                type="button" 
                onClick={onExportJSON} 
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
              >
                Download JSON
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
      className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/10"
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
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}

function SocialButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}
