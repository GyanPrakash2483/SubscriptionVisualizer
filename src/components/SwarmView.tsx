"use client";

import { ResponsiveSwarmPlot } from "@nivo/swarmplot";
import { useMemo } from "react";

type SubscriptionRecord = {
  id: string;
  serviceName: string;
  category: string;
  status: string;
  billingCycle: string;
  monthlyCost: number;
  notes?: string;
};

type SwarmViewProps = {
  data: SubscriptionRecord[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

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

// Vibrant brand-specific colors (matching treemap)
const serviceColors: Record<string, string> = {
  "Netflix": "#E50914",
  "Spotify": "#1DB954",
  "Amazon Prime": "#00A8E1",
  "Disney+": "#113CCF",
  "YouTube Premium": "#FF0000",
  "Apple iCloud": "#555555",
  "Apple Music": "#FA243C",
  "Xbox Game Pass": "#107C10",
  "Hulu": "#3DBB3D",
  "HBO Max": "#5E4BA1",
  "LinkedIn Premium": "#0A66C2",
  "PlayStation Plus": "#003791",
  "Peacock": "#FFB23D",
  "NYTimes": "#000000",
  "Audible": "#FF9900",
};

// Fallback color palette
const fallbackColors = [
  "#F97316", "#EC4899", "#8B5CF6", "#14B8A6", "#EAB308",
  "#EF4444", "#10B981", "#3B82F6", "#F59E0B", "#06B6D4",
];

const statusColors: Record<string, string> = {
  Active: "#10b981",
  Cancelled: "#ef4444",
  Paused: "#f59e0b",
  Trial: "#3b82f6",
};

export default function SwarmView({ data }: SwarmViewProps) {
  const { swarmData, colorMap } = useMemo(() => {
    // Create color map for each service
    const colorMap: Record<string, string> = {};
    data.forEach((item, index) => {
      if (!colorMap[item.serviceName]) {
        colorMap[item.serviceName] = serviceColors[item.serviceName] || 
          fallbackColors[index % fallbackColors.length];
      }
    });

    const swarmData = data.map((item) => ({
      id: item.serviceName,
      group: item.category,
      serviceName: item.serviceName,
      category: item.category,
      status: item.status,
      monthly: monthlyValue(item),
      annual: annualValue(item),
      billing: item.billingCycle,
      volume: 50, // Fixed size for all items
      color: colorMap[item.serviceName],
    }));

    return { swarmData, colorMap };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border-2 border-dashed border-slate-600/30 glass">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-300">Nothing here</p>
          <p className="mt-1 text-sm text-slate-400">Add some subscriptions first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Swarm Distribution Plot</h3>
          <p className="text-sm text-slate-400">Each circle represents one subscription • Colored by service brand</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">X = Monthly Cost</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Y = Category</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Size = Revenue</span>
        </div>
      </div>
      <div className="glass h-[600px] overflow-hidden rounded-xl border border-slate-600/30 p-6 shadow-lg">
        <ResponsiveSwarmPlot
          data={swarmData}
          groups={Array.from(new Set(data.map((d) => d.category))).sort()}
          value="monthly"
          valueScale={{
            type: "linear",
            min: 0,
            max: "auto",
          }}
          size={{
            key: "volume",
            values: [0, 100],
            sizes: [8, 28],
          }}
          layout="horizontal"
          gap={4}
          forceStrength={3}
          simulationIterations={120}
          colors={(node: any) => node.data.color}
          borderWidth={3}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.4]],
          }}
          margin={{ top: 60, right: 100, bottom: 80, left: 160 }}
          axisTop={{
            tickSize: 10,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Monthly Cost ($)",
            legendPosition: "middle",
            legendOffset: -40,
            format: (v) => `$${v}`,
          }}
          axisBottom={{
            tickSize: 10,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Monthly Cost ($)",
            legendPosition: "middle",
            legendOffset: 60,
            format: (v) => `$${v}`,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: 0,
            legend: "Category",
            legendPosition: "middle",
            legendOffset: -120,
          }}
          enableGridX={true}
          enableGridY={false}
          gridXValues={10}
          animate={true}
          motionConfig="gentle"
          tooltip={(node: any) => (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-bold" style={{ color: node.data.color }}>
                  {node.data.serviceName}
                </div>
                <div 
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: statusColors[node.data.status] || "#64748b" }}
                >
                  {node.data.status}
                </div>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium">{node.data.category}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Monthly:</span>
                  <span className="font-semibold text-emerald-600">{currency.format(node.data.monthly)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Annual:</span>
                  <span className="font-medium">{currency.format(node.data.annual)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Billing:</span>
                  <span className="font-medium">{node.data.billing}</span>
                </div>
              </div>
            </div>
          )}
          theme={{
            background: "transparent",
            axis: {
              domain: {
                line: {
                  stroke: "#475569",
                  strokeWidth: 1,
                },
              },
              ticks: {
                line: {
                  stroke: "#475569",
                  strokeWidth: 1,
                },
                text: {
                  fill: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 500,
                },
              },
              legend: {
                text: {
                  fill: "#f1f5f9",
                  fontSize: 13,
                  fontWeight: 700,
                },
              },
            },
            grid: {
              line: {
                stroke: "#334155",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              },
            },
            tooltip: {
              container: {
                background: "#ffffff",
                fontSize: "12px",
                borderRadius: "8px",
                padding: 0,
              },
            },
          }}
        />
      </div>
      <div className="glass flex flex-wrap items-center justify-center gap-4 rounded-lg px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-2">Status Indicators:</p>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-xs font-semibold text-slate-300">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
