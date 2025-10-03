# 🏥 VantagePoint CRM - Premium Frontend

A premium dark-mode CRM interface for medical device sales, built with Next.js, React, TypeScript, and Tailwind CSS.

## ✨ Features

### 🎨 Design System
- **Dark Theme**: Deep navy/slate base with cyan accents
- **Premium UI**: Glass panels with subtle shadows and micro-animations
- **Accessibility**: WCAG AA+ compliant with proper focus states
- **Responsive**: Mobile-first design with collapsible sidebar

### 🧩 Components
- **MetricCard**: Reusable metric display with trend indicators
- **PriorityBadge**: Color-coded priority indicators
- **TopHeader**: Sticky header with logo and user menu
- **Sidebar**: Collapsible navigation with icons
- **Toolbar**: Search and action buttons
- **DataTable**: Full-featured table with loading/empty states

### 🎯 Key Features
- **Real Icons**: Lucide React icons throughout (no emojis)
- **Micro-animations**: Framer Motion for smooth interactions
- **Glass Effects**: Translucent panels with backdrop blur
- **Focus Management**: Proper keyboard navigation
- **Loading States**: Skeleton loaders and empty states
- **Error Handling**: User-friendly error displays

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Open in Browser**
```
http://localhost:3000
```

## 🎨 Design Tokens

### Color Palette
```css
--bg: #0B1220;           /* page background */
--panel: #0E1627;        /* panels/cards */
--panel-2: #111B2E;      /* table header / deeper panels */
--text: #D1D5DB;         /* primary text (slate-300) */
--muted: #94A3B8;        /* slate-400 */
--line: #1E293B;         /* borders (slate-800) */
--accent: #22D3EE;       /* cyan-400/300 mix for accents */
--accent-soft: rgba(34,211,238,0.12);
--good: #34D399;         /* emerald */
--warn: #F59E0B;         /* amber */
--bad: #EF4444;          /* red */
--info: #38BDF8;         /* sky */
```

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700
- **Sizes**: Responsive scale with Tailwind

### Spacing & Layout
- **Container**: Max-width 1200px
- **Padding**: Generous spacing throughout
- **Radius**: 16px for cards, 8px for buttons
- **Shadows**: Subtle depth with CSS shadows

## 🧩 Component Library

### MetricCard
```tsx
<MetricCard
  icon={Hospital}
  label="Practices Signed Up"
  value={0}
  subLabel="vs 12 last month"
  trend={{ direction: 'down', value: '0%' }}
/>
```

### PriorityBadge
```tsx
<PriorityBadge priority="high" />
<PriorityBadge priority="medium" />
<PriorityBadge priority="low" />
```

### DataTable
```tsx
<DataTable 
  data={leads} 
  loading={false} 
  error={null} 
/>
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 375px+ (sidebar hidden)
- **Tablet**: 1024px+ (sidebar collapsible)
- **Desktop**: 1280px+ (full layout)

### Layout Behavior
- **Mobile**: Sidebar slides in/out
- **Tablet**: Sidebar collapses to icons
- **Desktop**: Full sidebar with labels

## ♿ Accessibility

### WCAG AA+ Compliance
- **Color Contrast**: All text meets AA standards
- **Focus States**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and roles
- **Semantic HTML**: Proper heading hierarchy

### Focus Management
- **Tab Order**: Logical tab sequence
- **Focus Traps**: Modal and dropdown focus management
- **Skip Links**: Navigation shortcuts
- **ARIA Labels**: Descriptive labels for icons

## 🎭 Animations

### Micro-interactions
- **Buttons**: 2% scale on hover, 98% on press
- **Cards**: Y-axis lift (-2px) with shadow bloom
- **Table Rows**: Background fade on hover
- **Focus Rings**: 2px outline with accent color

### Performance
- **Hardware Acceleration**: Transform-based animations
- **Reduced Motion**: Respects user preferences
- **Smooth Transitions**: 200ms ease-out timing

## 🛠️ Tech Stack

### Core
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with hooks
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework

### UI Components
- **shadcn/ui**: Accessible component primitives
- **Lucide React**: Beautiful icon library
- **Framer Motion**: Animation library

### Development
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and design tokens
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Dashboard page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── MetricCard.tsx       # Metric display component
│   ├── PriorityBadge.tsx    # Priority indicator
│   ├── TopHeader.tsx        # Header with navigation
│   ├── Sidebar.tsx          # Collapsible sidebar
│   ├── Toolbar.tsx          # Search and actions
│   └── DataTable.tsx        # Data table with states
└── lib/
    └── utils.ts             # Utility functions
```

## 🎯 Usage Examples

### Creating a Metric Card
```tsx
import { Hospital } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

<MetricCard
  icon={Hospital}
  label="Total Practices"
  value={42}
  subLabel="This month"
  trend={{ direction: 'up', value: '+12%' }}
/>
```

### Adding a Priority Badge
```tsx
import { PriorityBadge } from "@/components/PriorityBadge";

<PriorityBadge priority="high" />
```

### Using the Data Table
```tsx
import { DataTable } from "@/components/DataTable";

const leads = [
  {
    id: "1",
    practice: "Advanced Cardiology",
    owner: "John Doe",
    email: "john@cardiology.com",
    phone: "(555) 123-4567",
    location: "Los Angeles, CA",
    priority: "high",
    status: "contacted",
    ptan: "ABC123"
  }
];

<DataTable data={leads} />
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Static Export
```bash
npm run build
npm run export
```

## 🧪 Testing

### Run Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## 📚 API Integration

The frontend is designed to work with the VantagePoint CRM backend API:

### Authentication
```typescript
// Login to get JWT token
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

### Lead Management
```typescript
// Create a new lead
const response = await fetch('/api/v1/leads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(leadData)
});
```

## 🎨 Customization

### Theme Colors
Edit `src/app/globals.css` to modify the design tokens:

```css
:root {
  --accent: #22D3EE;       /* Change accent color */
  --bg: #0B1220;           /* Change background */
  --panel: #0E1627;        /* Change panel color */
}
```

### Component Styling
All components use Tailwind classes and can be customized by modifying the component files.

## 📄 License

This project is part of the VantagePoint CRM system.

---

**Built with ❤️ using Next.js, React, TypeScript, and Tailwind CSS**