## Specifications

### Overview
A consumer subscription manager that lets people enter their recurring services (e.g., Netflix, Amazon Prime, Disney+, Spotify, Hulu), then view analytics across three interactive modes: **Heatmap Grid**, **Swarm Plot**, and **Bubble Chart**. The goal is to track spend, renewal risk, and usage patterns over time.

### User Flow
- **Step 1: Enter subscriptions** — Users add their services (name, category, billing cycle, cost, start/renewal dates, status, optional usage/notes). Option to load sample providers.
- **Step 2: Analyze & export** — Users view spend analytics (heatmap, swarm, bubbles), filter by category/status/billing cycle, and export/share (CSV/JSON/share URL/native share).

### References
 - https://visualize.nguyenvu.dev/
 - https://vexly.app/demo


## Data Model

### Core Subscription Fields (consumer-focused)

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `subscription_id` | string/UUID | Unique identifier | "sub_123456" |
| `service_name` | string | Provider name | Netflix, Amazon Prime, Disney+, Spotify |
| `category` | categorical | Service category | Streaming, Music, Gaming, Shopping, News, Utilities |
| `status` | categorical | Current status | Active, Cancelled, Paused, Trial |
| `billing_cycle` | categorical | Recurrence period | Monthly, Annual |
| `monthly_cost` | numeric | Monthly price (or annual / 12) | 15.49 |
| `annual_cost` | numeric | Annual price (if billed annually) | 139.00 |
| `start_date` | date | Subscription start | ISO 8601 |
| `renewal_date` | date | Next renewal date | ISO 8601 |
| `usage` | numeric | Optional usage metric (hours watched, streams, etc.) | 120 (hrs/month) |
| `notes` | string | Optional notes | "Student discount", "Family plan" |

### Aggregated Metrics
- Total monthly spend (annualized for yearly plans)
- Total annual spend
- Active vs cancelled count
- Average monthly cost per subscription
- Category-level spend distribution

---

## Visualization Types

### 1. Heatmap Grid

#### Purpose
Display subscription metrics aggregated across two dimensions (e.g., time × plan type, region × status) using color intensity to represent values.

#### Features

**Layout Options:**
- **Grid Layout**: Standard matrix with rows and columns
- **Radial Heatmap**: Circular arrangement for time-based or hierarchical data
- **Flattened Layout**: Single-row or single-column view for focused analysis

**Data Mapping:**
- X-axis: Categorical or time dimension (e.g., months, subscription types, regions)
- Y-axis: Categorical dimension (e.g., plan types, user segments, status)
- Cell value: Aggregated metric (count, revenue, churn rate, average usage)
- Color intensity: Maps to cell value using gradient scale

**Visual Customization:**
- Color palettes:
  - Sequential (light to dark) for single-metric heatmaps
  - Diverging (two-color) for comparing positive/negative values
  - Custom color schemes (e.g., viridis, plasma, inferno)
- Color scale types:
  - Linear
  - Logarithmic
  - Square root
  - Custom thresholds/bins
- Cell display options:
  - Show numeric values inside cells
  - Show percentage values
  - Show both value and percentage
  - Hide values (color only)
- Cell size: Fixed or proportional to value

**Interactions:**
- Hover tooltip: Display cell details (dimensions, metric value, breakdown)
- Click/drill-down: Filter or navigate to detailed view
- Row/column reordering:
  - Sort by total value
  - Sort alphabetically
  - Hierarchical clustering
  - Manual drag-and-drop
- Axis swapping: Toggle X and Y axes
- Zoom and pan: For large grids
- Cell highlighting: Highlight related cells on hover

**Time Granularity:**
- Daily, weekly, monthly, quarterly, yearly buckets
- Custom date ranges
- Relative time periods (last 7 days, last 30 days, etc.)

**Performance:**
- Support up to 10,000 cells
- Lazy loading for large datasets
- Aggregation at backend level

---

### 2. Swarm Plot (Beeswarm)

#### Purpose
Visualize individual subscription data points in a swarm layout to show distribution, density, clusters, and outliers. Each point represents a single subscription.

#### Features

**Layout:**
- **Swarm Layout**: Points distributed along categorical axis with collision detection
- **Horizontal Orientation**: Categories on Y-axis, values on X-axis
- **Vertical Orientation**: Categories on X-axis, values on Y-axis
- **Hex Grid**: Points arranged in hexagonal grid pattern
- **Square Grid**: Points arranged in square grid pattern
- **Jitter/Gutter**: Random offset or spacing between points

**Data Mapping:**
- X-axis: Numeric or date/time field (e.g., revenue, start_date, usage)
- Y-axis: Categorical field (e.g., plan_type, region, status)
- Point color: Categorical or numeric field (e.g., status, churn_risk)
- Point size: Numeric field (e.g., total_revenue, usage_metrics)
- Point shape: Optional categorical encoding

**Visual Customization:**
- Point size range: Configurable min/max (e.g., 3px - 20px)
- Color palette: Categorical or continuous scale
- Opacity: Adjustable for overlapping points
- Point shapes: Circle, square, diamond, triangle
- Grouping: Separate swarms per category

**Interactions:**
- Hover tooltip: Show subscription details (ID, plan, revenue, status, etc.)
- Click: Open subscription detail view or filter
- Selection: Multi-select points for filtering
- Zoom and pan: For detailed exploration
- Brush selection: Select range of values
- Filtering: Filter by category, date range, or value range

**Advanced Features:**
- Density overlay: Show distribution curves
- Outlier detection: Highlight statistical outliers
- Clustering: Group similar subscriptions
- Animation: Animate transitions when filters change

**Performance:**
- Support up to 50,000 points
- Sampling for very large datasets
- Virtualization for rendering

---

### 3. Bubble Chart

#### Purpose
Display aggregated subscription data where bubble size represents magnitude (e.g., revenue, count) and position represents two dimensions. Useful for comparing categories and identifying relationships.

#### Features

**Layout Variants:**
- **Scatter Bubble Chart**: Bubbles positioned on X-Y coordinate plane
- **Packed Bubbles**: Bubbles packed together without strict axes (treemap-like)
- **Force-Directed**: Bubbles arranged with force simulation

**Data Mapping:**
- X-axis: Numeric or categorical field (e.g., growth_rate, plan_type, time_period)
- Y-axis: Numeric or categorical field (e.g., churn_rate, region, user_segment)
- Bubble size: Numeric field (e.g., revenue, subscription_count, usage)
- Bubble color: Categorical or numeric field (e.g., status, churn_risk, region)
- Bubble label: Category name or aggregated value

**Visual Customization:**
- Size scaling:
  - Linear
  - Logarithmic
  - Square root
  - Area-based (radius proportional to square root of value)
- Size range: Min/max radius constraints (e.g., 10px - 100px)
- Color palette: Sequential, diverging, or categorical
- Color mapping: By category or by numeric value
- Label display:
  - Inside bubble (when space permits)
  - Outside bubble with connector lines
  - On hover only
  - Custom label formatting

**Interactions:**
- Hover tooltip: Show all encoded dimensions and values
- Click: Filter or drill-down to detailed view
- Selection: Multi-select bubbles
- Zoom and pan: Focus on specific regions
- Legend: Interactive legend for color and size
- Cross-filtering: Selecting bubbles filters other visualizations

**Advanced Features:**
- Bubble clustering: Group related bubbles
- Trend lines: Overlay regression or trend lines
- Threshold indicators: Show reference lines or zones
- Animation: Animate bubble movement over time
- Comparison mode: Compare two time periods side-by-side

**Performance:**
- Support up to 1,000 bubbles
- Aggregation required for large datasets
- Efficient collision detection for packed layout

---

## Common Features & Interactions

### Filtering & Controls

**Global Filters:**
- Time range picker (date range, relative periods)
- Subscription type/plan filter (multi-select)
- Status filter (Active, Cancelled, etc.)
- Region/country filter (multi-select)
- User segment filter
- Revenue range slider
- Custom field filters

**Filter Behavior:**
- Apply to all visualizations simultaneously
- Preserve filter state in URL for sharing
- Save filter presets
- Clear all filters button

### Tooltips & Details

**Tooltip Content:**
- All relevant dimensions and metrics
- Formatted numbers (currency, percentages)
- Breakdown by sub-categories
- Links to detailed views
- Custom tooltip templates

**Tooltip Behavior:**
- Show on hover
- Position intelligently (avoid viewport edges)
- Dismiss on click outside or ESC key
- Sticky tooltips (optional)

### Legends & Labels

**Legend Types:**
- Color legend (categorical or continuous)
- Size legend (for bubbles/swarm)
- Shape legend (if applicable)

**Legend Features:**
- Position: Top, bottom, left, right, or floating
- Interactive: Click to filter/highlight
- Collapsible
- Customizable labels

**Axis Labels:**
- Clear, descriptive labels
- Units displayed
- Formatting options (currency, date formats)
- Rotate labels for readability

### Responsive Design

**Breakpoints:**
- Desktop: Full feature set
- Tablet: Simplified controls, optimized layouts
- Mobile: Stacked layouts, touch-optimized interactions

**Adaptive Behavior:**
- Switch visualization types on small screens
- Collapse less critical controls
- Optimize point/bubble sizes
- Simplified tooltips

### Export & Sharing

**Export Formats:**
- PNG (high resolution)
- SVG (vector, scalable)
- PDF (for reports)
- CSV (underlying data)

**Sharing:**
- Shareable URLs with state preservation
- Embed codes for external sites
- Email reports

### Social Media Sharing

**Purpose:**
Enable users to share their subscription visualizations and reports on social media platforms to showcase insights, trends, and analytics.

**Supported Platforms:**
- Twitter/X
- LinkedIn
- Facebook
- Reddit
- Instagram (via Stories or Feed)
- Pinterest
- Slack
- Discord
- Email (with formatted preview)

**Sharing Features:**

**1. Share Button & Menu:**
- Prominent share button in visualization toolbar
- Dropdown menu with platform icons
- Quick share options for most-used platforms
- "Copy link" option for manual sharing
- Share count/analytics (optional)

**2. Share Content Generation:**
- **Preview Image**: Automatically generate optimized preview image
  - High-resolution screenshot of current visualization
  - Include title and key metrics
  - Branded with logo (optional)
  - Platform-specific dimensions:
    - Twitter: 1200x675px (1.78:1 ratio)
    - LinkedIn: 1200x627px
    - Facebook: 1200x630px
    - Instagram: 1080x1080px (square) or 1080x1350px (portrait)
- **Share Text**: Auto-generated or customizable
  - Default: "Check out my subscription analytics: [visualization type] showing [key insight]"
  - Include hashtags: #SubscriptionAnalytics #DataViz #BusinessIntelligence
  - Customizable message before sharing
  - Include link to full interactive visualization
- **Metadata (Open Graph / Twitter Cards):**
  - Title: Visualization title or custom title
  - Description: Key insights or summary
  - Image: Preview image
  - URL: Shareable link to visualization
  - Site name: Application name

**3. Report Generation for Sharing:**
- **Full Report Export:**
  - Combine multiple visualizations into single report
  - Include summary statistics and insights
  - Add custom annotations and notes
  - Generate PDF or HTML report
  - Branded report template (optional)
- **Report Sections:**
  - Executive summary
  - Key metrics overview
  - Visualizations (heatmap, swarm, bubbles)
  - Insights and recommendations
  - Data source and date range information

**4. Privacy & Access Control:**
- **Share Permissions:**
  - Public: Anyone with link can view
  - Unlisted: Only those with link can view (not searchable)
  - Private: Only authenticated users can view
  - Password-protected shares
- **Data Privacy:**
  - Option to anonymize sensitive data before sharing
  - Remove customer IDs or personal information
  - Aggregate data only (no individual subscription details)
  - Watermark with sharing date
- **Access Expiration:**
  - Set expiration date for shared links
  - One-time view links
  - Revoke access at any time

**5. Interactive Sharing:**
- **Embeddable Widgets:**
  - Generate embed code for websites/blogs
  - Responsive iframe embedding
  - Customizable embed dimensions
  - Option to include interactive controls or static image
- **Live Shared Views:**
  - Real-time updates for shared visualizations
  - Viewers see updates as data changes
  - Comment/annotation system (optional)

**6. Social Media Optimizations:**

**Twitter/X:**
- Character-optimized share text (280 chars)
- Thread support for multiple visualizations
- Twitter Card preview
- Hashtag suggestions

**LinkedIn:**
- Professional formatting
- Article-style sharing with insights
- Company page sharing support
- Professional hashtags

**Facebook:**
- Album support for multiple visualizations
- Story sharing with animated previews
- Group sharing options

**Instagram:**
- Square or portrait image optimization
- Story templates with branded frames
- IGTV format for animated visualizations
- Carousel posts for multiple views

**Reddit:**
- Subreddit-specific formatting
- Markdown support for detailed descriptions
- Image + text post optimization

**7. Sharing Analytics:**
- Track share counts per platform
- View analytics on shared links (views, clicks)
- Monitor engagement metrics
- Export sharing analytics report

**8. User Experience:**
- **One-Click Sharing:**
  - Quick share buttons for each platform
  - Pre-filled content ready to customize
  - Native sharing API integration (mobile)
- **Share Templates:**
  - Save common share messages
  - Pre-configured share settings
  - Scheduled sharing (future feature)
- **Share History:**
  - View previously shared visualizations
  - Re-share with updated data
  - Manage shared links

**9. Technical Implementation:**
- **Image Generation:**
  - Server-side rendering for preview images
  - Canvas/WebGL to image conversion
  - Image optimization (compression, format selection)
  - CDN hosting for shared images
- **Link Shortening:**
  - Custom short URLs (e.g., app.com/s/abc123)
  - QR code generation for easy access
  - Link preview service integration
- **API Integration:**
  - OAuth for direct platform posting
  - Share API endpoints for each platform
  - Web Share API for native mobile sharing
  - Clipboard API for copy-to-clipboard

**10. Compliance & Best Practices:**
- GDPR compliance for shared data
- Terms of service acknowledgment
- Attribution requirements
- Data retention policies for shared content
- Rate limiting to prevent abuse

### Performance Optimizations

**Data Handling:**
- Backend aggregation for large datasets
- Sampling for swarm plots with >50k points
- Pagination or lazy loading
- Caching of aggregated results

**Rendering:**
- Canvas-based rendering for performance
- WebGL for very large datasets
- Virtualization for scrollable views
- Debounced interactions

**Loading States:**
- Skeleton screens during data fetch
- Progress indicators
- Error states with retry options

---

## UI/UX Requirements

### Navigation & Views

- Tab or button group to switch between visualization types
- Persistent view state (remember last selected view)
- Keyboard shortcuts for view switching
- Breadcrumb navigation for drill-downs

### Theme & Styling

- Light and dark mode support
- Customizable color schemes
- High contrast mode for accessibility
- Customizable font sizes

### Accessibility

- Keyboard navigation support
- Screen reader compatibility
- ARIA labels for interactive elements
- Focus indicators
- Color-blind friendly palettes

### User Preferences

- Save visualization configurations
- Custom dashboard layouts
- Default filter presets
- Export/import user settings

---

## Technical Requirements

### Technology Stack

- **Frontend Framework**: Next.js (React)
- **Visualization Libraries**: 
  - D3.js for custom visualizations
  - Recharts or Nivo for chart components
  - Canvas/WebGL for performance-critical rendering
- **State Management**: React Context or Zustand
- **Data Fetching**: React Query or SWR
- **Styling**: Tailwind CSS

### Data API

- RESTful API endpoints for subscription data
- Support for filtering, aggregation, and pagination
- Real-time updates via WebSocket (optional)
- Caching strategy for frequently accessed data

### Configuration Schema

The visualization system should support a configuration schema that defines:

- **Visualization Type**: One of 'heatmap', 'swarm', or 'bubble'
- **Title**: Display name for the visualization
- **Data Source**: Identifier for the data source
- **Dimensions**: Configuration for X-axis, Y-axis, color encoding, and size encoding (where applicable)
- **Metrics**: Primary metric and optional secondary metric
- **Filters**: Array of filter configurations
- **Color Scale**: Color scale configuration (type, palette, domain)
- **Size Scale**: Size scale configuration for bubble/swarm visualizations (scale type, min/max values)
- **Interactions**: Interaction settings (hover, click, zoom, etc.)
- **Layout**: Layout configuration (width, height, responsive settings)

---

## Implementation Priorities

### Phase 1 (MVP)
- Basic heatmap grid with time × plan type
- Simple tooltips and hover interactions
- Basic filtering (time range, plan type)
- Export as PNG
- Light/dark theme toggle

### Phase 2
- Swarm plot visualization
- Bubble chart visualization
- Enhanced filtering and cross-filtering
- Row/column reordering in heatmap
- Export as SVG and CSV

### Phase 3
- Advanced interactions (drill-down, selection)
- Multiple layout options (radial heatmap, packed bubbles)
- Animation and transitions
- Custom color palettes
- Saved configurations

### Phase 4
- Real-time data updates
- Advanced analytics overlays
- Comparison mode
- Mobile optimization
- Accessibility enhancements