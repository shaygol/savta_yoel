# savta_yoel

> [README in Hebrew](README_he.md)

A premium Hebrew (RTL) web application for **Konditoriat Savta Yoel** — a rustic cafe and bakery in the Gilboa mountains and Ma'ayanot valley region. The app provides online ordering, product catalog, order management dashboard, and customer management.

## The Stack

- **Framework:** React 18+ with Vite for fast builds and TypeScript for code quality and compile-time error prevention.
- **Styling:** Tailwind CSS combined with shadcn/ui for a modular, consistent, and accessible UI.
- **Icons:** Lucide React - lightweight, flexible vector icon library with easy customization.
- **Data:** TanStack Query for state management with Supabase (Backend-as-a-Service), including automatic cache management and data synchronization.
- **Forms:** Complex form management with React Hook Form and strict Schema Validation using Zod.
- **Charts:** Recharts for dynamic, responsive data visualization.
- **Animations:** Framer Motion for subtle UI animations, smooth transitions, and a premium user experience.
- **Dates:** date-fns for complex date handling, calculations, and full Hebrew localization support.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or above)
- Modern package manager (npm, pnpm, or bun)

### Installation & Running

```bash
# Install all project dependencies
npm install

# Run the project in local development mode with Hot Reload
npm run dev

# Build an optimized production release
npm run build
```

## Project Structure

Designed for easy navigation by both human developers and AI agents, with a clear separation between logic, design, and configuration:

```
savta_yoel/
├── ai-utils/             # AI agent configuration and guidance files
│   ├── db-schema.md      # Database schema definitions - the single source of truth for data
│   ├── ui-style.md       # Visual style guide for design consistency (Design System)
│   └── visual-assets.md  # Mapping of icons, statuses, and fixed visual elements
├── src/
│   ├── components/
│   │   └── ui/           # Atomic core shadcn/ui components
│   ├── pages/            # Main application pages (Views)
│   ├── hooks/            # Reusable logic and state management (Custom Hooks)
│   ├── lib/              # Third-party configurations (Supabase client, utils)
│   └── types/            # Global TypeScript definitions and Interfaces
├── .cursorrules          # Development rules for AI-assisted coding
└── package.json          # Package management, scripts, and versions
```

## RTL & Hebrew

The application is designed from the ground up for full right-to-left (RTL) support:

- **Logical Properties:** Exclusive use of properties like `ms-*` (Margin Start) and `pe-*` (Padding End) instead of fixed sides (Left/Right) to ensure flexibility and automatic adaptation to all writing directions.
- **Typography:** Modern fonts optimized for digital Hebrew such as 'Heebo' or 'Assistant', with proper weight hierarchy (Bold for headings, Regular for body text).
- **Localization:** All user-facing text, error messages, and form labels are written in professional, standard Hebrew.

## The Rules File (.cursorrules)

The `.cursorrules` file defines the AI's professional "personality" and ensures the generated code is high-quality and consistent:

- **Standards Enforcement:** Prevents the AI from using dangerous shortcuts (like the `any` type), and enforces functional, clean, and modular code.
- **Automatic RTL Management:** The AI receives explicit instructions to use Logical Properties, preventing Hebrew interface breakage when adding new components.
- **No Guessing:** Creates a safety protocol - if database information is missing, the AI must stop and request clarification instead of "inventing" table names.

## AI-Assisted Development

The `ai-utils/` folder is the hub where the project's context is stored. It ensures the AI deeply understands the system:

- **`ui-style.md`** — The design DNA: defines what a premium dashboard looks like, how smart forms behave, and what the correct spacing between info cards should be.
- **`visual-assets.md`** — Visual consistency: ensures that an "active" status is always green with the same icon, and that the navigation bar uses the same symbols on every new page created.
- **`db-schema.md`** — The query roadmap: enables the AI to write accurate server-side (Supabase) code by understanding table relationships (Foreign Keys) and data types.

## AI Configuration & Maintenance

To get the most out of the Cursor development experience and minimize errors:

### 1. Indexing & Docs

It is recommended to add the following links in Cursor Settings > Docs so the AI can reference the most up-to-date official documentation:

- **Supabase:** https://supabase.com/docs
- **Tailwind:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/docs

### 2. Schema Updates

Every time the table structure changes in Supabase, update the `ai-utils/db-schema.md` file. Run the following query in the Supabase SQL Editor and paste the result:

```sql
select table_name, column_name, data_type 
from information_schema.columns 
where table_schema = 'public';
```

### 3. Using Effective Prompts

For the AI to perform at its best, explicitly reference the context files using `@`:
`"Create a new customer management page based on @ui-style.md and the data tables in @db-schema.md."`

---
