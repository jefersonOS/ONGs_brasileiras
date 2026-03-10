# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nexori** is a multi-tenant SaaS platform for managing Brazilian NGOs (ONGs). It handles courses, activities, assets (patrimônio), work plans, accountability reports, team management, and AI-assisted document generation.

## Commands

```bash
# Development
npm run dev       # Start dev server at localhost:3000

# Production
npm run build     # Build for production
npm run start     # Start production server

# Code quality
npm run lint      # Run ESLint
```

No test suite is currently configured.

## Architecture

### Multi-Tenancy

The entire platform is multi-tenant. Each NGO (tenant) is resolved via:
1. **Subdomain**: `{slug}.nexori.com.br` → middleware injects `x-tenant-slug` header
2. **Custom domain**: e.g., `portal.institutoabc.org.br` → resolved via `dominio_custom` column in `tenants` table
3. **Fallback** (local dev only): first active tenant in DB

Tenant resolution happens in [middleware.ts](middleware.ts) and is consumed in [lib/tenant-server.ts](lib/tenant-server.ts) via `getTenant()`. Always call `getTenant()` in server components/API routes to scope data to the correct tenant.

### Route Groups

- `app/(auth)/` — Login, register, invitation acceptance
- `app/(internal)/` — Admin/staff dashboard (dashboard, projetos, planos-trabalho, patrimônio, prestações-de-contas, backoffice, configurações, logs-auditoria, etc.)
- `app/(portal)/` — Public citizen-facing portal (courses, activities, enrollment, certificates, user area)
- `app/api/` — REST API routes
- `app/landing/` — Nexori product landing page (shown when visiting root domain without NGO subdomain)

### Supabase Integration

Three Supabase client flavors:
- [lib/supabase/client.ts](lib/supabase/client.ts) — Browser client (use in Client Components)
- [lib/supabase/server.ts](lib/supabase/server.ts) — Server client (use in Server Components and API routes)
- [lib/supabase/admin.ts](lib/supabase/admin.ts) — Service role client (bypasses RLS; use only for admin operations)

Row-Level Security (RLS) is active. All tenant-scoped tables filter by `tenant_id`. The `supabase_schema.sql` file contains the full schema.

### AI Integration

[lib/ai-service.ts](lib/ai-service.ts) exports `getAIProvider()` which returns a Vercel AI SDK model instance. AI provider and model are configurable per-tenant via `tenants.config_portal` (JSONB). Default model is `gemini-2.0-flash`. Provider resolution order: tenant config → env vars → fallback chain (Google → OpenAI → Anthropic).

Also exports `logAIAudit()` to record AI-generated actions in `audit_logs`, and `extractJSON()` to parse JSON from AI responses.

### Key Libraries

- **Vercel AI SDK** (`ai`, `@ai-sdk/*`) — unified interface across OpenAI, Anthropic, Google
- **@supabase/ssr** — Supabase auth with cookie-based sessions
- **@react-pdf/renderer** + **pdf-lib** — PDF generation and manipulation
- **docx** + **mammoth** — DOCX generation and parsing
- **resend** — Transactional email
- **qrcode** / **qrcode.react** — QR codes for assets and certificates
- **zod** — Runtime validation
- **lucide-react** — Icons
- **tailwindcss** — Styling (custom colors: primary `#1A3C4A`, secondary `#2D9E6B`)

### Supabase Edge Functions

Located in `supabase/functions/`:
- `ai-alerts-job` — AI-powered alerts
- `depreciation-job` — Asset depreciation calculation
- `reminder-job` — Scheduled reminders
- `gerenciar-dominio` — Custom domain provisioning via Vercel API

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` (at least one AI provider)
- `RESEND_API_KEY` — email
- `WHATSAPP_*` — WhatsApp notifications
- `VERCEL_*` — for custom domain provisioning via edge functions

### TypeScript Configuration

Strict mode enabled. Path alias `@/*` maps to repo root. The `supabase/` directory is excluded from TypeScript compilation (edge functions use Deno). `@typescript-eslint/no-explicit-any` is disabled; unused vars are warnings only.
