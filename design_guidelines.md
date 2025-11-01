# x402 Facilitator - Fluent Testnet Design Guidelines

## Design Approach

**System Selected:** Material Design + Linear-inspired minimalism for technical developer tools

**Justification:** This is a utility-focused, data-heavy application for blockchain developers. The design prioritizes clarity, efficiency, and technical professionalism over visual flair. References include Stripe's documentation clarity, Linear's clean interface, and Etherscan's data presentation patterns.

**Core Principles:**
- Technical precision over decoration
- Information hierarchy optimized for scanning
- Trustworthy, professional aesthetic appropriate for financial infrastructure
- Developer-first experience with excellent code examples

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - UI text, headings, body content
- Monospace: JetBrains Mono - code blocks, API endpoints, transaction hashes, addresses

**Type Scale:**
- Page Titles: text-4xl font-bold (36px)
- Section Headings: text-2xl font-semibold (24px)
- Subsections: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Small Text/Labels: text-sm (14px)
- Code/Technical: text-sm font-mono
- Micro Text: text-xs (12px) for timestamps, metadata

**Hierarchy Rules:**
- All headings use consistent letter-spacing (tracking-tight for large headings)
- Body text with comfortable line-height (leading-relaxed)
- Code snippets maintain monospace consistency across all views

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16 consistently
- Tight spacing: p-2, gap-2 (component internal padding)
- Standard spacing: p-4, gap-4 (card padding, form fields)
- Section spacing: p-8, gap-8 (between major sections)
- Large spacing: p-12, p-16 (page margins, hero sections)

**Grid Structure:**
- Dashboard: 12-column grid with gap-6
- API Documentation: Single column max-w-4xl for readability
- Statistics Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

**Container Widths:**
- Full-width dashboard: max-w-7xl mx-auto px-6
- Documentation content: max-w-4xl mx-auto px-6
- Code examples: Full width within content container

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with backdrop-blur effect
- Logo/branding on left, navigation links center, connection status/wallet on right
- Height: h-16
- Links display: API Docs, Dashboard, Settings
- Active state with border-b-2 indicator

### Dashboard Components

**Statistics Cards:**
- 4-column grid on desktop (Payments Verified, Payments Settled, Total Volume, Success Rate)
- Each card: rounded-lg border with p-6
- Large metric number (text-3xl font-bold)
- Label (text-sm uppercase tracking-wide)
- Trend indicator (small arrow icon + percentage change)

**Transaction Table:**
- Full-width responsive table with sticky header
- Columns: Timestamp, Transaction Hash (truncated with copy button), Amount, Status, Network
- Row hover state with subtle background change
- Status badges: Verified (green), Settled (blue), Failed (red), Pending (amber)
- Pagination controls at bottom

**Live Activity Feed:**
- Sidebar component (w-80) showing real-time payment events
- Each item: timestamp, event type, amount, status dot
- Auto-scroll with "new activity" notification
- Max height with scroll

### API Documentation Components

**Endpoint Cards:**
- Method badge (GET/POST) with appropriate styling
- Endpoint path in monospace font
- Description paragraph
- Request/Response examples in code blocks with syntax highlighting
- "Try it" interactive demo button

**Code Blocks:**
- Dark theme syntax highlighting
- Language label in top-right corner
- Copy button on hover
- Line numbers for long examples
- Tabs for multiple language examples (JavaScript, cURL, Python)

**Integration Guide Sections:**
- Step-by-step numbered instructions
- Inline code snippets with background differentiation
- Warning/info callout boxes with icons
- Collapsible sections for advanced configuration

### Forms & Inputs

**Configuration Forms:**
- Label above input field pattern
- Input fields: h-10 with rounded-md border
- Focus state with ring effect
- Helper text below inputs (text-sm)
- Required field indicator (asterisk)

**Wallet Connection:**
- Prominent "Connect Wallet" button when disconnected
- Connected state shows: truncated address, chain indicator, disconnect option
- Network switcher dropdown

### Buttons

**Primary Actions:**
- Solid fill for main CTAs (Connect Wallet, Submit Transaction)
- Height: h-10 for standard, h-12 for prominent
- Rounded: rounded-md
- Padding: px-6

**Secondary Actions:**
- Outline style for less prominent actions
- Same sizing as primary

**Icon Buttons:**
- Copy buttons, refresh, external links
- Size: w-8 h-8 with centered icon

### Data Display

**Status Badges:**
- Pill shape with rounded-full
- Size: px-3 py-1 text-xs font-medium
- Verified: green background, darker green text
- Settled: blue background, darker blue text
- Failed: red background, darker red text
- Pending: amber background, darker amber text

**Metrics Display:**
- Large number typography
- Small label underneath
- Optional trend indicator
- Grouped in cards with subtle borders

### Modals & Overlays

**Transaction Details Modal:**
- Centered overlay with backdrop blur
- max-w-2xl width
- Close button top-right
- Scrollable content area
- Transaction details in key-value pairs
- Blockchain explorer link at bottom

## Animations

**Minimal Animation Strategy:**
- Page transitions: None (instant navigation)
- Hover states: Subtle background/border transitions (150ms)
- Loading states: Simple spinner or skeleton screens
- New data: Gentle fade-in for new transactions (300ms)
- No scroll-triggered animations or parallax effects

## Images

**No hero images required** - This is a technical dashboard/documentation site

**Icon Usage:**
- Use Heroicons (via CDN) for all UI icons
- 16px (w-4 h-4) for inline icons
- 20px (w-5 h-5) for buttons
- 24px (w-6 h-6) for headers

**Logo/Branding:**
- Fluent + x402 logo lockup in header
- Simple SVG or text-based logo
- No large decorative imagery needed

## Page-Specific Layouts

### Dashboard Page
- Full-width layout with top stats grid (4 columns)
- Main transaction table below stats
- Optional sidebar with live activity feed
- Quick actions toolbar above table (filters, search, export)

### API Documentation Page
- Single column centered layout (max-w-4xl)
- Sticky sidebar navigation showing sections
- Hero section: API title, version, quick start button
- Sections: Getting Started, Authentication, Endpoints, Error Codes, SDKs
- Footer with links to GitHub, Discord, Support

### Landing/Welcome Page
- Hero: Headline "x402 Facilitator for Fluent Testnet"
- Subheading explaining purpose
- "View Documentation" and "Connect to Dashboard" CTAs
- Feature grid (3 columns): Verify Payments, Settle on Blockchain, Track Transactions
- Integration code preview section
- Footer with network info and links