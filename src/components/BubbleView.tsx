"use client";

import { ResponsiveCirclePacking } from "@nivo/circle-packing";
import { useMemo } from "react";
import { SiHbo, SiLinkedin, SiPlaystation, SiAudible, SiNbc, SiNewyorktimes, SiApplemusic, SiIcloud } from "react-icons/si";
import { renderToString } from "react-dom/server";

// Brand logo SVGs
import NetflixLogo from "@/assets/brands/netflix.svg";
import SpotifyLogo from "@/assets/brands/spotify.svg";
import AmazonPrimeLogo from "@/assets/brands/amazonprime.svg";
import DisneyPlusLogo from "@/assets/brands/disneyplus.svg";
import YouTubeLogo from "@/assets/brands/youtube.svg";
import AppleLogo from "@/assets/brands/apple.svg";
import XboxLogo from "@/assets/brands/xbox.svg";
import HuluLogo from "@/assets/brands/hulu.svg";

type SubscriptionRecord = {
  id: string;
  serviceName: string;
  category: string;
  status: string;
  billingCycle: string;
  monthlyCost: number;
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

const serviceIconMap: Record<string, any> = {
  // SVG Brand Logos
  "Netflix": NetflixLogo,
  "Spotify": SpotifyLogo,
  "Amazon Prime": AmazonPrimeLogo,
  "Disney+": DisneyPlusLogo,
  "YouTube Premium": YouTubeLogo,
  "Apple iCloud": AppleLogo,
  "Apple Music": AppleLogo,
  "Xbox Game Pass": XboxLogo,
  "Hulu": HuluLogo,
  // React Icons (Simple Icons)
  "HBO Max": SiHbo,
  "LinkedIn Premium": SiLinkedin,
  "PlayStation Plus": SiPlaystation,
  "Peacock": SiNbc,
  "NYTimes": SiNewyorktimes,
  "Audible": SiAudible,
};

function getServiceInitial(serviceName: string): string {
  const trimmed = serviceName.trim();
  if (!trimmed) return "?";
  return trimmed[0]?.toUpperCase() ?? "?";
}

function getIconForService(serviceName: string, size: number, color: string): string {
  const Icon = serviceIconMap[serviceName];
  if (Icon) {
    // Check if it's a React component from react-icons (has size prop)
    if (typeof Icon === 'function' && Icon.name?.startsWith('Si')) {
      return renderToString(<Icon size={size} color={color} style={{ display: 'block', flexShrink: 0 }} />);
    }
    // Otherwise it's an SVG component from SVGR
    return renderToString(
      <Icon 
        width={size}
        height={size}
        style={{ 
          display: 'block',
          fill: color,
          color
        }} 
      />
    );
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
            color: colorMap[item.serviceName],
          })),
        };
      }),
    };

    return { bubbleData, colorMap };
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
          <h3 className="text-lg font-bold text-slate-100">Bubble Chart</h3>
          <p className="text-sm text-slate-400">Outer circles = categories • Inner = services • Size = annual cost</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Size = Annual Cost</span>
        </div>
      </div>
      <div className="glass h-[600px] overflow-hidden rounded-xl border border-slate-600/30 bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 p-4 shadow-lg">
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
                  
                  const badgeSize = Math.min(36, Math.max(28, radius * 0.6));
                  const iconSize = Math.floor(badgeSize * 0.6);
                  const iconColor = node.data?.color || "#3b82f6";
                  const iconSvg = getIconForService(node.id, iconSize, iconColor);
                  const initial = getServiceInitial(node.id);
                  
                  return (
                    <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                      <foreignObject
                        x={-badgeSize / 2}
                        y={-badgeSize / 2}
                        width={badgeSize}
                        height={badgeSize}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          style={{
                            width: `${badgeSize}px`,
                            height: `${badgeSize}px`,
                            opacity: 0.98,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            borderRadius: '9999px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                            userSelect: 'none',
                            padding: `${Math.max(6, badgeSize * 0.15)}px`,
                            overflow: 'hidden',
                          }}
                        >
                          {iconSvg ? (
                            <div
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%'
                              }}
                              dangerouslySetInnerHTML={{ __html: iconSvg }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: `${Math.max(12, Math.floor(badgeSize * 0.5))}px`,
                                fontWeight: 800,
                                color: '#ffffff',
                                lineHeight: 1,
                              }}
                            >
                              {initial}
                            </span>
                          )}
                        </div>
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
        <div className="glass rounded-lg px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Category Colors (Outer Bubbles)</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs font-semibold text-slate-300">{category}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-lg px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Status Indicators</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs font-semibold text-slate-300">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
