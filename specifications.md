## Specifications (Implemented)

### Overview
Subscription Visualizer is a single-page Next.js app that lets users enter subscription records and analyze **costs** across three visualization modes:
- **Treemap** (custom D3): space-filling cost distribution
- **Swarm Plot** (Nivo): per-subscription points grouped by category
- **Circle Packing** (Nivo): category → subscription hierarchy sized by annualized cost

The current implementation focuses on **cost analytics** and **sharing/export** (CSV/JSON + optional saved report links).

### User Flow
- **Step 1: Enter subscriptions**
  - Add records with: service name, category, status, billing cycle, cost, optional notes
  - Load sample data
  - Remove entries / clear all
- **Step 2: Analyze & export**
  - View summary cards (monthly spend, annual spend, active/cancelled, avg monthly cost)
  - Filter by category / billing cycle / status
  - Switch between Treemap / Swarm / Bubble views
  - Export CSV/JSON
  - Share via URL (filters/view reflected in URL) and optional MongoDB-backed saved report links

---

## Data Model (Current)

### Subscription Record
Each record is represented in the UI as:
- `id`: string (generated client-side)
- `serviceName`: string
- `category`: one of `Streaming | Music | Gaming | Shopping | News | Utilities | Other`
- `status`: one of `Active | Cancelled | Paused | Trial`
- `billingCycle`: one of `Monthly | Annual`
- `monthlyCost`: number (stored as a single numeric amount; annualized/monthly values are derived)
- `notes?`: string

### Derived Cost Helpers
- **Monthly value**: if `billingCycle === "Annual"` then `monthlyCost / 12`, else `monthlyCost`
- **Annual value**: if `billingCycle === "Annual"` then `monthlyCost`, else `monthlyCost * 12`

### Aggregates (shown as summary cards)
- Total monthly spend (annual plans prorated)
- Total annualized spend
- Active count / cancelled count
- Average monthly cost per subscription

---

## Visualizations (Current)

### Treemap (D3)
- **What it shows**: each subscription record as a rectangle sized by monthly cost
- **Styling**: brand-colored tiles, status badge + legend, rich tooltip
- **Service mark**: icon in a white badge; if no icon exists, show the service’s first letter in a white badge

### Swarm Plot (Nivo)
- **What it shows**: one point per subscription record
- **X-axis**: monthly cost
- **Y-axis**: category
- **Color**: service brand color (fallback palette if unknown)
- **Tooltip**: service, status, category, monthly/annual, billing cycle

### Circle Packing (Nivo)
- **What it shows**: category (outer) → subscriptions (inner)
- **Size**: annualized cost
- **Color**: category colors for outer nodes, brand colors for subscription nodes
- **Service mark**: icon in a white badge; if no icon exists, show the service’s first letter in a white badge

---

## Export & Sharing (Current)

### Export
- **CSV export**: downloads the currently filtered records
- **JSON export**: downloads the currently filtered records

### Sharing
- **URL state**: current view + filters are reflected in the URL
- **Saved reports (optional)**:
  - `POST /api/reports` saves subscriptions + filters + view + summary to MongoDB and returns a `reportId`
  - `GET /api/reports?id=<reportId>` loads a saved report
  - Saved report links can be shared and opened on another device
- **Social share links**: LinkedIn, X/Twitter, Facebook, Reddit (shown once a report is saved)
- **Native share**: uses the Web Share API when available

### MongoDB Requirement (for saved reports)
To enable saving/loading reports, set:
- `MONGO_URI` (typically in `.env.local`)

