# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

LogistIQ is a **dual-architecture application** combining a Next.js 15 frontend with a Python FastMCP backend:

### Frontend (Next.js 15 + shadcn/ui)
- **Framework**: Next.js 15 with App Router, TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS v4 with CSS variables for theming
- **State Management**: React hooks (useState, client-side state)
- **Key Pages**:
  - `/` - Main dashboard with shipment overview and metrics
  - `/shipment/[id]` - Individual shipment detail view
  - `/validate/[id]` - Document validation interface  
  - `/analysis/[id]` - Analysis results page

### Backend (Python FastMCP)
- **Framework**: FastMCP (Model Context Protocol server)
- **Purpose**: Trade compliance validation with 8 specialized AI agents
- **Key Features**: 
  - DeepL translation for Chinese↔English document comparison
  - 38 specialized tools for customs compliance validation
  - Risk scoring and delay probability calculations
- **Data Sources**: JSON files for HS codes, market prices, supplier history, CBP rulings

## Common Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Backend Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start MCP server
python server.py
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with fonts
│   ├── shipment/[id]/     # Shipment detail pages
│   ├── validate/[id]/     # Document validation pages
│   └── analysis/[id]/     # Analysis result pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── create-shipment-modal.tsx
├── lib/                  # Utility functions
│   └── utils.ts          # cn() helper for class merging
├── server.py            # FastMCP backend server
├── requirements.txt     # Python dependencies
└── data/               # JSON data files (referenced in server.py)
```

## Key Technologies & Patterns

### Frontend Stack
- **Next.js 15**: App Router with TypeScript, file-based routing
- **shadcn/ui**: Component library using `@/components/ui/*` imports
- **Path Aliases**: `@/*` maps to root directory
- **Styling**: TailwindCSS with custom CSS variables for theming
- **Icons**: Lucide React icons throughout the UI
- **Fonts**: Geist Sans and Geist Mono from `geist/font`

### Component Patterns
- Uses `"use client"` directives for client-side interactivity
- Modal patterns with radix-ui Dialog components
- Form handling with controlled components
- File upload with drag-and-drop functionality
- Navigation between pages using Next.js `Link` and `useRouter`

### Backend Architecture
- **8 Specialized Agents**: Each handles specific compliance validation
- **Tool-based Architecture**: 38 MCP tools for different validation tasks
- **Data-driven**: Uses JSON files for reference data (HS codes, prices, etc.)
- **Translation Integration**: DeepL API for Chinese document translation

## Development Notes

- **TypeScript**: Strict mode enabled, all files use .tsx/.ts extensions
- **ESLint**: Build errors ignored in next.config.mjs for development
- **Images**: Unoptimized setting in next.config.mjs
- **shadcn/ui Config**: New York style, RSC enabled, CSS variables for theming
- **Environment**: Uses `.env` for sensitive keys (DeepL API key for backend)

## Testing & Validation

The backend server includes comprehensive validation tools across 8 categories:
1. HS Code validation
2. Document consistency checking  
3. Regulatory compliance (FCC, import restrictions)
4. Origin verification
5. Value validation against market prices
6. Shipping route verification
7. Supplier history analysis
8. Risk scoring and prioritization

Each validation agent has 3-5 specialized tools that return structured results with risk levels, recommendations, and actionable insights.