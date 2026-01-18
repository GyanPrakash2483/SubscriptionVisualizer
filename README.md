# Subscription Visualizer

A powerful web application for visualizing subscription data through interactive heatmaps, swarm plots, and bubble charts. Explore subscription patterns, identify trends, detect anomalies, and understand relationships across multiple dimensions.

## Overview

Subscription Visualizer enables users to transform complex subscription data into intuitive visualizations that reveal insights about:
- Subscription patterns over time
- Revenue distribution across plans and regions
- User behavior and engagement metrics
- Churn analysis and risk assessment
- Growth trends and forecasting

## Features

### Visualization Types

- **Heatmap Grid**: Display subscription metrics aggregated across two dimensions using color intensity
- **Swarm Plot**: Visualize individual subscription data points in a swarm layout to show distribution and clusters
- **Bubble Chart**: Compare categories using bubble size and position to represent multiple dimensions

### Key Capabilities

- Interactive filtering and drill-down capabilities
- Multiple layout options (grid, radial, packed)
- Real-time data updates
- Responsive design for all screen sizes
- Export visualizations in multiple formats (PNG, SVG, PDF, CSV)
- Social media sharing with optimized previews
- Customizable color palettes and themes
- Accessibility features and keyboard navigation

## Getting Started

### Prerequisites

- Node.js 18+ 
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
│   └── app/              # Next.js app directory
│       ├── page.tsx      # Main page component
│       ├── layout.tsx    # Root layout
│       └── globals.css   # Global styles
├── public/               # Static assets
├── specifications.md     # Detailed project specifications
└── package.json          # Dependencies and scripts
```

## Specifications

For detailed feature specifications, data models, visualization requirements, and implementation guidelines, please refer to the [**Specifications Document**](./specifications.md).

The specifications document includes:
- Complete data model definitions
- Detailed visualization type specifications
- Interaction and UI/UX requirements
- Social media sharing features
- Technical requirements
- Implementation priorities

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) 16+
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Package Manager**: pnpm

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

This project uses ESLint with Next.js configuration. Code formatting follows Next.js and React best practices.

## Contributing

Contributions are welcome! Please read the specifications document to understand the project requirements before contributing.

## License

[Add your license here]

## References

This project draws inspiration from:
- [visualize.nguyenvu.dev](https://visualize.nguyenvu.dev/)
- [vexly.app/demo](https://vexly.app/demo)

## Support

For questions, issues, or feature requests, please open an issue in the repository.
