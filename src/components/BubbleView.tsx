"use client";

import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { useMemo } from "react";
import { SiHbo, SiLinkedin, SiPlaystation, SiAudible, SiNbc, SiNewyorktimes, SiApplemusic } from "react-icons/si";
import { renderToString } from "react-dom/server";

type SubscriptionRecord = {
  id: string;
  serviceName: string;
  category: string;
  status: string;
  billingCycle: string;
  monthlyCost: number;
  annualCost?: number;
  startDate: string;
  renewalDate: string;
  usage?: number;
  notes?: string;
};

type BubbleViewProps = {
  data: SubscriptionRecord[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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

// Category colors (for outer bubbles)
const categoryColors: Record<string, string> = {
  Streaming: "#0ea5e9",
  Music: "#8b5cf6",
  Gaming: "#ec4899",
  Shopping: "#f97316",
  News: "#14b8a6",
  Utilities: "#6366f1",
  Other: "#84cc16",
};

// Vibrant brand-specific colors (for inner subscription bubbles)
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

function getIconForService(serviceName: string): string {
  const iconMap: Record<string, any> = {
    "HBO Max": SiHbo,
    "LinkedIn Premium": SiLinkedin,
    "PlayStation Plus": SiPlaystation,
    "Peacock": SiNbc,
    "NYTimes": SiNewyorktimes,
    "Audible": SiAudible,
    "Apple Music": SiApplemusic,
  };

  const Icon = iconMap[serviceName];
  if (Icon) {
    return renderToString(<Icon size={20} color="#ffffff" />);
  }
  return "";
}

export default function BubbleView({ data }: BubbleViewProps) {
  const { bubbleData, colorMap } = useMemo(() => {
    // Create color map for each service
    const colorMap: Record<string, string> = {};
    data.forEach((item, index) => {
      if (!colorMap[item.serviceName]) {
        colorMap[item.serviceName] = serviceColors[item.serviceName] || 
          fallbackColors[index % fallbackColors.length];
      }
    });

    // Group by category
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, SubscriptionRecord[]>);

    const bubbleData = {
      name: "subscriptions",
      children: Object.entries(grouped).map(([category, items]) => {
        const totalAnnual = items.reduce((sum, item) => sum + annualValue(item), 0);
        const totalMonthly = items.reduce((sum, item) => sum + monthlyValue(item), 0);
        const activeCount = items.filter((item) => item.status === "Active").length;
        
        return {
          name: category,
          category,
          value: totalAnnual,
          count: items.length,
          active: activeCount,
          monthly: totalMonthly,
          annual: totalAnnual,
          children: items.map((item) => ({
            name: item.serviceName,
            category: item.category,
            status: item.status,
            value: annualValue(item),
            monthly: monthlyValue(item),
            annual: annualValue(item),
            billing: item.billingCycle,
            usage: item.usage,
            color: colorMap[item.serviceName],
          })),
        };
      }),
    };

    return { bubbleData, colorMap };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-600">No data available</p>
          <p className="mt-1 text-sm text-slate-500">Add subscriptions to view the bubble chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hierarchical Circle Packing</h3>
          <p className="text-sm text-slate-600">Categories in outer bubbles • Services in inner bubbles • Sized by annual cost</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Size = Annual Cost</span>
        </div>
      </div>
      <div className="h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-sm">
        <ResponsiveCirclePacking
          data={bubbleData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          id="name"
          value="value"
          colors={(node: any) => {
            // If it's a leaf node (subscription), use brand color
            if (node.depth === 2) {
              return node.data.color || "#64748b";
            }
            // If it's a category node
            if (node.depth === 1) {
              return categoryColors[node.data.name] || "#64748b";
            }
            return "#1e293b";
          }}
          childColor={{
            from: "color",
            modifiers: [],
          }}
          padding={6}
          enableLabels={true}
          label={(node: any) => {
            if (node.depth === 1) {
              // Category level
              return `${node.id} (${node.data.count})`;
            }
            if (node.depth === 2 && node.value > 200) {
              // Subscription level - only show if large enough
              return node.id;
            }
            return "";
          }}
          labelTextColor="#ffffff"
          labelsSkipRadius={18}
          borderWidth={3}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.5]],
          }}
          animate={true}
          motionConfig="gentle"
          layers={['circles', 'labels', ({ nodes }: any) => (
            <g key="icons">
              {nodes
                .filter((node: any) => node.depth === 2) // Only subscription bubbles
                .map((node: any) => {
                  const radius = node.radius;
                  // Only show icons for bubbles with radius > 20
                  if (radius < 20) return null;
                  
                  const iconSvg = getIconForService(node.id);
                  if (!iconSvg) return null;

                  const iconSize = Math.min(24, radius * 0.6);
                  
                  return (
                    <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                      <foreignObject
                        x={-iconSize / 2}
                        y={-iconSize / 2}
                        width={iconSize}
                        height={iconSize}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                            opacity: 0.95,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          dangerouslySetInnerHTML={{ __html: iconSvg }}
                        />
                      </foreignObject>
                    </g>
                  );
                })}
            </g>
          )]}

          tooltip={(node: any) => {
            if (node.depth === 1) {
              // Category level
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: categoryColors[node.id] || "#64748b" }}
                    ></div>
                    <div className="text-sm font-bold text-slate-900">{node.id}</div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Subscriptions:</span>
                      <span className="font-semibold text-slate-900">{node.data.count}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Active:</span>
                      <span className="font-medium text-emerald-600">{node.data.active}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Monthly Total:</span>
                      <span className="font-semibold text-slate-900">{currency.format(node.data.monthly)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Annual Total:</span>
                      <span className="font-semibold text-sky-600">{currency.format(node.data.annual)}</span>
                    </div>
                  </div>
                </div>
              );
            }

            if (node.depth === 2) {
              // Subscription level
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: node.data.color }}
                      ></div>
                      <div className="text-sm font-bold text-slate-900">{node.id}</div>
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
                      <span className="font-semibold text-sky-600">{currency.format(node.data.annual)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Billing:</span>
                      <span className="font-medium">{node.data.billing}</span>
                    </div>
                    {node.data.usage && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Usage:</span>
                        <span className="font-medium">{node.data.usage}h/month</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return <></>;
          }}
          theme={{
            labels: {
              text: {
                fontSize: 13,
                fontWeight: 700,
                fill: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.6)",
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
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Category Colors (Outer Bubbles)</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs font-semibold text-slate-700">{category}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Status Indicators</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs font-semibold text-slate-700">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
