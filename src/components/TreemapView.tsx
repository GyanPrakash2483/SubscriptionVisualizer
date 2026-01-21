"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { Tv, Music, Gamepad2, ShoppingBag, Newspaper, Settings, LayoutGrid } from "lucide-react";
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

type TreemapViewProps = {
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

// Vibrant brand-specific colors
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

export default function TreemapView({ data }: TreemapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { totalValue, colorMap } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + monthlyValue(item), 0);
    
    // Create color map for each service
    const colorMap: Record<string, string> = {};
    data.forEach((item, index) => {
      if (!colorMap[item.serviceName]) {
        colorMap[item.serviceName] = serviceColors[item.serviceName] || 
          fallbackColors[index % fallbackColors.length];
      }
    });

    return { totalValue: total, colorMap };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Prepare data for treemap
    const treemapData = data.map((item) => {
      const monthly = monthlyValue(item);
      const percentage = totalValue > 0 ? (monthly / totalValue) * 100 : 0;
      
      return {
        name: item.serviceName,
        value: monthly,
        monthly,
        annual: annualValue(item),
        percentage,
        status: item.status,
        category: item.category,
        billing: item.billingCycle,
        color: colorMap[item.serviceName],
      };
    });

    const root = d3
      .hierarchy({ children: treemapData } as any)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3
      .treemap<any>()
      .size([width - 16, height - 16])
      .padding(3)
      .round(true);

    treemapLayout(root);

    // Create cells
    const cells = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x0 + 8},${d.y0 + 8})`);

    // Add rectangles with gradient
    cells
      .append("defs")
      .append("linearGradient")
      .attr("id", (d: any, i) => `gradient-${i}`)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%")
      .selectAll("stop")
      .data((d: any) => [
        { offset: "0%", color: d.data.color },
        { offset: "100%", color: d3.color(d.data.color)?.darker(0.3) || d.data.color },
      ])
      .join("stop")
      .attr("offset", (d: any) => d.offset)
      .attr("stop-color", (d: any) => d.color);

    cells
      .append("rect")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d: any, i) => `url(#gradient-${i})`)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("rx", 8)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
      .on("mouseenter", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))")
          .attr("stroke-width", 4);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
          .attr("stroke-width", 3);
      });

    // Add brand icons using foreignObject
    cells.each(function(d: any) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      
      if (width > 80 && height > 80) {
        const badgeSize = 36;
        const iconSize = 20;
        const iconColor = serviceColors[d.data.name] || "#3b82f6";
        const iconSvg = getIconForService(d.data.name, iconSize, iconColor);
        const content = iconSvg
          ? iconSvg
          : `<span style="
              font-size: 16px;
              font-weight: 800;
              color: #ffffff;
              line-height: 1;
              font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
            ">${getServiceInitial(d.data.name)}</span>`;

        d3.select(this)
          .append("foreignObject")
          .attr("x", 8)
          .attr("y", 8)
          .attr("width", badgeSize)
          .attr("height", badgeSize)
          .style("pointer-events", "none")
          .html(
            `<div style="
              width: ${badgeSize}px;
              height: ${badgeSize}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(15, 23, 42, 0.85);
              border-radius: 9999px;
              border: 1px solid rgba(148, 163, 184, 0.2);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
              opacity: 0.98;
              pointer-events: none;
              user-select: none;
              padding: 6px;
              overflow: hidden;
            ">${content}</div>`
          );
      }
    });

    // Add service name
    cells
      .append("text")
      .attr("x", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? 8 : (width / 2);
      })
      .attr("y", (d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const reserveIconSpace = width > 80 && height > 80;
        // If we render an icon badge at the top, push the label down a bit for breathing room.
        return width > 80 ? (reserveIconSpace ? 54 : 28) : 18;
      })
      .attr("text-anchor", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? "start" : "middle";
      })
      .style("font-size", (d: any) => {
        const width = d.x1 - d.x0;
        if (width > 140) return "14px";
        if (width > 100) return "12px";
        return "11px";
      })
      .style("font-weight", "700")
      .style("fill", "#ffffff")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const width = d.x1 - d.x0;
        const name = d.data.name;
        if (width < 80) return "";
        if (width < 120 && name.length > 12) return name.substring(0, 10) + "...";
        return name;
      });

    // Add monthly cost
    cells
      .append("text")
      .attr("x", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? 8 : (width / 2);
      })
      .attr("y", (d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const reserveIconSpace = width > 80 && height > 80;
        if (width > 80) return reserveIconSpace ? 74 : 52;
        return height / 2 + 6;
      })
      .attr("text-anchor", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? "start" : "middle";
      })
      .style("font-size", (d: any) => {
        const width = d.x1 - d.x0;
        if (width > 140) return "16px";
        if (width > 100) return "14px";
        return "12px";
      })
      .style("font-weight", "700")
      .style("fill", "#ffffff")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        if (width < 80 || height < 60) return "";
        return `${currency.format(d.data.monthly)}/mo`;
      });

    // Add percentage
    cells
      .append("text")
      .attr("x", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? 8 : (width / 2);
      })
      .attr("y", (d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const reserveIconSpace = width > 80 && height > 80;
        return width > 80 ? (reserveIconSpace ? 94 : 72) : height - 10;
      })
      .attr("text-anchor", (d: any) => {
        const width = d.x1 - d.x0;
        return width > 80 ? "start" : "middle";
      })
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#ffffff")
      .style("opacity", "0.95")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        if (width < 100 || height < 80) return "";
        return `${d.data.percentage.toFixed(1)}% of total`;
      });



    // Create tooltip
    const tooltip = d3
      .select("body")
      .selectAll(".d3-treemap-tooltip")
      .data([null])
      .join("div")
      .attr("class", "d3-treemap-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(15, 23, 42, 0.95)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 10px 25px rgba(0,0,0,0.3)")
      .style("backdrop-filter", "blur(4px)")
      .style("max-width", "280px");

    cells
      .on("mousemove", function(event, d: any) {
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="font-weight: 700; font-size: 14px; color: ${d.data.color}; margin-bottom: 8px;">
              ${d.data.name}
            </div>
            <div style="display: grid; gap: 4px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; gap: 24px;">
                <span style="color: #94a3b8;">Category:</span>
                <span style="font-weight: 600;">${d.data.category}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 24px;">
                <span style="color: #94a3b8;">Monthly:</span>
                <span style="font-weight: 700; color: #10b981;">${currency.format(d.data.monthly)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 24px;">
                <span style="color: #94a3b8;">Annual:</span>
                <span style="font-weight: 600;">${currency.format(d.data.annual)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 24px;">
                <span style="color: #94a3b8;">% of Total:</span>
                <span style="font-weight: 700; color: #a78bfa;">${d.data.percentage.toFixed(1)}%</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 24px;">
                <span style="color: #94a3b8;">Billing:</span>
                <span style="font-weight: 600;">${d.data.billing}</span>
              </div>
            </div>
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseleave", function() {
        tooltip.style("visibility", "hidden");
      });

  }, [data, totalValue, colorMap]);

  if (data.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-600">No data available</p>
          <p className="mt-1 text-sm text-slate-500">Add subscriptions to view the treemap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Subscription Treemap</h3>
          <p className="text-sm text-slate-400">
            {data.length} subscription{data.length !== 1 ? 's' : ''} • Total: {currency.format(totalValue)}/month
          </p>
        </div>
      </div>
      <div ref={containerRef} className="glass h-[600px] overflow-hidden rounded-xl border border-slate-600/30 p-2 shadow-lg">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
