# Member B — Frontend (Yasemin) | Branch: `yaso`

---

## What Was Built

Member B built the entire Next.js 16 frontend from scratch using App Router, TypeScript, and vanilla CSS. This covers the full UI for all four actors, all shared components, the design system, and the API client layer.

---

## Files Changed or Created

### Shared packages (affects all members)

**`packages/types/src/index.ts`**
V1 stub types were replaced with complete V2 types. This is the single source of truth for data shapes used by all three members.

Types defined:
- Primitive unions: `ProductType`, `OriginCountry`, `DestinationCountry`, `Methodology`, `BundleStatus`, `ConfidenceLevel`, `IntensitySource`, `ActorType`
- Entity types: `SellerAttestation`, `TradeRecord`, `LogisticsAttestation`, `ComplianceBundle`, `ComplianceReport`, `AuditEvent`, `DashboardInsight`, `ValidationResult`, `CalculationResult`
- API response envelopes: `BundleDetailResponse`, `DashboardSummaryResponse`
- Agent function signatures: `RunValidationFn`, `CalculateCbamFn`

**Why:** V1 stubs blocked all frontend and agent development. V2 reflects the exact data shapes described in the project spec (4-actor model, CBAM/BI layer separation, BundleStatus state machine).

**`packages/agent/src/modules/data/fixtures.ts`**
Replaced V1 demo data with V2-compliant fixtures: 5 demo bundles (3 complete, 1 awaiting_parties, 1 processing), a `getBundleDetail(trade_id)` function, and a `dashboardSummary` object matching `DashboardSummaryResponse`.

**`packages/agent/tsconfig.json`** *(new file)*
Created so the agent package resolves the `@scope4/types` path alias in the IDE without errors.

---

### Frontend app (`apps/web/`)

**Config:**
- `package.json` — Next.js 16.2.9, React 19, recharts, react-markdown, swr, `@scope4/types: workspace:*`
- `next.config.ts` — `transpilePackages: ['@scope4/types']`
- `tsconfig.json` — `@/*` and `@scope4/types` path aliases

**Design system (`styles/globals.css`):**
Full CSS variable system. Key tokens: `--bg-base: #080d14`, `--accent-green: #00d992`. Utility classes: `.card`, `.btn-primary/secondary/danger`, `.badge-{status}` for all 5 BundleStatus values, `.form-input/select/label`, `.table`, `.skeleton` shimmer, `.grid-2/3/4`.

**API client (`lib/api.ts`):**
- `apiGet<T>`, `apiPost<T>` — typed fetch wrappers, default base `http://localhost:3001`
- `sha256File(file)` — Web Crypto API SHA-256 hash for document integrity (used in seller + importer forms)

**Layout (`app/layout.tsx`):**
App shell: `Sidebar + RoleHeader + main content`. Root `app/page.tsx` redirects to `/dashboard`.

**Shared UI components:**

| Component | Purpose |
|---|---|
| `RoleHeader.tsx` | Sticky nav, 4 role tabs, active via `usePathname()`, Solana Devnet badge |
| `Badge.tsx` | Status badge for all 5 `BundleStatus` values — Member C must use this |
| `Timeline.tsx` | Horizontal 4-step attestation progress, Solana TX deep-links per step |
| `SolanaLink.tsx` | Links to Solana Devnet explorer, returns `—` if tx is null |
| `Spinner.tsx` | CSS spinner, configurable size — used for polling indicator |
| `Sidebar.tsx` | Width-zero placeholder for future expansion |

**Pages:**

| Route | What it does |
|---|---|
| `/dashboard` | Placeholder — Member C owns this |
| `/seller` | Bundle list filtered to seller-attested, table + Badge + "New Attestation" |
| `/seller/attest/new` | Emissions declaration form: product type, intensity (tCO₂/t), methodology, file SHA-256, POST `/api/seller/attest` |
| `/importer` | All bundles table with status + dates |
| `/importer/trade/new` | Trade form: product, quantity (kg), origin/destination countries, invoice ref, purchase date, file SHA-256, POST `/api/importer/trade` |
| `/logistics` | Two sections: pending queue (confirm button) + confirmed list |
| `/logistics/attest/[trade_id]` | Pre-fills from `GET /api/bundles/:id`, read-only seller/importer summary, quantity delta warning (>5%), POST `/api/logistics/attest` |
| `/bundles` | All bundles with status filter chip row + counts |
| `/bundles/[id]` | 4-step Timeline, 3 attestation cards (seller/importer/logistics), AI status panel, polls every 5s while `processing` or `ready` |
| `/reports/[id]` | Metrics row, CBAM/BI emissions breakdown table, Gemini report via react-markdown, audit trail with SolanaLink per event |

---

## API Contract — What Member A Must Match

All frontend fetches go to `http://localhost:3001`. Member A's API must implement:

| Method | Endpoint | Response shape |
|---|---|---|
| GET | `/api/bundles` | `ComplianceBundle[]` |
| GET | `/api/bundles/:trade_id` | `BundleDetailResponse` |
| POST | `/api/seller/attest` | `{ solana_tx: string, trade_id: string }` |
| POST | `/api/importer/trade` | `{ solana_tx: string, trade_id: string }` |
| POST | `/api/logistics/attest` | `{ solana_tx: string }` |

`BundleDetailResponse` shape (defined in `packages/types`):
```ts
{
  bundle: ComplianceBundle
  seller: SellerAttestation | null
  trade: TradeRecord | null
  logistics: LogisticsAttestation | null
  report: ComplianceReport | null
  audit_trail: AuditEvent[]
}
```

---

## CBAM/BI Layer Implementation in the UI

Per the project spec (EU Regulation 2023/956), the report page separates:
- **CBAM Reporting Layer** — `total_embedded_tco2` and `cbam_certificates_required` (production embedded only, used for regulatory obligation)
- **BI Layer** — `total_transport_tco2` (transport emissions, shown separately, explicitly labelled "BI layer only", excluded from CBAM liability)

This separation is visible in the `/reports/[id]` emissions breakdown table and the 4-metric summary row.

---

## Potential Merge Conflicts

**High priority — must reconcile before merge:**

1. **`packages/types/src/index.ts`**
Member B upgraded this from V1 stubs to full V2. If Member A or C added their own type definitions independently, those need to be merged into the V2 file. Any additions should be appended, not replaced.

2. **`packages/agent/src/modules/data/fixtures.ts`**
Member B upgraded this to V2. If Member A's agent work also touched this file, both versions need to be compared. Member B's version has 5 demo bundles and a `dashboardSummary` object.

3. **`apps/web/app/dashboard/page.tsx`**
Member B left this as a placeholder. Member C's version of this file should completely replace it — no content conflict, but ensure the file path is identical.

4. **`apps/web/styles/globals.css` and `apps/web/components/ui/Badge.tsx`**
These had unstaged modifications on the `featB-design` branch. That branch is irrelevant — the `yaso` branch versions are the correct ones.

**Lower priority:**

5. `apps/web/package.json` — If Member C added npm dependencies (e.g., chart libraries), merge into Member B's package.json. Member B already includes `recharts` and `react-markdown`.

6. `apps/web/next.config.ts` — If Member C added any Next.js config, merge into Member B's config.

---

## What Member B Did NOT Build

- `apps/api/` — does not exist, entirely Member A's responsibility
- `/dashboard` content — Member C's responsibility
- Solana smart contracts — Member A's responsibility
- AI agent logic — Member A's responsibility
