"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Github } from "lucide-react";

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
    <main className="relative min-h-screen px-4 py-8 text-slate-100 md:px-6 md:py-10">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-strong rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-10 w-1 rounded-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Subscription Visualizer</p>
              </div>
              <h1 className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
                {reportAuthor ? `Report by ${reportAuthor}` : "Manage & visualize subscriptions"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
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
                className="btn-primary glow-hover rounded-xl px-6 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={step === 1 && entries.length === 0}
              >
                {step === 1 ? "View Analytics →" : "← Back to Input"}
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="rounded-xl border border-slate-600/50 bg-slate-700/40 px-6 py-3 text-sm font-bold text-slate-100 shadow-lg backdrop-blur-sm transition hover:border-slate-500/70 hover:bg-slate-600/50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={entries.length === 0}
              >
                Share / Export
              </button>
            </div>
          </div>
        </header>

        {step === 1 && (
          <section className="glass-strong grid gap-4 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Enter your subscriptions</h2>
                <p className="text-sm text-slate-400">Add your records or load sample data to preview analytics.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEntries(sampleData)}
                  className="glass rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 shadow-lg transition hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20"
                >
                  Load sample data
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEntries([])}
                    className="glass rounded-xl px-4 py-2 text-sm font-semibold text-red-400 shadow-lg transition hover:bg-red-900/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
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
                className="btn-primary glow-hover rounded-xl px-8 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
              >
                Add Subscription
              </button>
            </div>

            {entries.length > 0 && (
              <div className="glass overflow-auto rounded-xl">
                <table className="min-w-full divide-y divide-slate-700/50 text-sm">
                  <thead className="bg-slate-800/30">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Billing</th>
                      <th className="px-4 py-3 text-right">Monthly</th>
                      <th className="px-4 py-3 text-right">Annual</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {entries.map((row) => (
                      <tr key={row.id} className="transition hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-medium text-slate-100">{row.serviceName}</td>
                        <td className="px-4 py-3 text-slate-300">{row.category}</td>
                        <td className="px-4 py-3 text-slate-300">{row.billingCycle}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-100">{currency.format(monthlyValue(row))}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{currency.format(annualValue(row))}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
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
              <div className="glass rounded-xl border-2 border-dashed border-slate-600/30 p-8 text-center">
                <p className="text-sm font-medium text-slate-300">No subscriptions yet</p>
                <p className="mt-1 text-xs text-slate-500">Add your first subscription or load sample data to get started</p>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <>
            {loadingReport ? (
              <div className="glass-strong rounded-2xl border-2 border-dashed border-slate-600/30 p-12 text-center">
                <div className="glow inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500"></div>
                <p className="mt-4 text-lg font-medium text-slate-200">Loading report...</p>
                <p className="mt-2 text-sm text-slate-400">Please wait while we fetch your subscription data</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="glass-strong rounded-2xl border-2 border-dashed border-slate-600/30 p-12 text-center">
                <p className="text-lg font-medium text-slate-200">No data to visualize</p>
                <p className="mt-2 text-sm text-slate-400">Go back and add subscriptions first</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="glow-hover mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-purple-500"
                >
                  Back to Input
                </button>
              </div>
            ) : (
              <>
                <section className="glass-strong grid gap-4 rounded-2xl p-6 shadow-xl md:grid-cols-2 lg:grid-cols-4">
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

                <section className="glass-strong rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["treemap", "swarm", "bubble"] as ViewMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setView(mode)}
                          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                            view === mode 
                              ? "btn-primary glow text-white shadow-xl" 
                              : "border border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500/70 hover:bg-slate-600/40"
                          }`}
                        >
                          {mode === "treemap" && "Treemap"}
                          {mode === "swarm" && "Swarm Plot"}
                          {mode === "bubble" && "Bubble Chart"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4">
                    {view === "treemap" && <TreemapView data={filtered} />}
                    {view === "swarm" && <SwarmView data={filtered} />}
                    {view === "bubble" && <BubbleView data={filtered} />}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        <footer className="glass-strong mt-8 rounded-2xl border-t border-slate-700/50 p-6 text-center text-xs text-slate-400">
          <p>Built with Next.js 16, React 19, and Tailwind CSS v4</p>
          <p className="mt-1">
            Made with{' '}
            <a
              href="https://kombai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-semibold text-transparent transition hover:from-blue-300 hover:to-purple-300"
            >
              Kombai
            </a>
          </p>
          <a
            href="https://github.com/GyanPrakash2483/SubscriptionVisualizer"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-300"
            aria-label="View source on GitHub"
          >
            <Github size={14} />
            <span>View Source</span>
          </a>
          <p className="mt-2 text-slate-600">© 2026 gyanprakash2483@gmail.com</p>
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
    sky: "from-blue-500/20 to-cyan-500/20 border-blue-400/20",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-400/20",
    emerald: "from-emerald-500/20 to-green-500/20 border-emerald-400/20",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-400/20",
  };

  const textColors = {
    sky: "text-blue-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <div className={`glass rounded-xl border bg-gradient-to-br p-4 shadow-lg ${colorClasses[color]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${textColors[color]}`}>{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
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
    <div className="glass-strong flex flex-wrap items-center gap-3 rounded-2xl p-4 shadow-xl">
      <Selector label="Category" value={categoryFilter} onChange={onCategoryChange} options={["All categories", ...categories]} />
      <Selector label="Billing" value={cycleFilter} onChange={onCycleChange} options={["All billing", ...billingCycles]} />
      <Selector label="Status" value={statusFilter} onChange={onStatusChange} options={["All statuses", ...statuses]} />
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-400">{recordCount} record{recordCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

type SelectorProps = { label: string; value: string; options: string[]; onChange: (v: string) => void };
function Selector({ label, value, options, onChange }: SelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="input-enhanced rounded-xl px-4 py-2.5 text-sm font-medium text-slate-100 shadow-sm"
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
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        step={step}
        placeholder={placeholder}
        className="input-enhanced rounded-xl px-4 py-2.5 text-sm font-medium text-slate-100 placeholder:text-slate-500"
      />
    </label>
  );
}

type SelectFieldProps = { label: string; value: string; options: string[]; onChange: (v: string) => void };
function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-200">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="input-enhanced rounded-xl px-4 py-2.5 text-sm font-medium text-slate-100 shadow-sm"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="glass-strong w-full max-w-2xl rounded-3xl border border-slate-600/30 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Share & Export</h3>
            <p className="mt-1 text-sm text-slate-400">
              View: <span className="font-medium text-slate-300">{view}</span> • Records: <span className="font-medium text-slate-300">{count}</span>
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="glass rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Save Report Section */}
          {!savedReportId && (
            <div className="glass rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-400">Save Report</p>
              <p className="mt-2 text-sm text-slate-300">
                Save your subscriptions and filters to generate a permanent shareable link. Anyone with the link can view your report.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-enhanced w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-100 placeholder:text-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">Your name will be displayed when others view this report</p>
              </div>
              <button
                type="button"
                onClick={handleSaveAndShare}
                disabled={savingReport || !authorName.trim()}
                className="btn-primary glow-hover mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingReport ? "Saving..." : "Save Report & Generate Link"}
              </button>
            </div>
          )}

          {/* Share Link Section */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {savedReportId ? "Shareable Link" : "Sharing"}
            </p>
            {!savedReportId ? (
              <p className="mt-2 text-sm text-slate-300">
                Save the report to generate a shareable link that works in a new tab or on another device.
              </p>
            ) : (
              <>
                {reportAuthor && (
                  <p className="mt-1 text-xs text-slate-400">
                    Report by <span className="font-semibold text-slate-300">{reportAuthor}</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-emerald-400">
                  Report saved. This link will work for anyone with access to it.
                </p>
                <div className="glass mt-3 rounded-xl p-3">
                  <p className="break-all text-sm text-slate-200">{displayUrl}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton value={displayUrl} />
                  <button
                    type="button"
                    onClick={onShareNative}
                    className="glass rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                  >
                    Native Share
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Social Media Share (only when report is saved) */}
          {savedReportId && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Social Media</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SocialButton label="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`} />
                <SocialButton label="X / Twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(displayUrl)}&text=${encodeURIComponent('Check out my subscription analytics!')}`} />
                <SocialButton label="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(displayUrl)}`} />
                <SocialButton label="Reddit" href={`https://reddit.com/submit?url=${encodeURIComponent(displayUrl)}&title=${encodeURIComponent('My Subscription Analytics')}`} />
              </div>
            </div>
          )}

          {/* Export Data */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Export Data</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button 
                type="button" 
                onClick={onExportCSV} 
                className="glow-hover rounded-xl border border-cyan-500/30 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-xl transition hover:from-blue-500 hover:to-cyan-500 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
              >
                Download CSV
              </button>
              <button 
                type="button" 
                onClick={onExportJSON} 
                className="glow-hover rounded-xl border border-pink-500/30 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-xl transition hover:from-purple-500 hover:to-pink-500 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/40"
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
      className="glass rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
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
      {copied ? "✓ Copied!" : "Copy Link"}
    </button>
  );
}

function SocialButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      className="glass rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700/50"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}
