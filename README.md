# Subscription Visualizer

A powerful web application for visualizing subscription data through interactive **treemaps**, **swarm plots**, and **bubble charts**. Built with Next.js 16, React 19, and professional visualization library Nivo. Explore subscription patterns, identify trends, detect anomalies, and understand relationships across multiple dimensions.

## Features

### Professional Visualizations

- **Hierarchical Treemap**: Space-filling layout showing subscriptions grouped by category, sized by cost
- **Swarm Distribution Plot**: Individual data points showing cost distribution across categories with force-based collision detection
- **Circle Packing**: Nested bubble chart displaying hierarchical relationships between categories and subscriptions

### Interactive Features

- **Real-time filtering**: Filter by category, billing cycle, and status
- **Rich tooltips**: Detailed information on hover with formatted data
- **Smooth animations**: Professional transitions using Nivo's motion system
- **Responsive design**: Optimized for desktop, tablet, and mobile
- **Color-coded legends**: Visual guides for status and categories

### Export & Sharing

- **CSV Export**: Download filtered subscription data
- **JSON Export**: Export data in JSON format
- **Social Sharing**: Share to LinkedIn, Twitter, Facebook, Reddit
- **Native Share API**: Use device's built-in sharing on mobile
- **URL State Persistence**: Shareable links preserve filters and view state

### Analytics Dashboard

- **Monthly Spend**: Total monthly cost with annual plan prorating
- **Annual Spend**: Total annualized subscription costs
- **Active vs Cancelled**: Current subscription status breakdown
- **Average Cost**: Per-subscription average monthly cost

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subscription_visualizer
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
subscription_visualizer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Main application page
│   │   ├── layout.tsx         # Root layout with fonts
│   │   └── globals.css        # Global styles with Tailwind v4
│   └── components/            # Visualization components
│       ├── TreemapView.tsx    # Nivo treemap visualization
│       ├── SwarmView.tsx      # Nivo swarm plot visualization
│       └── BubbleView.tsx     # Nivo circle packing visualization
├── public/                     # Static assets
├── specifications.md           # Detailed project specifications
└── package.json               # Dependencies and scripts
```

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **UI Library**: React 19 with React Compiler
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Visualizations**: [Nivo](https://nivo.rocks) (D3-based)
- **Language**: TypeScript 5
- **Build Tool**: Turbopack (Next.js 16 default)
- **Package Manager**: pnpm

## Visualization Details

### Treemap
- **Layout Algorithm**: Squarify algorithm for optimal space utilization
- **Hierarchy**: Two levels (categories to subscriptions)
- **Color Coding**: Status-based coloring (Active=green, Cancelled=red, Paused=amber, Trial=blue)
- **Sizing**: Proportional to monthly cost
- **Interactions**: Hover tooltips with detailed metrics

### Swarm Plot
- **Distribution**: Force-directed simulation for collision-free positioning
- **X-axis**: Monthly cost (linear scale)
- **Y-axis**: Categories (ordinal scale)
- **Size Encoding**: Circle size represents usage hours
- **Color Coding**: Status-based coloring
- **Grid**: Dashed gridlines for cost reference

### Circle Packing (Bubble Chart)
- **Layout**: Hierarchical circle packing with nesting
- **Hierarchy**: Two levels (categories to subscriptions)
- **Color Scheme**: Category-based gradient colors
- **Sizing**: Bubble area proportional to annual cost
- **Background**: Dark gradient for visual contrast
- **Interactions**: Rich tooltips showing aggregated metrics

## Data Model

Each subscription includes:
- Service name and category
- Status (Active, Cancelled, Paused, Trial)
- Billing cycle (Monthly, Annual)
- Cost information (monthly and annual)
- Start and renewal dates
- Optional usage metrics and notes

## Usage

1. **Step 1 - Add Subscriptions**
   - Manually enter subscription details
   - Or load sample data to explore features
   - View all entries in an organized table

2. **Step 2 - Analyze Data**
   - Switch between visualization types
   - Apply filters to focus on specific data
   - Export or share insights

## Development

### Available Scripts

- `pnpm dev` - Start development server (with Turbopack)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- ESLint with Next.js 16 configuration
- TypeScript strict mode enabled
- Tailwind CSS v4 with native CSS layers
- Component-based architecture with dynamic imports

## References & Inspiration

This project draws inspiration from:
- [visualize.nguyenvu.dev](https://visualize.nguyenvu.dev/) - Data visualization patterns
- [vexly.app/demo](https://vexly.app/demo) - Subscription management UX
- [Nivo](https://nivo.rocks) - Professional visualization components

## Design Philosophy

- **Professional & Beautiful**: Using Nivo's polished components for production-quality visualizations
- **Responsive**: Mobile-first design that scales elegantly
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Performance**: Dynamic imports and optimized rendering
- **User-Centric**: Intuitive interactions with helpful tooltips

## License

This project is open source and available for educational and commercial use.

## Contributing

Contributions are welcome! Please read the [specifications document](./specifications.md) to understand the project requirements before contributing.

## Future Enhancements

- Real-time data sync
- Advanced analytics overlays
- Custom color palette editor
- Saved visualization presets
- PDF report generation
- Multi-user collaboration
- API integration for external data sources

---

Built with Next.js 16, React 19, Tailwind CSS v4, and Nivo
