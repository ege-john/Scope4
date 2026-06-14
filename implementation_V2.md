# Scope4 — Detailed Implementation Plan V2 (Per Member)

> **V2 key change**: CBAM/BI layer separation. Every formula, schema field, type, and widget label below reflects the correct split.
> CBAM exposure = production-embedded only. Transport CO₂ is a separate BI metric. Portfolio carbon = embedded + transport (internal analytics only).
> This is legally correct under EU Regulation 2023/956 and protects against judge scrutiny.

---

## PRE-START: Day-0 Team Sync (All Members — 30 minutes)

Before anyone writes a single line of code, all three members must sit together (or on a call) and agree on the following. **Member A records the decisions and pushes the types file.**

### Agreements to lock on Day 0

1. **Supabase project URL + anon key** — A creates the project and shares with B and C
2. **Gemini API key** — C generates it and shares with A (for the agent orchestrator)
3. **Solana Devnet keypairs** — A generates 3 demo keypairs (seller, importer, logistics) and commits the public keys to `.env.example`; private keys go only in A's local `.env`
4. **API base URL** — agreed as `http://localhost:3001` for local dev; Vercel/Railway URLs added later
5. **Module function signatures** — the exact TypeScript signatures C will implement and A will call (see Member C section below)
6. **Fixture data format** — C shows A and B the shape of `fixtures.ts` so B can build forms using the same field names

### What A pushes before everyone else starts

```bash
# A does this on Day 0 after the sync:
cd /Users/egejohnny/GitHub/Scope4
pnpm init          # creates root package.json
# then pushes monorepo scaffold + types/index.ts to main
# B and C branch from this commit
```

---

---

# MEMBER A — Chain + Backend Lead

## Responsibility Summary

You own: monorepo scaffolding, shared types, Supabase schema, Anchor smart contract, Hono API, agent daemon infrastructure.

You unblock everyone. Do Phase 0 first. Do not start the smart contract until types are pushed and B/C have branched.

---

## Phase 0: Monorepo Setup (Day 0 — do immediately after sync)

### Step 1: Initialize the monorepo

```bash
cd /Users/egejohnny/GitHub/Scope4

# Install pnpm if not present
npm install -g pnpm

# Initialize root
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

### Step 2: Root `package.json`

```json
{
  "name": "scope4",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter @scope4/web dev",
    "dev:api": "pnpm --filter @scope4/api dev",
    "dev:agent": "pnpm --filter @scope4/agent dev",
    "build": "pnpm --filter @scope4/web build",
    "test": "pnpm --filter @scope4/agent test"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

### Step 3: Base TypeScript config

Create `tsconfig.base.json` at root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Step 4: Create the shared types package

```bash
mkdir -p packages/types/src
```

`packages/types/package.json`:
```json
{
  "name": "@scope4/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

`packages/types/src/index.ts` — **write this in full on Day 0, then freeze**:

```typescript
// ─── Enums ────────────────────────────────────────────────────────────────────

export type ProductType = 'steel' | 'cement' | 'aluminium' | 'fertilisers' | 'electricity'
export type OriginCountry = 'TR' | 'CN'
export type DestinationCountry = 'IT' | 'DE' | 'FR' | 'ES' | 'NL'
export type Methodology = 'direct_measure' | 'default_value' | 'national_grid'
export type BundleStatus = 'awaiting_parties' | 'ready' | 'processing' | 'complete' | 'failed'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type IntensitySource = 'seller_direct' | 'seller_default' | 'system_default'
export type ActorType = 'seller' | 'importer' | 'logistics' | 'system'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface SellerAttestation {
  id: string
  trade_id: string
  seller_name: string
  seller_wallet: string
  facility_id: string
  product_type: ProductType
  emissions_intensity_tco2_per_t: number
  methodology: Methodology
  supporting_doc_url: string | null
  doc_bundle_hash: string
  solana_tx: string | null
  submitted_at: string
}

export interface TradeRecord {
  id: string
  trade_id: string
  importer_name: string
  importer_wallet: string
  seller_ref: string
  product_type: ProductType
  quantity_kg: number
  origin_country: OriginCountry
  destination_country: DestinationCountry
  invoice_ref: string
  purchase_date: string
  doc_bundle_hash: string
  solana_tx: string | null
  submitted_at: string
}

export interface LogisticsAttestation {
  id: string
  trade_id: string
  logistics_name: string
  logistics_wallet: string
  shipment_ref: string
  quantity_confirmed_kg: number
  origin_confirmed: boolean
  route_confirmed: boolean
  dispatch_date: string
  solana_tx: string | null
  attested_at: string
}

export interface ComplianceBundle {
  id: string
  trade_id: string
  seller_attestation_id: string | null
  trade_record_id: string | null
  logistics_attestation_id: string | null
  bundle_status: BundleStatus
  seller_attested_at: string | null
  importer_attested_at: string | null
  logistics_attested_at: string | null
  ready_at: string | null
  ai_triggered_at: string | null
  completed_at: string | null
  solana_bundle_pda: string | null
  created_at: string
}

export interface ComplianceReport {
  id: string
  bundle_id: string
  validation_passed: boolean
  validation_flags: string[]
  intensity_source: IntensitySource
  embedded_tco2: number
  transport_tco2: number
  total_tco2: number
  cbam_exposure_eur: number
  confidence_level: ConfidenceLevel
  confidence_notes: string[]
  report_text: string
  llm_model_used: string
  generated_at: string
}

export interface AuditEvent {
  id: string
  trade_id: string
  event_type: string
  actor_type: ActorType
  actor_identity: string
  solana_tx: string | null
  payload: Record<string, unknown>
  occurred_at: string
}

export interface DashboardInsight {
  id: string
  computed_at: string
  period_start: string
  period_end: string
  total_tco2: number
  total_cbam_eur: number
  top_country: string
  top_product: string
  top_supplier: string
  insight_text: string
  by_country: Record<string, { tco2: number; eur: number }>
  by_product: Record<string, { tco2: number; eur: number }>
  by_supplier: Record<string, { tco2: number; eur: number }>
  monthly_series: Array<{ month: string; tco2: number; eur: number }>
}

// ─── AI Agent types ────────────────────────────────────────────────────────────

export interface ValidationResult {
  passed: boolean
  flags: string[]
  confidence: ConfidenceLevel
}

export interface CalculationResult {
  // ── CBAM Reporting Layer (regulatory obligation) ──────────────────────────────────
  // CBAM under EU Reg 2023/956 = production-embedded emissions ONLY.
  // Transport is NOT included in the CBAM certificate obligation.
  cbam_embedded_tco2: number    // base for CBAM certificate calculation
  cbam_exposure_eur:  number    // cbam_embedded_tco2 × price_placeholder (clearly labelled as estimate)

  // ── Business Intelligence Layer (internal analytics only) ───────────────────
  // These figures are shown in the dashboard carbon-story section.
  // They are NEVER added to cbam_exposure_eur.
  transport_tco2:          number  // logistics/shipping emissions
  portfolio_carbon_tco2:   number  // cbam_embedded_tco2 + transport_tco2

  // ── Calculation metadata ─────────────────────────────────────────────────
  intensity_source:     IntensitySource
  intensity_value_used: number
  distance_km:          number
  transport_factor_used: number
  confidence:           ConfidenceLevel
  confidence_notes:     string[]
}

// ─── API request/response types ────────────────────────────────────────────────

export interface CreateBundleRequest {
  importer_name: string
  importer_wallet: string
}

export interface SubmitSellerAttestationRequest {
  trade_id: string
  seller_name: string
  seller_wallet: string
  facility_id: string
  product_type: ProductType
  emissions_intensity_tco2_per_t: number
  methodology: Methodology
  doc_bundle_hash: string
}

export interface SubmitTradeRecordRequest {
  trade_id: string
  importer_name: string
  importer_wallet: string
  seller_ref: string
  product_type: ProductType
  quantity_kg: number
  origin_country: OriginCountry
  destination_country: DestinationCountry
  invoice_ref: string
  purchase_date: string
  doc_bundle_hash: string
}

export interface SubmitLogisticsAttestationRequest {
  trade_id: string
  logistics_name: string
  logistics_wallet: string
  shipment_ref: string
  quantity_confirmed_kg: number
  origin_confirmed: boolean
  route_confirmed: boolean
  dispatch_date: string
}

export interface BundleDetailResponse {
  bundle: ComplianceBundle
  seller: SellerAttestation | null
  trade: TradeRecord | null
  logistics: LogisticsAttestation | null
  report: ComplianceReport | null
  audit_events: AuditEvent[]
}

export interface DashboardSummaryResponse {
  latest_insight: DashboardInsight | null
  bundle_counts: Record<BundleStatus, number>
}
```

> **PUSH THIS TO MAIN** before B and C start. This is the shared contract.

---

## Phase 1: Database Layer

### Step 1: Create Supabase project

1. Go to [supabase.com](https://supabase.com), create new project
2. Region: **eu-central-1** (Frankfurt)
3. Copy the project URL and anon key into `.env.example` and your local `.env`

### Step 2: Create `.env.example`

```bash
# ── MEMBER A — Chain + DB ──────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your-program-id-after-deploy
SELLER_DEMO_KEYPAIR=[]          # JSON array of secret key bytes
IMPORTER_DEMO_KEYPAIR=[]
LOGISTICS_DEMO_KEYPAIR=[]

API_PORT=3001
DEMO_MODE=false

# ── MEMBER B — Frontend ────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SOLANA_EXPLORER_BASE=https://explorer.solana.com/tx

# ── MEMBER C — AI ─────────────────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key
```

### Step 3: Create `packages/db/` package

```bash
mkdir -p packages/db/src
```

`packages/db/package.json`:
```json
{
  "name": "@scope4/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "@scope4/types": "workspace:*"
  }
}
```

`packages/db/src/index.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function getBundleWithAll(trade_id: string) {
  const { data: bundle } = await supabase
    .from('compliance_bundles')
    .select('*')
    .eq('trade_id', trade_id)
    .single()

  if (!bundle) return null

  const [{ data: seller }, { data: trade }, { data: logistics }, { data: report }] =
    await Promise.all([
      supabase.from('seller_attestations').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('trade_records').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('logistics_attestations').select('*').eq('trade_id', trade_id).maybeSingle(),
      supabase.from('compliance_reports').select('*').eq('bundle_id', bundle.id).maybeSingle(),
    ])

  return { bundle, seller, trade, logistics, report }
}

export async function getReadyBundles() {
  const { data } = await supabase
    .from('compliance_bundles')
    .select('trade_id')
    .eq('bundle_status', 'ready')
    .is('ai_triggered_at', null)
  return data ?? []
}

export async function markBundleProcessing(trade_id: string) {
  await supabase
    .from('compliance_bundles')
    .update({ bundle_status: 'processing', ai_triggered_at: new Date().toISOString() })
    .eq('trade_id', trade_id)
}

export async function markBundleComplete(bundle_id: string) {
  await supabase
    .from('compliance_bundles')
    .update({ bundle_status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', bundle_id)
}

export async function writeAuditEvent(event: {
  trade_id: string
  event_type: string
  actor_type: string
  actor_identity: string
  solana_tx?: string
  payload?: Record<string, unknown>
}) {
  await supabase.from('audit_events').insert({
    ...event,
    occurred_at: new Date().toISOString(),
  })
}
```

### Step 4: SQL schema

Run this in the Supabase SQL Editor (Project → SQL Editor → New query):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── compliance_bundles ────────────────────────────────────────────────────────
create table compliance_bundles (
  id                        uuid primary key default uuid_generate_v4(),
  trade_id                  varchar(64) unique not null,
  seller_attestation_id     uuid,
  trade_record_id           uuid,
  logistics_attestation_id  uuid,
  bundle_status             text not null default 'awaiting_parties',
  seller_attested_at        timestamptz,
  importer_attested_at      timestamptz,
  logistics_attested_at     timestamptz,
  ready_at                  timestamptz,
  ai_triggered_at           timestamptz,
  completed_at              timestamptz,
  solana_bundle_pda         text,
  created_at                timestamptz default now()
);

-- ── seller_attestations ───────────────────────────────────────────────────────
create table seller_attestations (
  id                              uuid primary key default uuid_generate_v4(),
  trade_id                        varchar(64) references compliance_bundles(trade_id),
  seller_name                     text not null,
  seller_wallet                   text not null,
  facility_id                     text not null,
  product_type                    text not null,
  emissions_intensity_tco2_per_t  numeric not null,
  methodology                     text not null,
  supporting_doc_url              text,
  doc_bundle_hash                 text not null,
  solana_tx                       text,
  submitted_at                    timestamptz default now()
);

-- ── trade_records ─────────────────────────────────────────────────────────────
create table trade_records (
  id                  uuid primary key default uuid_generate_v4(),
  trade_id            varchar(64) references compliance_bundles(trade_id),
  importer_name       text not null,
  importer_wallet     text not null,
  seller_ref          text not null,
  product_type        text not null,
  quantity_kg         numeric not null,
  origin_country      text not null,
  destination_country text not null,
  invoice_ref         text not null,
  purchase_date       date not null,
  doc_bundle_hash     text not null,
  solana_tx           text,
  submitted_at        timestamptz default now()
);

-- ── logistics_attestations ────────────────────────────────────────────────────
create table logistics_attestations (
  id                    uuid primary key default uuid_generate_v4(),
  trade_id              varchar(64) references compliance_bundles(trade_id),
  logistics_name        text not null,
  logistics_wallet      text not null,
  shipment_ref          text not null,
  quantity_confirmed_kg numeric not null,
  origin_confirmed      boolean not null default false,
  route_confirmed       boolean not null default false,
  dispatch_date         date not null,
  solana_tx             text,
  attested_at           timestamptz default now()
);

-- ── compliance_reports ────────────────────────────────────────────────────────
create table compliance_reports (
  id                  uuid primary key default uuid_generate_v4(),
  bundle_id           uuid references compliance_bundles(id),
  validation_passed   boolean not null,
  validation_flags    text[] default '{}',
  intensity_source    text not null,
  embedded_tco2       numeric not null,
  transport_tco2      numeric not null,
  total_tco2          numeric not null,
  cbam_exposure_eur   numeric not null,
  confidence_level    text not null,
  confidence_notes    text[] default '{}',
  report_text         text,
  llm_model_used      text,
  generated_at        timestamptz default now()
);

-- ── audit_events ──────────────────────────────────────────────────────────────
create table audit_events (
  id              uuid primary key default uuid_generate_v4(),
  trade_id        varchar(64),
  event_type      text not null,
  actor_type      text not null,
  actor_identity  text not null,
  solana_tx       text,
  payload         jsonb default '{}',
  occurred_at     timestamptz default now()
);

-- ── dashboard_insights ────────────────────────────────────────────────────────
create table dashboard_insights (
  id              uuid primary key default uuid_generate_v4(),
  computed_at     timestamptz default now(),
  period_start    date not null,
  period_end      date not null,
  total_tco2      numeric default 0,
  total_cbam_eur  numeric default 0,
  top_country     text,
  top_product     text,
  top_supplier    text,
  insight_text    text,
  by_country      jsonb default '{}',
  by_product      jsonb default '{}',
  by_supplier     jsonb default '{}',
  monthly_series  jsonb default '[]'
);

-- ── Foreign key add-backs (after all tables exist) ────────────────────────────
alter table compliance_bundles
  add constraint fk_seller  foreign key (seller_attestation_id)   references seller_attestations(id),
  add constraint fk_trade   foreign key (trade_record_id)          references trade_records(id),
  add constraint fk_logist  foreign key (logistics_attestation_id) references logistics_attestations(id);

-- ── RLS (basic: disable for hackathon service-role usage) ─────────────────────
alter table compliance_bundles      enable row level security;
alter table seller_attestations     enable row level security;
alter table trade_records           enable row level security;
alter table logistics_attestations  enable row level security;
alter table compliance_reports      enable row level security;
alter table audit_events            enable row level security;
alter table dashboard_insights      enable row level security;

-- Allow all reads for demo (service role bypasses RLS anyway)
create policy "public read" on compliance_bundles      for select using (true);
create policy "public read" on seller_attestations     for select using (true);
create policy "public read" on trade_records           for select using (true);
create policy "public read" on logistics_attestations  for select using (true);
create policy "public read" on compliance_reports      for select using (true);
create policy "public read" on audit_events            for select using (true);
create policy "public read" on dashboard_insights      for select using (true);
```

### Step 5: Supabase Storage bucket

In Supabase Dashboard → Storage → New bucket:
- Name: `documents`
- Public: **yes** (for demo simplicity)

### Step 6: Seed script

`packages/db/src/seed.ts`:

```typescript
import { supabase } from './index'
import { randomUUID } from 'crypto'

const DEMO_BUNDLES = [
  { trade_id: 'DEMO-TR-STEEL-001', product: 'steel', country: 'TR', qty: 500000, intensity: 1.89 },
  { trade_id: 'DEMO-TR-CEMENT-002', product: 'cement', country: 'TR', qty: 800000, intensity: 0.76 },
  { trade_id: 'DEMO-CN-STEEL-003', product: 'steel', country: 'CN', qty: 1200000, intensity: 2.1 },
  { trade_id: 'DEMO-CN-ALUMIN-004', product: 'aluminium', country: 'CN', qty: 45000, intensity: 14.2 },
  { trade_id: 'DEMO-TR-FERTIL-005', product: 'fertilisers', country: 'TR', qty: 300000, intensity: 2.1 },
]

async function seed() {
  console.log('Seeding demo data...')

  for (const demo of DEMO_BUNDLES) {
    const bundleId = randomUUID()
    const sellerId = randomUUID()
    const tradeId = randomUUID()
    const logisticsId = randomUUID()
    const reportId = randomUUID()

    // ── CBAM Reporting Layer ───────────────────────────────────────────────────
    const cbam_embedded_tco2 = (demo.qty / 1000) * demo.intensity
    const cbam_exposure_eur = cbam_embedded_tco2 * 50  // €50/tCO₂ placeholder

    // ── Business Intelligence Layer (NOT added to CBAM exposure) ─────────────
    const distances: Record<string, number> = { TR: 2200, CN: 19800 }
    const transport_tco2 = (demo.qty / 1000) * (distances[demo.country] ?? 5000) * 0.000012
    const portfolio_carbon_tco2 = cbam_embedded_tco2 + transport_tco2

    // Insert complete bundle
    await supabase.from('compliance_bundles').insert({
      id: bundleId, trade_id: demo.trade_id,
      bundle_status: 'complete',
      seller_attested_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      importer_attested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      logistics_attested_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      ready_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      ai_triggered_at: new Date(Date.now() - 82800000).toISOString(),
      completed_at: new Date(Date.now() - 79200000).toISOString(),
    })

    await supabase.from('seller_attestations').insert({
      id: sellerId, trade_id: demo.trade_id,
      seller_name: demo.country === 'TR' ? 'Karabük Demir Çelik A.Ş.' : 'Baowu Steel Group',
      seller_wallet: 'DEMO_SELLER_WALLET',
      facility_id: `FAC-${demo.country}-001`,
      product_type: demo.product,
      emissions_intensity_tco2_per_t: demo.intensity,
      methodology: 'direct_measure',
      doc_bundle_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      solana_tx: `DEMO_SELLER_TX_${demo.trade_id}`,
    })

    await supabase.from('trade_records').insert({
      id: tradeId, trade_id: demo.trade_id,
      importer_name: 'Ferretti Imports S.r.l.',
      importer_wallet: 'DEMO_IMPORTER_WALLET',
      seller_ref: demo.country === 'TR' ? 'Karabük Demir Çelik A.Ş.' : 'Baowu Steel Group',
      product_type: demo.product,
      quantity_kg: demo.qty,
      origin_country: demo.country,
      destination_country: 'IT',
      invoice_ref: `INV-${demo.trade_id}`,
      purchase_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      doc_bundle_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
      solana_tx: `DEMO_TRADE_TX_${demo.trade_id}`,
    })

    await supabase.from('logistics_attestations').insert({
      id: logisticsId, trade_id: demo.trade_id,
      logistics_name: 'MSC Mediterranean Shipping',
      logistics_wallet: 'DEMO_LOGISTICS_WALLET',
      shipment_ref: `SHP-${demo.trade_id}`,
      quantity_confirmed_kg: demo.qty,
      origin_confirmed: true,
      route_confirmed: true,
      dispatch_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      solana_tx: `DEMO_LOGISTICS_TX_${demo.trade_id}`,
    })

    // Update bundle with foreign key references
    await supabase.from('compliance_bundles').update({
      seller_attestation_id: sellerId,
      trade_record_id: tradeId,
      logistics_attestation_id: logisticsId,
    }).eq('id', bundleId)

    await supabase.from('compliance_reports').insert({
      id: reportId, bundle_id: bundleId,
      validation_passed: true, validation_flags: [],
      intensity_source: 'seller_direct',
      // CBAM Reporting Layer
      cbam_embedded_tco2: parseFloat(cbam_embedded_tco2.toFixed(2)),
      cbam_exposure_eur: parseFloat(cbam_exposure_eur.toFixed(2)),
      // BI Layer
      transport_tco2: parseFloat(transport_tco2.toFixed(2)),
      portfolio_carbon_tco2: parseFloat(portfolio_carbon_tco2.toFixed(2)),
      confidence_level: 'high', confidence_notes: [],
      report_text: `# CBAM Compliance Report — ${demo.trade_id}\n\n## CBAM Reporting Layer\nEmbedded production emissions: **${cbam_embedded_tco2.toFixed(1)} tCO₂**. Estimated CBAM exposure: **€${cbam_exposure_eur.toFixed(0)}** (€50/tCO₂ estimate).\n\n## Carbon Footprint Overview (BI Layer)\nTransport emissions: ${transport_tco2.toFixed(2)} tCO₂. Full portfolio carbon footprint: ${portfolio_carbon_tco2.toFixed(1)} tCO₂. Note: transport emissions are not included in the CBAM liability calculation.`,
      llm_model_used: 'gemini-1.5-flash',
    })
  }

  // Seed one in-progress bundle for demo
  await supabase.from('compliance_bundles').insert({
    trade_id: 'DEMO-LIVE-001',
    bundle_status: 'awaiting_parties',
  })

  console.log('Seed complete.')
}

seed()
```

Run with: `npx tsx packages/db/src/seed.ts`

---

## Phase 2: Smart Contract (Anchor)

### Step 1: Bootstrap Anchor project

```bash
# Install Rust + Solana CLI + Anchor if not installed
# Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Solana: sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)"
# Anchor: cargo install --git https://github.com/coral-xyz/anchor avm --force

mkdir -p packages/contract
cd packages/contract
anchor init scope4 --no-git
```

### Step 2: Program structure

Edit `packages/contract/scope4/programs/scope4/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_AFTER_KEYGEN"); // fill after: anchor keys list

#[program]
pub mod scope4 {
    use super::*;

    pub fn initialize_bundle(ctx: Context<InitializeBundle>, trade_id: [u8; 32]) -> Result<()> {
        let bundle = &mut ctx.accounts.bundle;
        bundle.trade_id = trade_id;
        bundle.importer = ctx.accounts.importer.key();
        bundle.seller_attested = false;
        bundle.importer_attested = false;
        bundle.logistics_attested = false;
        bundle.status = BundleStatus::AwaitingParties;
        bundle.created_at = Clock::get()?.unix_timestamp;
        bundle.ready_at = None;
        Ok(())
    }

    pub fn submit_seller_attestation(
        ctx: Context<SubmitSellerAttestation>,
        trade_id: [u8; 32],
        facility_id: String,
        product_type: u8,
        emissions_intensity: u64,   // tCO2/t × 1000 (3 decimal places)
        methodology: u8,
        doc_bundle_hash: [u8; 32],
    ) -> Result<()> {
        let attest = &mut ctx.accounts.seller_attestation;
        attest.trade_id = trade_id;
        attest.seller = ctx.accounts.seller.key();
        attest.facility_id = facility_id;
        attest.product_type = product_type;
        attest.emissions_intensity = emissions_intensity;
        attest.methodology = methodology;
        attest.doc_bundle_hash = doc_bundle_hash;
        attest.submitted_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.seller_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }

    pub fn submit_trade_record(
        ctx: Context<SubmitTradeRecord>,
        trade_id: [u8; 32],
        quantity_kg: u64,
        origin_country: u8,
        destination_country: u8,
        doc_bundle_hash: [u8; 32],
    ) -> Result<()> {
        let record = &mut ctx.accounts.trade_record;
        record.trade_id = trade_id;
        record.importer = ctx.accounts.importer.key();
        record.quantity_kg = quantity_kg;
        record.origin_country = origin_country;
        record.destination_country = destination_country;
        record.doc_bundle_hash = doc_bundle_hash;
        record.submitted_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.importer_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }

    pub fn submit_logistics_attestation(
        ctx: Context<SubmitLogisticsAttestation>,
        trade_id: [u8; 32],
        quantity_confirmed_kg: u64,
        origin_confirmed: bool,
        route_confirmed: bool,
        dispatch_date: i64,
    ) -> Result<()> {
        let attest = &mut ctx.accounts.logistics_attestation;
        attest.trade_id = trade_id;
        attest.logistics = ctx.accounts.logistics.key();
        attest.quantity_confirmed_kg = quantity_confirmed_kg;
        attest.origin_confirmed = origin_confirmed;
        attest.route_confirmed = route_confirmed;
        attest.dispatch_date = dispatch_date;
        attest.attested_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.logistics_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }
}

// ── Readiness check helper ──────────────────────────────────────────────────

fn check_readiness(bundle: &mut Account<ComplianceBundle>) -> Result<()> {
    if bundle.seller_attested && bundle.importer_attested && bundle.logistics_attested {
        bundle.status = BundleStatus::ReadyForProcessing;
        bundle.ready_at = Some(Clock::get()?.unix_timestamp);
        emit!(ComplianceBundleReady {
            trade_id: bundle.trade_id,
            importer: bundle.importer,
            ready_at: bundle.ready_at.unwrap(),
        });
    }
    Ok(())
}

// ── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct InitializeBundle<'info> {
    #[account(
        init,
        payer = importer,
        space = 8 + ComplianceBundle::SPACE,
        seeds = [b"bundle", &trade_id],
        bump
    )]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub importer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitSellerAttestation<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + SellerAttestationAccount::SPACE,
        seeds = [b"seller_attest", &trade_id],
        bump
    )]
    pub seller_attestation: Account<'info, SellerAttestationAccount>,
    #[account(mut, seeds = [b"bundle", &trade_id], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitTradeRecord<'info> {
    #[account(
        init, payer = importer,
        space = 8 + TradeRecordAccount::SPACE,
        seeds = [b"trade", &trade_id], bump
    )]
    pub trade_record: Account<'info, TradeRecordAccount>,
    #[account(mut, seeds = [b"bundle", &trade_id], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub importer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitLogisticsAttestation<'info> {
    #[account(
        init, payer = logistics,
        space = 8 + LogisticsAttestationAccount::SPACE,
        seeds = [b"logistics", &trade_id], bump
    )]
    pub logistics_attestation: Account<'info, LogisticsAttestationAccount>,
    #[account(mut, seeds = [b"bundle", &trade_id], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub logistics: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── State structs ──────────────────────────────────────────────────────────

#[account]
pub struct ComplianceBundle {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub seller_attested: bool,
    pub importer_attested: bool,
    pub logistics_attested: bool,
    pub status: BundleStatus,
    pub created_at: i64,
    pub ready_at: Option<i64>,
}

impl ComplianceBundle {
    pub const SPACE: usize = 32 + 32 + 1 + 1 + 1 + 1 + 8 + 9; // Option<i64> = 9
}

#[account]
pub struct SellerAttestationAccount {
    pub trade_id: [u8; 32],
    pub seller: Pubkey,
    pub product_type: u8,
    pub emissions_intensity: u64,
    pub methodology: u8,
    pub doc_bundle_hash: [u8; 32],
    pub submitted_at: i64,
    pub facility_id: String,  // 4 + 64 bytes
}

impl SellerAttestationAccount {
    pub const SPACE: usize = 32 + 32 + 1 + 8 + 1 + 32 + 8 + (4 + 64);
}

#[account]
pub struct TradeRecordAccount {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub quantity_kg: u64,
    pub origin_country: u8,
    pub destination_country: u8,
    pub doc_bundle_hash: [u8; 32],
    pub submitted_at: i64,
}

impl TradeRecordAccount {
    pub const SPACE: usize = 32 + 32 + 8 + 1 + 1 + 32 + 8;
}

#[account]
pub struct LogisticsAttestationAccount {
    pub trade_id: [u8; 32],
    pub logistics: Pubkey,
    pub quantity_confirmed_kg: u64,
    pub origin_confirmed: bool,
    pub route_confirmed: bool,
    pub dispatch_date: i64,
    pub attested_at: i64,
}

impl LogisticsAttestationAccount {
    pub const SPACE: usize = 32 + 32 + 8 + 1 + 1 + 8 + 8;
}

// ── Enums ──────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BundleStatus {
    AwaitingParties,
    ReadyForProcessing,
    Processing,
    Complete,
}

// ── Events ─────────────────────────────────────────────────────────────────

#[event]
pub struct ComplianceBundleReady {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub ready_at: i64,
}
```

### Step 3: Deploy to Devnet

```bash
cd packages/contract/scope4

# Make sure you're on Devnet
solana config set --url devnet

# Generate keypair for program (if not already)
solana-keygen new --outfile target/deploy/scope4-keypair.json

# Airdrop SOL to your wallet for deployment
solana airdrop 2

# Build
anchor build

# Get the program ID
anchor keys list
# Copy the output ID into declare_id!() in lib.rs and into .env SOLANA_PROGRAM_ID

# Deploy
anchor deploy --provider.cluster devnet

# Test
anchor test --provider.cluster devnet
```

---

## Phase 3: Backend API

### Step 1: Bootstrap Hono app

```bash
mkdir -p apps/api/src/routes apps/api/src/middleware apps/api/src/solana
```

`apps/api/package.json`:
```json
{
  "name": "@scope4/api",
  "version": "0.0.1",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "hono": "^4.4.0",
    "@hono/node-server": "^1.12.0",
    "@solana/web3.js": "^1.95.0",
    "@coral-xyz/anchor": "^0.30.0",
    "@supabase/supabase-js": "^2.43.0",
    "@scope4/types": "workspace:*",
    "@scope4/db": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.11.0"
  }
}
```

### Step 2: Main entrypoint

`apps/api/src/index.ts`:
```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import bundleRoutes from './routes/bundles'
import sellerRoutes from './routes/seller'
import importerRoutes from './routes/importer'
import logisticsRoutes from './routes/logistics'
import dashboardRoutes from './routes/dashboard'
import reportsRoutes from './routes/reports'

const app = new Hono()

app.use('*', cors({ origin: '*' }))
app.use('*', logger())

app.get('/health', (c) => c.json({ status: 'ok', demo: process.env.DEMO_MODE === 'true' }))

app.route('/api/bundles', bundleRoutes)
app.route('/api/seller', sellerRoutes)
app.route('/api/importer', importerRoutes)
app.route('/api/logistics', logisticsRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/reports', reportsRoutes)

serve({ fetch: app.fetch, port: Number(process.env.API_PORT) || 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})
```

### Step 3: Solana helper

`apps/api/src/solana/client.ts`:
```typescript
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { readFileSync } from 'fs'

export const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
)

export const programId = new PublicKey(process.env.SOLANA_PROGRAM_ID!)

// Load demo keypairs from env (JSON arrays)
export function loadKeypair(envVar: string): Keypair {
  const raw = JSON.parse(process.env[envVar] || '[]')
  if (raw.length === 0) {
    // Generate a fresh one for dev (not persisted across restarts)
    console.warn(`${envVar} not set — using ephemeral keypair`)
    return Keypair.generate()
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw))
}

export const sellerKeypair = loadKeypair('SELLER_DEMO_KEYPAIR')
export const importerKeypair = loadKeypair('IMPORTER_DEMO_KEYPAIR')
export const logisticsKeypair = loadKeypair('LOGISTICS_DEMO_KEYPAIR')

// Helper: get bundle PDA
export function getBundlePDA(tradeIdBytes: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bundle'), Buffer.from(tradeIdBytes)],
    programId
  )
}

// Convert string trade_id to 32-byte array
export function tradeIdToBytes(trade_id: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(trade_id)
  const result = new Uint8Array(32)
  result.set(bytes.slice(0, 32))
  return result
}
```

### Step 4: Bundles route

`apps/api/src/routes/bundles.ts`:
```typescript
import { Hono } from 'hono'
import { supabase, getBundleWithAll } from '@scope4/db'
import { randomUUID } from 'crypto'
import { connection, importerKeypair, getBundlePDA, tradeIdToBytes, programId } from '../solana/client'
import { getDemoBundle } from '../middleware/demo'

const app = new Hono()

// GET /api/bundles — list all bundles with optional filters
app.get('/', async (c) => {
  if (process.env.DEMO_MODE === 'true') {
    const { getDemoBundles } = await import('../middleware/demo')
    return c.json(getDemoBundles())
  }

  const status = c.req.query('status')
  const country = c.req.query('country')

  let query = supabase.from('compliance_bundles').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('bundle_status', status)

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// GET /api/bundles/:id — bundle detail with all attestations
app.get('/:id', async (c) => {
  const trade_id = c.req.param('id')

  if (process.env.DEMO_MODE === 'true') {
    return c.json(getDemoBundle(trade_id))
  }

  const result = await getBundleWithAll(trade_id)
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

// POST /api/bundles — create a new bundle
app.post('/', async (c) => {
  const body = await c.req.json()
  const trade_id = `TRD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`

  // 1. Insert into Supabase
  const { data: bundle, error } = await supabase
    .from('compliance_bundles')
    .insert({ trade_id, bundle_status: 'awaiting_parties' })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // 2. Call Solana initialize_bundle (non-blocking for demo reliability)
  let solana_tx: string | null = null
  try {
    const tradeBytes = tradeIdToBytes(trade_id)
    const [bundlePDA] = getBundlePDA(tradeBytes)
    // anchor call here — simplified for brevity
    // In production: build and send the initialize_bundle instruction
    solana_tx = `DEMO_INIT_TX_${trade_id}`
  } catch (err) {
    console.warn('Solana call failed (non-fatal):', err)
  }

  if (solana_tx) {
    await supabase.from('compliance_bundles').update({ solana_bundle_pda: solana_tx }).eq('trade_id', trade_id)
  }

  await supabase.from('audit_events').insert({
    trade_id, event_type: 'bundle_created',
    actor_type: 'importer', actor_identity: body.importer_wallet || 'demo',
    payload: { importer_name: body.importer_name },
    occurred_at: new Date().toISOString(),
  })

  return c.json({ trade_id, bundle_status: 'awaiting_parties', solana_tx })
})

export default app
```

### Step 5: Demo mode middleware

`apps/api/src/middleware/demo.ts`:
```typescript
// Returns fixture data when DEMO_MODE=true
// C's fixtures.ts provides the actual data — A imports it here
import fixtures from '../../../packages/agent/src/modules/data/fixtures'

export function getDemoBundles() {
  return fixtures.bundles
}

export function getDemoBundle(trade_id: string) {
  return fixtures.getBundleDetail(trade_id) ?? fixtures.bundles[0]
}

export function getDemoDashboard() {
  return fixtures.dashboardSummary
}
```

> **Note**: The remaining routes (seller.ts, importer.ts, logistics.ts, dashboard.ts, reports.ts) follow the same pattern as bundles.ts — read from Supabase, call Solana non-blocking, write audit event, return result. Implement each one following that pattern.

---

## Phase 4: Agent Daemon Infrastructure

`packages/agent/src/index.ts`:
```typescript
import { supabase } from '@scope4/db'
import { getReadyBundles, getBundleWithAll, markBundleProcessing, markBundleComplete } from '@scope4/db'
import { runValidation } from './modules/validation'
import { runCalculation } from './modules/calculation'
import { generateReport } from './modules/report'
import { runAnalytics } from './modules/analytics'

const POLL_INTERVAL_MS = 5000

async function processBundles() {
  const readyBundles = await getReadyBundles()

  for (const { trade_id } of readyBundles) {
    console.log(`[Agent] Processing bundle: ${trade_id}`)
    try {
      await markBundleProcessing(trade_id)

      // Write audit event
      await supabase.from('audit_events').insert({
        trade_id, event_type: 'ai_triggered',
        actor_type: 'system', actor_identity: 'agent-daemon',
        occurred_at: new Date().toISOString(),
      })

      const data = await getBundleWithAll(trade_id)
      if (!data?.seller || !data?.trade || !data?.logistics) {
        console.error(`[Agent] Missing attestations for ${trade_id}`)
        continue
      }

      // Step 1: Validate
      const validationResult = await runValidation(data.bundle, data.seller, data.trade, data.logistics)

      // Step 2: Calculate
      const calcResult = await runCalculation(validationResult, data.seller, data.trade)

      // Step 3: Generate report
      const reportText = await generateReport(data.bundle, validationResult, calcResult)

      // Step 4: Save report
      const { data: report } = await supabase.from('compliance_reports').insert({
        bundle_id: data.bundle.id,
        validation_passed: validationResult.passed,
        validation_flags: validationResult.flags,
        intensity_source: calcResult.intensity_source,
        embedded_tco2: calcResult.embedded_tco2,
        transport_tco2: calcResult.transport_tco2,
        total_tco2: calcResult.total_tco2,
        cbam_exposure_eur: calcResult.cbam_exposure_eur,
        confidence_level: calcResult.confidence,
        confidence_notes: calcResult.confidence_notes,
        report_text: reportText,
        llm_model_used: 'gemini-1.5-flash',
        generated_at: new Date().toISOString(),
      }).select().single()

      await markBundleComplete(data.bundle.id)

      await supabase.from('audit_events').insert({
        trade_id, event_type: 'report_generated',
        actor_type: 'system', actor_identity: 'agent-daemon',
        payload: { report_id: report?.id, total_tco2: calcResult.total_tco2 },
        occurred_at: new Date().toISOString(),
      })

      // Step 5: Update analytics (non-blocking)
      runAnalytics().catch(console.error)

      console.log(`[Agent] ✓ Bundle ${trade_id} complete. tCO₂: ${calcResult.total_tco2}`)
    } catch (err) {
      console.error(`[Agent] ✗ Error processing ${trade_id}:`, err)
    }
  }
}

// Start polling loop
console.log('[Agent] Starting polling loop...')
setInterval(processBundles, POLL_INTERVAL_MS)
processBundles() // run immediately on start
```

---

---

# MEMBER B — Frontend Lead

## Responsibility Summary

You own: Next.js app shell, design system, all actor portal pages, bundle detail page, compliance report page, shared UI components.

Start immediately after A pushes `packages/types/index.ts`. Use fixture data from C for API calls until A's routes are live.

---

## Phase 0: Next.js App Setup

### Step 1: Create Next.js app

```bash
cd /Users/egejohnny/GitHub/Scope4/apps
npx create-next-app@latest web --typescript --app --no-tailwind --no-src-dir --import-alias "@/*"
cd web
pnpm install
```

### Step 2: Add dependencies

```bash
pnpm add @scope4/types@workspace:* swr react-markdown
pnpm add -D @types/react
```

### Step 3: App package.json adjustment

```json
{
  "name": "@scope4/web",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## Phase 5a: Design System

### Step 1: Global CSS

Create `apps/web/styles/globals.css`:

```css
/* ── Google Fonts ──────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* ── Colour tokens ──────────────────────────────────────────────────────────── */
:root {
  /* Backgrounds */
  --bg-base:          #080d14;
  --bg-surface:       #0f1723;
  --bg-elevated:      #162032;
  --bg-glass:         rgba(22, 32, 50, 0.6);

  /* Accents */
  --accent-green:     #00d992;
  --accent-green-dim: rgba(0, 217, 146, 0.15);
  --accent-amber:     #f5a623;
  --accent-amber-dim: rgba(245, 166, 35, 0.15);
  --accent-red:       #ff4757;
  --accent-red-dim:   rgba(255, 71, 87, 0.15);
  --accent-blue:      #3d91ff;
  --accent-blue-dim:  rgba(61, 145, 255, 0.15);

  /* Text */
  --text-primary:     #f0f4ff;
  --text-secondary:   #8b9cb8;
  --text-muted:       #4a5c74;

  /* Borders */
  --border-subtle:    rgba(255, 255, 255, 0.06);
  --border-glass:     rgba(255, 255, 255, 0.10);

  /* Spacing */
  --radius-sm:  6px;
  --radius-md:  12px;
  --radius-lg:  20px;
  --radius-xl:  28px;

  /* Shadows */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-glow-green: 0 0 24px rgba(0, 217, 146, 0.2);

  /* Status colours → used by Badge component */
  --status-awaiting: var(--accent-amber);
  --status-ready:    var(--accent-blue);
  --status-processing: var(--accent-blue);
  --status-complete: var(--accent-green);
  --status-failed:   var(--accent-red);
}

/* ── Reset & base ───────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  background-color: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

/* ── Typography scale ──────────────────────────────────────────────────────── */
.text-xs   { font-size: 11px; }
.text-sm   { font-size: 13px; }
.text-base { font-size: 14px; }
.text-lg   { font-size: 16px; }
.text-xl   { font-size: 20px; }
.text-2xl  { font-size: 24px; }
.text-3xl  { font-size: 30px; }
.text-4xl  { font-size: 38px; }

.font-medium  { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold    { font-weight: 700; }
.font-extrabold { font-weight: 800; }

.text-primary   { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted     { color: var(--text-muted); }
.text-green     { color: var(--accent-green); }
.text-amber     { color: var(--accent-amber); }
.text-red       { color: var(--accent-red); }
.text-blue      { color: var(--accent-blue); }

/* ── Glass card ─────────────────────────────────────────────────────────────── */
.card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.card-sm { padding: 16px; border-radius: var(--radius-md); }
.card-lg { padding: 32px; border-radius: var(--radius-xl); }

/* ── Buttons ─────────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary {
  background: var(--accent-green);
  color: #080d14;
}
.btn-primary:hover:not(:disabled) {
  background: #00f5a8;
  box-shadow: var(--shadow-glow-green);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-glass);
  border-color: var(--accent-green);
}

.btn-danger {
  background: var(--accent-red-dim);
  color: var(--accent-red);
  border: 1px solid var(--accent-red);
}

.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-lg { padding: 14px 28px; font-size: 16px; }

/* ── Status badges ───────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-awaiting_parties { color: var(--accent-amber); background: var(--accent-amber-dim); }
.badge-ready            { color: var(--accent-blue);  background: var(--accent-blue-dim); }
.badge-processing       { color: var(--accent-blue);  background: var(--accent-blue-dim); }
.badge-complete         { color: var(--accent-green); background: var(--accent-green-dim); }
.badge-failed           { color: var(--accent-red);   background: var(--accent-red-dim); }

/* ── Form inputs ─────────────────────────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase; }

.form-input, .form-select {
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  padding: 10px 14px;
  width: 100%;
  transition: border-color 0.15s ease;
  outline: none;
  font-family: 'Inter', sans-serif;
}

.form-input:focus, .form-select:focus {
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px var(--accent-green-dim);
}

.form-select option { background: var(--bg-elevated); }

/* ── Tables ──────────────────────────────────────────────────────────────────── */
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left; padding: 10px 16px;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.06em;
  border-bottom: 1px solid var(--border-subtle);
}
.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-secondary);
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: rgba(255,255,255,0.02); }

/* ── Skeleton loader ─────────────────────────────────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-glass) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Layout utils ──────────────────────────────────────────────────────────── */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
```

### Step 2: Root layout with role switcher

`apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import '../styles/globals.css'
import styles from './layout.module.css'
import RoleHeader from '@/components/layout/RoleHeader'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Scope4 — CBAM Compliance Platform',
  description: 'AI-powered carbon compliance for EU importers. Built on Solana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className={styles.appShell}>
          <Sidebar />
          <div className={styles.mainArea}>
            <RoleHeader />
            <main className={styles.pageContent}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
```

`apps/web/app/layout.module.css`:
```css
.appShell {
  display: flex;
  min-height: 100vh;
}
.mainArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.pageContent {
  flex: 1;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
```

`apps/web/components/layout/RoleHeader.tsx`:
```tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import styles from './RoleHeader.module.css'

const ROLES = [
  { label: '🏭 Seller', href: '/seller', id: 'seller' },
  { label: '🏢 Importer', href: '/importer', id: 'importer' },
  { label: '🚢 Logistics', href: '/logistics', id: 'logistics' },
  { label: '📊 Dashboard', href: '/dashboard', id: 'dashboard' },
]

export default function RoleHeader() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>S4</span>
        <span className={styles.logoText}>Scope4</span>
      </div>
      <nav className={styles.roleNav}>
        {ROLES.map((role) => (
          <button
            key={role.id}
            id={`role-btn-${role.id}`}
            className={`${styles.roleBtn} ${pathname.startsWith(role.href) ? styles.active : ''}`}
            onClick={() => router.push(role.href)}
          >
            {role.label}
          </button>
        ))}
      </nav>
      <div className={styles.networkBadge}>
        <span className={styles.dot} />
        Solana Devnet
      </div>
    </header>
  )
}
```

`apps/web/components/layout/RoleHeader.module.css`:
```css
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; height: 64px;
  background: rgba(8, 13, 20, 0.8);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 100;
}

.logo { display: flex; align-items: center; gap: 10px; }
.logoMark {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--accent-green); color: #080d14;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 13px;
}
.logoText { font-weight: 700; font-size: 16px; }

.roleNav { display: flex; gap: 4px; }
.roleBtn {
  padding: 7px 16px; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-secondary);
  border: 1px solid transparent; cursor: pointer;
  font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;
}
.roleBtn:hover { color: var(--text-primary); border-color: var(--border-glass); }
.roleBtn.active {
  background: var(--accent-green-dim); color: var(--accent-green);
  border-color: rgba(0, 217, 146, 0.3);
}

.networkBadge {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--text-muted);
}
.dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent-green);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
```

---

## Phase 5b: Shared UI Components

### `components/ui/Badge.tsx`
```tsx
import type { BundleStatus } from '@scope4/types'
import styles from './Badge.module.css'

interface BadgeProps {
  status: BundleStatus
  label?: string
}

const STATUS_LABELS: Record<BundleStatus, string> = {
  awaiting_parties: 'Awaiting Parties',
  ready: 'Ready',
  processing: 'Processing',
  complete: 'Complete',
  failed: 'Failed',
}

export default function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}
```

### `components/ui/SolanaLink.tsx`
```tsx
interface SolanaLinkProps { tx: string | null; label?: string }

export default function SolanaLink({ tx, label }: SolanaLinkProps) {
  if (!tx) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const base = process.env.NEXT_PUBLIC_SOLANA_EXPLORER_BASE || 'https://explorer.solana.com/tx'
  const href = `${base}/${tx}?cluster=devnet`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       style={{ color: 'var(--accent-blue)', fontSize: 12, fontFamily: 'monospace' }}>
      {label ?? `${tx.slice(0, 8)}…${tx.slice(-6)}`} ↗
    </a>
  )
}
```

### `components/ui/Timeline.tsx`

```tsx
import styles from './Timeline.module.css'

interface Step { label: string; done: boolean; tx?: string | null; timestamp?: string | null }

export default function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <div key={i} className={`${styles.step} ${step.done ? styles.done : ''}`}>
          <div className={styles.indicator}>
            <div className={styles.dot}>{step.done ? '✓' : i + 1}</div>
            {i < steps.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.content}>
            <div className={styles.label}>{step.label}</div>
            {step.timestamp && (
              <div className={styles.meta}>
                {new Date(step.timestamp).toLocaleString()}
              </div>
            )}
            {step.tx && (
              <a href={`https://explorer.solana.com/tx/${step.tx}?cluster=devnet`}
                 target="_blank" rel="noopener noreferrer"
                 className={styles.txLink}>
                {step.tx.slice(0, 12)}… ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

`components/ui/Timeline.module.css`:
```css
.timeline { display: flex; gap: 0; width: 100%; }
.step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.indicator { display: flex; flex-direction: column; align-items: center; }
.dot {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elevated); border: 2px solid var(--border-glass);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--text-muted);
  transition: all 0.3s ease;
  z-index: 1;
}
.done .dot {
  background: var(--accent-green); border-color: var(--accent-green);
  color: #080d14; box-shadow: var(--shadow-glow-green);
}
.line {
  width: 100%; height: 2px;
  background: var(--border-subtle);
  position: absolute; top: 15px; left: 50%;
  z-index: 0;
}
.done .line { background: var(--accent-green); }
.content { text-align: center; margin-top: 10px; }
.label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.meta { font-size: 10px; color: var(--text-muted); margin-top: 4px; }
.txLink { font-size: 10px; color: var(--accent-blue); font-family: monospace; }
```

---

## Phase 5b: Actor Portal Pages

### API fetch helper

`apps/web/lib/api.ts`:
```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as T
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as T
}

// Client-side SHA-256 using Web Crypto API
export async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

### Seller attestation form

`apps/web/app/seller/attest/new/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, sha256File } from '@/lib/api'
import type { ProductType, Methodology } from '@scope4/types'
import styles from './page.module.css'

const PRODUCTS: ProductType[] = ['steel', 'cement', 'aluminium', 'fertilisers', 'electricity']
const METHODOLOGIES: { value: Methodology; label: string }[] = [
  { value: 'direct_measure', label: 'Direct Measurement' },
  { value: 'default_value', label: 'Default Value' },
  { value: 'national_grid', label: 'National Grid Average' },
]

export default function SellerAttestationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    trade_id: '', seller_name: 'Karabük Demir Çelik A.Ş.',
    seller_wallet: 'DEMO_SELLER_WALLET', facility_id: 'FAC-TR-KARBUK-01',
    product_type: 'steel' as ProductType,
    emissions_intensity_tco2_per_t: 1.89,
    methodology: 'direct_measure' as Methodology,
  })
  const [file, setFile] = useState<File | null>(null)
  const [hash, setHash] = useState<string>('')
  const [result, setResult] = useState<{ solana_tx: string } | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const h = await sha256File(f)
    setHash(h)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await apiPost<{ solana_tx: string; trade_id: string }>(
        '/api/seller/attest',
        { ...form, doc_bundle_hash: hash || 'NO_DOC_HASH' }
      )
      setResult(data)
      setTimeout(() => router.push(`/bundles/${form.trade_id || data.trade_id}`), 2000)
    } catch (err) {
      alert('Submission failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--accent-green)', marginBottom: 8 }}>Attestation Recorded on Solana</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Your emissions declaration is now immutably recorded.</p>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)' }}>
          TX: {result.solana_tx}
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="text-2xl font-bold" style={{ marginBottom: 8 }}>Submit Emissions Declaration</h1>
      <p className="text-secondary" style={{ marginBottom: 32 }}>As a seller/exporter, declare your production emissions intensity for this shipment.</p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div className="form-group">
          <label className="form-label">Trade / Bundle ID</label>
          <input className="form-input" placeholder="e.g. TRD-1234567890-ABCD"
            value={form.trade_id}
            onChange={e => setForm(f => ({ ...f, trade_id: e.target.value }))}
            required id="seller-trade-id" />
          <small className="text-muted">Get this from the importer who initiated the bundle.</small>
        </div>

        <div className="form-group">
          <label className="form-label">Seller / Company Name</label>
          <input className="form-input" value={form.seller_name}
            onChange={e => setForm(f => ({ ...f, seller_name: e.target.value }))}
            required id="seller-name" />
        </div>

        <div className="form-group">
          <label className="form-label">Facility Reference ID</label>
          <input className="form-input" value={form.facility_id}
            onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))}
            required id="seller-facility-id" />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Product Type</label>
            <select className="form-select" id="seller-product-type"
              value={form.product_type}
              onChange={e => setForm(f => ({ ...f, product_type: e.target.value as ProductType }))}>
              {PRODUCTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Emissions Intensity (tCO₂/t)</label>
            <input className="form-input" type="number" step="0.01" min="0" id="seller-intensity"
              value={form.emissions_intensity_tco2_per_t}
              onChange={e => setForm(f => ({ ...f, emissions_intensity_tco2_per_t: parseFloat(e.target.value) }))}
              required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Measurement Methodology</label>
          <select className="form-select" id="seller-methodology"
            value={form.methodology}
            onChange={e => setForm(f => ({ ...f, methodology: e.target.value as Methodology }))}>
            {METHODOLOGIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Supporting Document (optional)</label>
          <input type="file" accept=".pdf,.xlsx,.csv" id="seller-doc-upload"
            onChange={handleFileChange}
            style={{ color: 'var(--text-secondary)' }} />
          {hash && (
            <small style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-blue)' }}>
              SHA-256: {hash.slice(0, 20)}…{hash.slice(-8)}
            </small>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="seller-submit-btn">
          {loading ? 'Recording on Solana…' : 'Submit Attestation'}
        </button>
      </form>
    </div>
  )
}
```

> **Follow this same pattern** for the Importer trade form and Logistics attestation form — same structure, different fields, different API endpoint.

### Bundle detail page

`apps/web/app/bundles/[id]/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import type { BundleDetailResponse } from '@scope4/types'
import Timeline from '@/components/ui/Timeline'
import Badge from '@/components/ui/Badge'
import SolanaLink from '@/components/ui/SolanaLink'
import styles from './page.module.css'

export default function BundleDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<BundleDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const res = await apiGet<BundleDetailResponse>(`/api/bundles/${id}`)
      setData(res)
    } catch (e) {
      setError(String(e))
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)  // 5-second polling
    return () => clearInterval(interval)
  }, [id])

  if (error) return <div className="card" style={{ color: 'var(--accent-red)' }}>Error: {error}</div>
  if (!data) return <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />

  const { bundle, seller, trade, logistics, report } = data

  const timelineSteps = [
    { label: 'Seller Attestation', done: !!seller, tx: seller?.solana_tx, timestamp: seller?.submitted_at },
    { label: 'Importer Trade Record', done: !!trade, tx: trade?.solana_tx, timestamp: trade?.submitted_at },
    { label: 'Logistics Confirmation', done: !!logistics, tx: logistics?.solana_tx, timestamp: logistics?.attested_at },
    { label: 'AI Processing', done: bundle.bundle_status === 'complete', timestamp: bundle.completed_at },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-2xl font-bold">{bundle.trade_id}</h1>
          <p className="text-secondary">Compliance Bundle</p>
        </div>
        <Badge status={bundle.bundle_status} />
      </div>

      {/* Workflow timeline */}
      <div className="card">
        <h3 className="text-lg font-semibold" style={{ marginBottom: 24 }}>Attestation Progress</h3>
        <Timeline steps={timelineSteps} />
      </div>

      {/* 3 attestation cards */}
      <div className="grid-3">
        {seller && (
          <div className="card card-sm">
            <div className="badge badge-complete" style={{ marginBottom: 12 }}>🏭 Seller</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex justify-between"><span className="text-muted">Company</span><span>{seller.seller_name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Product</span><span>{seller.product_type}</span></div>
              <div className="flex justify-between"><span className="text-muted">Intensity</span><span className="text-green">{seller.emissions_intensity_tco2_per_t} tCO₂/t</span></div>
              <div className="flex justify-between"><span className="text-muted">Solana TX</span><SolanaLink tx={seller.solana_tx} /></div>
            </div>
          </div>
        )}
        {trade && (
          <div className="card card-sm">
            <div className="badge badge-complete" style={{ marginBottom: 12 }}>🏢 Importer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex justify-between"><span className="text-muted">Company</span><span>{trade.importer_name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Quantity</span><span>{(trade.quantity_kg / 1000).toFixed(0)} t</span></div>
              <div className="flex justify-between"><span className="text-muted">Invoice</span><span>{trade.invoice_ref}</span></div>
              <div className="flex justify-between"><span className="text-muted">Solana TX</span><SolanaLink tx={trade.solana_tx} /></div>
            </div>
          </div>
        )}
        {logistics && (
          <div className="card card-sm">
            <div className="badge badge-complete" style={{ marginBottom: 12 }}>🚢 Logistics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="flex justify-between"><span className="text-muted">Partner</span><span>{logistics.logistics_name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Qty Confirmed</span><span>{(logistics.quantity_confirmed_kg / 1000).toFixed(0)} t</span></div>
              <div className="flex justify-between"><span className="text-muted">Origin ✓</span><span className="text-green">{logistics.origin_confirmed ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-muted">Solana TX</span><SolanaLink tx={logistics.solana_tx} /></div>
            </div>
          </div>
        )}
      </div>

      {/* AI status / report */}
      {bundle.bundle_status === 'complete' && report ? (
        <div className="card" style={{ borderColor: 'var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="text-lg font-semibold text-green">✓ Report Ready</h3>
            <button className="btn btn-primary" onClick={() => router.push(`/reports/${report.id}`)}>
              View Full Report →
            </button>
          </div>
          <div className="grid-3" style={{ marginTop: 16 }}>
            <div><div className="text-muted text-xs">Embedded tCO₂</div><div className="text-2xl font-bold">{report.embedded_tco2.toFixed(1)}</div></div>
            <div><div className="text-muted text-xs">CBAM Exposure</div><div className="text-2xl font-bold text-amber">€{report.cbam_exposure_eur.toFixed(0)}</div></div>
            <div><div className="text-muted text-xs">Confidence</div><div className="text-2xl font-bold text-green">{report.confidence_level.toUpperCase()}</div></div>
          </div>
        </div>
      ) : bundle.bundle_status === 'processing' ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p className="text-secondary">AI agents are processing this bundle…</p>
        </div>
      ) : null}
    </div>
  )
}
```

---

---

# MEMBER C — AI + Analytics Lead

## Responsibility Summary

You own: emissions dataset, all 4 AI agent modules (pure business logic), dashboard pages and chart components, landing page.

You can start immediately — your agent modules are pure functions with no runtime dependency on A or B.

---

## Phase 1: Emissions Dataset

`packages/agent/src/modules/data/emissions_factors.json`:
```json
{
  "countries": {
    "TR": {
      "steel":       { "intensity_tco2_per_t": 1.89, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "cement":      { "intensity_tco2_per_t": 0.76, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "aluminium":   { "intensity_tco2_per_t": 11.5, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "fertilisers": { "intensity_tco2_per_t": 2.10, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "electricity": { "intensity_tco2_per_mwh": 0.52, "unit": "tCO2/MWh", "source": "IEA 2024 — Turkey grid" }
    },
    "CN": {
      "steel":       { "intensity_tco2_per_t": 2.10, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "cement":      { "intensity_tco2_per_t": 0.82, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "aluminium":   { "intensity_tco2_per_t": 14.2, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "fertilisers": { "intensity_tco2_per_t": 2.45, "unit": "tCO2/tonne", "source": "EU CBAM Default 2024" },
      "electricity": { "intensity_tco2_per_mwh": 0.61, "unit": "tCO2/MWh", "source": "IEA 2024 — China grid" }
    }
  },
  "transport": {
    "sea_short":  { "tco2_per_tkm": 0.000010, "max_km": 3000 },
    "sea_medium": { "tco2_per_tkm": 0.000012, "max_km": 25000 },
    "road":       { "tco2_per_tkm": 0.000096 }
  },
  "distances_km": {
    "TR_IT": 2200, "TR_DE": 2600, "TR_FR": 2900, "TR_NL": 3100, "TR_ES": 3400,
    "CN_IT": 19800, "CN_DE": 20200, "CN_FR": 20500, "CN_NL": 20100, "CN_ES": 20900
  },
  "cbam_certificate_price_eur_per_tco2": 50,
  "version": "2024-demo-v1"
}
```

### Fixtures for demo mode

`packages/agent/src/modules/data/fixtures.ts`:
```typescript
import type { ComplianceBundle, BundleDetailResponse, DashboardSummaryResponse } from '@scope4/types'

// Pre-built fixture data for DEMO_MODE=true
// Used by both the API middleware and frontend Storybook

export const bundles: ComplianceBundle[] = [
  {
    id: 'b1', trade_id: 'DEMO-TR-STEEL-001',
    bundle_status: 'complete',
    seller_attestation_id: 's1', trade_record_id: 't1', logistics_attestation_id: 'l1',
    seller_attested_at: '2026-06-11T10:00:00Z',
    importer_attested_at: '2026-06-11T11:00:00Z',
    logistics_attested_at: '2026-06-11T14:00:00Z',
    ready_at: '2026-06-11T14:00:00Z',
    ai_triggered_at: '2026-06-11T14:01:00Z',
    completed_at: '2026-06-11T14:03:00Z',
    solana_bundle_pda: 'DEMO_BUNDLE_PDA_001',
    created_at: '2026-06-11T09:00:00Z',
  },
  // ... add 4 more here following same structure
]

export function getBundleDetail(trade_id: string): BundleDetailResponse {
  const bundle = bundles.find(b => b.trade_id === trade_id) ?? bundles[0]
  return {
    bundle,
    seller: {
      id: 's1', trade_id: bundle.trade_id,
      seller_name: 'Karabük Demir Çelik A.Ş.',
      seller_wallet: 'DEMO_SELLER_WALLET',
      facility_id: 'FAC-TR-KARBUK-01',
      product_type: 'steel',
      emissions_intensity_tco2_per_t: 1.89,
      methodology: 'direct_measure',
      supporting_doc_url: null,
      doc_bundle_hash: 'a1b2c3d4...', 
      solana_tx: 'DEMO_SELLER_TX_001',
      submitted_at: '2026-06-11T10:00:00Z',
    },
    trade: {
      id: 't1', trade_id: bundle.trade_id,
      importer_name: 'Ferretti Imports S.r.l.',
      importer_wallet: 'DEMO_IMPORTER_WALLET',
      seller_ref: 'Karabük Demir Çelik A.Ş.',
      product_type: 'steel', quantity_kg: 500000,
      origin_country: 'TR', destination_country: 'IT',
      invoice_ref: 'INV-TR-2026-001',
      purchase_date: '2026-06-10',
      doc_bundle_hash: 'b2c3d4e5...',
      solana_tx: 'DEMO_TRADE_TX_001',
      submitted_at: '2026-06-11T11:00:00Z',
    },
    logistics: {
      id: 'l1', trade_id: bundle.trade_id,
      logistics_name: 'MSC Mediterranean Shipping',
      logistics_wallet: 'DEMO_LOGISTICS_WALLET',
      shipment_ref: 'SHP-TR-STEEL-001',
      quantity_confirmed_kg: 500000,
      origin_confirmed: true, route_confirmed: true,
      dispatch_date: '2026-06-09',
      solana_tx: 'DEMO_LOGISTICS_TX_001',
      attested_at: '2026-06-11T14:00:00Z',
    },
    report: {
      id: 'r1', bundle_id: 'b1',
      validation_passed: true, validation_flags: [],
      intensity_source: 'seller_direct',
      // CBAM Reporting Layer
      cbam_embedded_tco2: 945,     // 500t × 1.89 tCO₂/t — production only
      cbam_exposure_eur: 47250,    // 945 × €50 placeholder
      // BI Layer
      transport_tco2: 13.2,        // 500t × 2200km × 0.0000120 — dashboard only
      portfolio_carbon_tco2: 958.2, // embedded + transport — BI only
      confidence_level: 'high', confidence_notes: [],
      report_text: '# CBAM Compliance Report\n\n## CBAM Compliance\nFull report text here...',
      llm_model_used: 'gemini-1.5-flash',
      generated_at: '2026-06-11T14:03:00Z',
    },
    audit_events: [],
  }
}

export const dashboardSummary: DashboardSummaryResponse = {
  latest_insight: {
    id: 'ins1', computed_at: new Date().toISOString(),
    period_start: '2026-05-01', period_end: '2026-06-14',
    total_tco2: 4823, total_cbam_eur: 241150,
    top_country: 'TR', top_product: 'steel', top_supplier: 'Karabük Demir Çelik A.Ş.',
    insight_text: 'Turkish steel imports account for 62% of your total CBAM exposure this quarter. Consider exploring lower-intensity suppliers or alternative sourcing patterns to reduce estimated certificate costs.',
    by_country: { TR: { tco2: 2990, eur: 149500 }, CN: { tco2: 1833, eur: 91650 } },
    by_product: { steel: { tco2: 3010, eur: 150500 }, cement: { tco2: 608, eur: 30400 }, aluminium: { tco2: 639, eur: 31950 }, fertilisers: { tco2: 630, eur: 31500 }, electricity: { tco2: 0, eur: 0 } },
    by_supplier: {
      'Karabük Demir Çelik A.Ş.': { tco2: 1890, eur: 94500 },
      'Baowu Steel Group': { tco2: 1050, eur: 52500 },
    },
    monthly_series: [
      { month: '2026-01', tco2: 620, eur: 31000 },
      { month: '2026-02', tco2: 740, eur: 37000 },
      { month: '2026-03', tco2: 890, eur: 44500 },
      { month: '2026-04', tco2: 960, eur: 48000 },
      { month: '2026-05', tco2: 1080, eur: 54000 },
      { month: '2026-06', tco2: 533, eur: 26650 },
    ],
  },
  bundle_counts: { awaiting_parties: 2, ready: 0, processing: 0, complete: 5, failed: 0 },
}
```

---

## Phase 4a: AI Agent Modules

### `packages/agent/src/modules/validation.ts`

```typescript
import type { ComplianceBundle, SellerAttestation, TradeRecord, LogisticsAttestation, ValidationResult } from '@scope4/types'

// Plausible emissions intensity ranges by product (tCO2/t)
const PLAUSIBLE_RANGES: Record<string, [number, number]> = {
  steel:       [0.5, 5.0],
  cement:      [0.3, 1.5],
  aluminium:   [3.0, 20.0],
  fertilisers: [0.5, 5.0],
  electricity: [0.1, 1.5],  // per MWh
}

export async function runValidation(
  bundle: ComplianceBundle,
  seller: SellerAttestation,
  trade: TradeRecord,
  logistics: LogisticsAttestation
): Promise<ValidationResult> {
  const flags: string[] = []
  let confidence: 'high' | 'medium' | 'low' = 'high'

  // Check 1: Product type consistency
  if (seller.product_type !== trade.product_type) {
    flags.push(`Product type mismatch: seller declared "${seller.product_type}", importer reported "${trade.product_type}"`)
    confidence = 'low'
  }

  // Check 2: Quantity consistency (±5% tolerance)
  const qtyDiff = Math.abs(trade.quantity_kg - logistics.quantity_confirmed_kg) / trade.quantity_kg
  if (qtyDiff > 0.05) {
    flags.push(`Quantity discrepancy: importer reported ${trade.quantity_kg}kg, logistics confirmed ${logistics.quantity_confirmed_kg}kg (${(qtyDiff * 100).toFixed(1)}% diff)`)
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // Check 3: Emissions intensity plausibility
  const range = PLAUSIBLE_RANGES[seller.product_type]
  if (range) {
    const [min, max] = range
    if (seller.emissions_intensity_tco2_per_t < min || seller.emissions_intensity_tco2_per_t > max) {
      flags.push(`Seller intensity (${seller.emissions_intensity_tco2_per_t} tCO₂/t) is outside plausible range [${min}, ${max}] for ${seller.product_type}`)
      confidence = 'low'
    }
  }

  // Check 4: Origin confirmation
  if (!logistics.origin_confirmed) {
    flags.push('Logistics partner did not confirm origin country')
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // Check 5: Route confirmation
  if (!logistics.route_confirmed) {
    flags.push('Logistics partner did not confirm shipping route')
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  // Check 6: Methodology note
  if (seller.methodology === 'default_value') {
    flags.push('Seller used default value methodology — direct measurement preferred for higher confidence')
    confidence = confidence === 'high' ? 'medium' : confidence
  }

  const passed = !flags.some(f => f.includes('mismatch') || f.includes('discrepancy') || f.includes('outside plausible'))

  return { passed, flags, confidence }
}
```

### `packages/agent/src/modules/calculation.ts`

```typescript
import type { SellerAttestation, TradeRecord, ValidationResult, CalculationResult } from '@scope4/types'
import factors from './data/emissions_factors.json'

export async function runCalculation(
  validationResult: ValidationResult,
  seller: SellerAttestation,
  trade: TradeRecord
): Promise<CalculationResult> {

  const quantity_t = trade.quantity_kg / 1000

  // ── Step 1: Determine emissions intensity source (priority order) ────────────
  let intensity_tco2_per_t: number
  let intensity_source: 'seller_direct' | 'seller_default' | 'system_default'
  const confidenceNotes: string[] = [...validationResult.flags]

  if (seller.methodology === 'direct_measure' && validationResult.passed) {
    // Priority 1: Seller provided direct measurement and validation passed
    intensity_tco2_per_t = seller.emissions_intensity_tco2_per_t
    intensity_source = 'seller_direct'
  } else if (seller.methodology === 'default_value' || seller.methodology === 'national_grid') {
    // Priority 2: Seller provided a value but it's not direct measurement
    intensity_tco2_per_t = seller.emissions_intensity_tco2_per_t
    intensity_source = 'seller_default'
    confidenceNotes.push('Using seller-declared default value — not directly measured')
  } else {
    // Priority 3: Fallback to internal EU CBAM default dataset
    const countryFactors = (factors.countries as Record<string, Record<string, { intensity_tco2_per_t?: number; intensity_tco2_per_mwh?: number }>>)[trade.origin_country]
    const productFactor = countryFactors?.[trade.product_type]
    intensity_tco2_per_t = productFactor?.intensity_tco2_per_t ?? productFactor?.intensity_tco2_per_mwh ?? 2.0
    intensity_source = 'system_default'
    confidenceNotes.push(`Using EU CBAM default intensity for ${trade.product_type} from ${trade.origin_country}`)
  }

  // ── Step 2: Embedded emissions ────────────────────────────────────────────────
  const embedded_tco2 = quantity_t * intensity_tco2_per_t

  // ── Step 3: Transport emissions ───────────────────────────────────────────────
  const distanceKey = `${trade.origin_country}_${trade.destination_country}`
  const distance_km = (factors.distances_km as Record<string, number>)[distanceKey] ?? 5000

  // Choose transport mode based on distance
  let transport_factor: number
  if (distance_km <= 3000) {
    transport_factor = factors.transport.sea_short.tco2_per_tkm
  } else {
    transport_factor = factors.transport.sea_medium.tco2_per_tkm
  }

  const transport_tco2 = quantity_t * distance_km * transport_factor

  // ── Step 4: Totals ─────────────────────────────────────────────────────────────
  const total_tco2 = embedded_tco2 + transport_tco2
  const cbam_exposure_eur = total_tco2 * factors.cbam_certificate_price_eur_per_tco2

  // ── Step 5: Final confidence ───────────────────────────────────────────────────
  const confidence = confidenceNotes.length === 0 ? 'high'
    : intensity_source === 'system_default' ? 'low'
    : validationResult.confidence

  return {
    embedded_tco2: parseFloat(embedded_tco2.toFixed(3)),
    transport_tco2: parseFloat(transport_tco2.toFixed(3)),
    total_tco2: parseFloat(total_tco2.toFixed(3)),
    cbam_exposure_eur: parseFloat(cbam_exposure_eur.toFixed(2)),
    intensity_source,
    intensity_value_used: intensity_tco2_per_t,
    distance_km,
    transport_factor_used: transport_factor,
    confidence,
    confidence_notes: confidenceNotes,
  }
}
```

### Unit tests for calculation module

`packages/agent/src/modules/calculation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { runCalculation } from './calculation'
import type { ValidationResult, SellerAttestation, TradeRecord } from '@scope4/types'

const validValidation: ValidationResult = { passed: true, flags: [], confidence: 'high' }

const turkeySteelSeller: SellerAttestation = {
  id: 'test', trade_id: 'test', seller_name: 'Test', seller_wallet: 'test',
  facility_id: 'test', product_type: 'steel',
  emissions_intensity_tco2_per_t: 1.89, methodology: 'direct_measure',
  supporting_doc_url: null, doc_bundle_hash: 'abc', solana_tx: null,
  submitted_at: new Date().toISOString(),
}

const turkeySteelTrade: TradeRecord = {
  id: 'test', trade_id: 'test', importer_name: 'test', importer_wallet: 'test',
  seller_ref: 'test', product_type: 'steel', quantity_kg: 500000,
  origin_country: 'TR', destination_country: 'IT',
  invoice_ref: 'INV-001', purchase_date: '2026-06-01',
  doc_bundle_hash: 'abc', solana_tx: null, submitted_at: new Date().toISOString(),
}

describe('EmissionsCalculationAgent — V2 CBAM/BI Layer Tests', () => {

  // ── CBAM Layer tests ──────────────────────────────────────────────────────

  it('calculates cbam_embedded_tco2 correctly for Turkish steel', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 500 tonnes × 1.89 tCO₂/t = 945 tCO₂
    expect(result.cbam_embedded_tco2).toBeCloseTo(945, 1)
  })

  it('uses seller_direct intensity source when validation passes and method is direct_measure', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    expect(result.intensity_source).toBe('seller_direct')
  })

  it('cbam_exposure_eur = cbam_embedded_tco2 × 50 (NOT total with transport)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 945 × 50 = €47,250 (NOT €47,910 which would include transport)
    expect(result.cbam_exposure_eur).toBeCloseTo(47250, 0)
  })

  it('cbam_exposure_eur NEVER includes transport_tco2 (layer independence)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // Critical: CBAM exposure must only reflect embedded production, never logistics
    const expectedCbamFromEmbeddedOnly = result.cbam_embedded_tco2 * 50
    expect(result.cbam_exposure_eur).toBeCloseTo(expectedCbamFromEmbeddedOnly, 1)
    // If this fails, transport is leaking into CBAM calculation — fix immediately
  })

  it('falls back to seller_default when methodology is not direct_measure', async () => {
    const sellerDefault = { ...turkeySteelSeller, methodology: 'default_value' as const }
    const result = await runCalculation(validValidation, sellerDefault, turkeySteelTrade)
    expect(result.intensity_source).toBe('seller_default')
  })

  it('confidence is high when validation passes and source is seller_direct', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    expect(result.confidence).toBe('high')
  })

  // ── BI Layer tests ───────────────────────────────────────────────────────────

  it('calculates transport_tco2 for TR→IT route (2200km sea) in BI layer', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 500t × 2200km × 0.000012 = 13.2 tCO₂ (BI layer, not CBAM)
    expect(result.transport_tco2).toBeCloseTo(13.2, 1)
  })

  it('portfolio_carbon_tco2 = cbam_embedded + transport (BI only)', async () => {
    const result = await runCalculation(validValidation, turkeySteelSeller, turkeySteelTrade)
    // 945 + 13.2 = 958.2 (shown in dashboard, NOT in CBAM certificate calc)
    expect(result.portfolio_carbon_tco2).toBeCloseTo(958.2, 1)
    expect(result.portfolio_carbon_tco2).toBeGreaterThan(result.cbam_embedded_tco2)
  })
})
```

Run tests with: `pnpm --filter @scope4/agent test`

### `packages/agent/src/modules/report.ts`

```typescript
import type { ComplianceBundle, ValidationResult, CalculationResult } from '@scope4/types'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const SYSTEM_PROMPT = `You are a professional CBAM (Carbon Border Adjustment Mechanism) compliance analyst.
You receive a structured JSON object with verified shipment data and calculation results.
Your task is to write a professional, readable compliance report in Markdown.

CRITICAL LEGAL ACCURACY RULES:
1. Do NOT invent, estimate, or change any numerical values. Use ONLY the numbers provided.
2. Your report MUST have two clearly separated sections:
   a) "## CBAM Compliance" — covers ONLY production-embedded emissions and certificate obligation.
      This section must NOT mention transport or logistics emissions.
   b) "## Carbon Footprint Overview" — covers the broader carbon story including transport.
      Clearly label this as an internal analytics metric, not part of the CBAM obligation.
3. In the CBAM Compliance section:
   - Use cbam_embedded_tco2 as the CBAM certificate obligation base.
   - Use cbam_exposure_eur as the estimated certificate cost.
   - Always state that cbam_exposure_eur uses a placeholder certificate price and is an estimate.
4. In the Carbon Footprint Overview section:
   - Use transport_tco2 for logistics/shipping emissions.
   - Use portfolio_carbon_tco2 for the combined footprint.
   - Clearly label these as BI-layer analytics, NOT CBAM-liable amounts.
5. Do NOT add carbon-reduction recommendations unless directly calculable from the input data.
6. Identify which data came from the seller, importer, and logistics partner.
7. Flag any validation issues with ⚠️ warnings.
8. Use professional compliance language — this document may be shown to auditors and judges.
9. Keep the report 400-600 words.
10. Structure: Summary → Parties → ## CBAM Compliance → ## Carbon Footprint Overview → Data Quality → Audit Trail → Conclusion

Output only the Markdown report. No preamble or meta-commentary.`

export async function generateReport(
  bundle: ComplianceBundle,
  validation: ValidationResult,
  calc: CalculationResult
): Promise<string> {
  const inputPayload = {
    trade_id: bundle.trade_id,
    bundle_status: bundle.bundle_status,
    timestamps: {
      seller_attested: bundle.seller_attested_at,
      importer_attested: bundle.importer_attested_at,
      logistics_attested: bundle.logistics_attested_at,
      bundle_ready: bundle.ready_at,
    },
    validation: {
      passed: validation.passed,
      flags: validation.flags,
      confidence: validation.confidence,
    },
    cbam_reporting_layer: {
      // These are the ONLY figures that belong in the CBAM certificate obligation
      cbam_embedded_tco2: calc.cbam_embedded_tco2,
      cbam_exposure_eur_estimate: calc.cbam_exposure_eur,
      certificate_price_used_eur_per_tco2: 50,
      price_note: 'Placeholder. Real CBAM uses EUA market price at time of declaration.',
    },
    business_intelligence_layer: {
      // These figures extend the picture but are NOT part of the CBAM certificate obligation
      transport_tco2: calc.transport_tco2,
      portfolio_carbon_tco2: calc.portfolio_carbon_tco2,
      distance_km: calc.distance_km,
      note: 'Transport emissions shown for internal carbon-footprint analytics only.',
    },
    data_quality: {
      intensity_source: calc.intensity_source,
      intensity_value_tco2_per_t: calc.intensity_value_used,
      confidence: calc.confidence,
      confidence_notes: calc.confidence_notes,
    },
    audit_note: 'All attestations recorded on Solana Devnet. Tx signatures available on bundle detail page.',
  }

  const prompt = `${SYSTEM_PROMPT}\n\nInput data:\n\`\`\`json\n${JSON.stringify(inputPayload, null, 2)}\n\`\`\``

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    if (!text || text.length < 100) throw new Error('LLM returned empty or too-short report')
    return text
  } catch (err) {
    console.error('[ReportAgent] LLM call failed, using fallback:', err)
    return generateFallbackReport(bundle.trade_id, calc)
  }
}

function generateFallbackReport(trade_id: string, calc: CalculationResult): string {
  return `# CBAM Compliance Report — ${trade_id}

## Summary
This report covers a shipment processed through the Scope4 compliance platform. All three parties (seller, importer, logistics) have attested their respective data on Solana Devnet.

## CBAM Compliance
> CBAM liability is based on **production-embedded emissions only**, per EU Regulation 2023/956.
> Transport and logistics emissions are not included in the certificate obligation.

- **CBAM-liable embedded emissions**: ${calc.cbam_embedded_tco2.toFixed(2)} tCO₂
  _(based on ${calc.intensity_source} intensity of ${calc.intensity_value_used} tCO₂/t)_
- **Estimated CBAM certificate obligation**: €${calc.cbam_exposure_eur.toFixed(2)}
  _(€50/tCO₂ placeholder — actual CBAM uses EUA market price at time of declaration)_

## Carbon Footprint Overview _(Internal Analytics — Not CBAM-Liable)_
- **Transport/logistics emissions**: ${calc.transport_tco2.toFixed(2)} tCO₂
  _(${calc.distance_km} km sea route @ ${calc.transport_factor_used} tCO₂/t·km — dashboard BI metric only)_
- **Full portfolio carbon footprint**: ${calc.portfolio_carbon_tco2.toFixed(2)} tCO₂
  _(embedded + transport, for internal carbon-story analytics)_

## Data Quality
- Intensity source: ${calc.intensity_source}
- Confidence: ${calc.confidence}

*Report generated by Scope4 AI agent. For audit purposes, verify transaction signatures on Solana Explorer.*`
}
```

### `packages/agent/src/modules/analytics.ts`

```typescript
import { supabase } from '@scope4/db'
import type { DashboardInsight } from '@scope4/types'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function runAnalytics(): Promise<DashboardInsight> {
  // 1. Fetch all completed reports
  const { data: reports } = await supabase
    .from('compliance_reports')
    .select(`
      *,
      compliance_bundles (
        trade_id,
        seller_attestations ( seller_name, product_type, emissions_intensity_tco2_per_t ),
        trade_records ( quantity_kg, origin_country, destination_country )
      )
    `)
    .eq('compliance_bundles.bundle_status', 'complete')

  if (!reports || reports.length === 0) return generateEmptyInsight()

  // 2. Aggregate by country
  const byCountry: Record<string, { tco2: number; eur: number }> = {}
  const byProduct: Record<string, { tco2: number; eur: number }> = {}
  const bySupplier: Record<string, { tco2: number; eur: number }> = {}
  const monthlyMap: Record<string, { tco2: number; eur: number }> = {}
  let totalTco2 = 0, totalEur = 0

  // Aggregate by country, product, supplier
  for (const r of reports) {
    const bundle = (r as any).compliance_bundles
    const tradeRecord = bundle?.trade_records
    const sellerAttest = bundle?.seller_attestations
    const country = tradeRecord?.origin_country || 'unknown'
    const product = sellerAttest?.product_type || 'unknown'
    const supplier = sellerAttest?.seller_name || 'unknown'
    const month = r.generated_at?.slice(0, 7) || '2026-06'

    // Use cbam_embedded_tco2 for CBAM aggregations
    // Use portfolio_carbon_tco2 for full carbon story
    const cbam_tco2 = r.cbam_embedded_tco2 || 0
    const cbam_eur = r.cbam_exposure_eur || 0
    const full_tco2 = r.portfolio_carbon_tco2 || r.cbam_embedded_tco2 || 0

    totalTco2 += cbam_tco2   // CBAM-liable total
    totalEur += cbam_eur

    byCountry[country] = { tco2: (byCountry[country]?.tco2 || 0) + cbam_tco2, eur: (byCountry[country]?.eur || 0) + cbam_eur }
    byProduct[product] = { tco2: (byProduct[product]?.tco2 || 0) + cbam_tco2, eur: (byProduct[product]?.eur || 0) + cbam_eur }
    bySupplier[supplier] = { tco2: (bySupplier[supplier]?.tco2 || 0) + cbam_tco2, eur: (bySupplier[supplier]?.eur || 0) + cbam_eur }
    monthlyMap[month] = {
      tco2: (monthlyMap[month]?.tco2 || 0) + cbam_tco2,        // CBAM-liable
      eur:  (monthlyMap[month]?.eur  || 0) + cbam_eur,
      // portfolio_tco2 tracked for dual-series chart
      portfolio_tco2: ((monthlyMap[month] as any)?.portfolio_tco2 || 0) + full_tco2
    }
  }

  const topCountry = Object.entries(byCountry).sort((a,b) => b[1].tco2 - a[1].tco2)[0]?.[0] || ''
  const topProduct = Object.entries(byProduct).sort((a,b) => b[1].tco2 - a[1].tco2)[0]?.[0] || ''
  const topSupplier = Object.entries(bySupplier).sort((a,b) => b[1].tco2 - a[1].tco2)[0]?.[0] || ''

  // 3. Generate LLM narrative (short — just a 2-3 sentence summary card)
  const insight_text = await generateInsightNarrative(
    totalTco2, totalEur, topCountry, topProduct, topSupplier, byCountry
  )

  const monthly_series = Object.entries(monthlyMap)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([month, vals]) => ({ month, ...vals }))

  const insight: Omit<DashboardInsight, 'id'> = {
    computed_at: new Date().toISOString(),
    period_start: '2026-01-01',
    period_end: new Date().toISOString().split('T')[0],
    total_tco2: parseFloat(totalTco2.toFixed(2)),
    total_cbam_eur: parseFloat(totalEur.toFixed(2)),
    top_country: topCountry, top_product: topProduct, top_supplier: topSupplier,
    insight_text,
    by_country: byCountry, by_product: byProduct, by_supplier: bySupplier,
    monthly_series,
  }

  const { data } = await supabase.from('dashboard_insights').insert(insight).select().single()
  return data as DashboardInsight
}

async function generateInsightNarrative(
  totalTco2: number, totalEur: number,
  topCountry: string, topProduct: string, topSupplier: string,
  byCountry: Record<string, { tco2: number; eur: number }>
): Promise<string> {
  const prompt = `You are a CBAM compliance analyst. Write 2-3 concise, insightful sentences for a dashboard summary card.
Use ONLY these exact numbers: total portfolio = ${totalTco2.toFixed(0)} tCO₂ and €${totalEur.toFixed(0)} CBAM exposure.
Top country: ${topCountry} (${byCountry[topCountry]?.tco2.toFixed(0)} tCO₂). Top product: ${topProduct}. Top supplier: ${topSupplier}.
Do not make up any other numbers. Be specific and actionable.`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return `Your portfolio has accumulated ${totalTco2.toFixed(0)} tCO₂ in embedded emissions, corresponding to an estimated €${totalEur.toFixed(0)} in CBAM certificate exposure. ${topCountry} imports account for the largest share, primarily from ${topProduct} shipments.`
  }
}

function generateEmptyInsight(): DashboardInsight {
  return {
    id: 'empty', computed_at: new Date().toISOString(),
    period_start: '2026-01-01', period_end: new Date().toISOString().split('T')[0],
    total_tco2: 0, total_cbam_eur: 0,
    top_country: '', top_product: '', top_supplier: '',
    insight_text: 'No completed bundles yet. Submit your first shipment to generate insights.',
    by_country: {}, by_product: {}, by_supplier: {}, monthly_series: [],
  }
}
```

---

## Phase 6: Dashboard

### Dashboard page

`apps/web/app/dashboard/page.tsx`:
```tsx
'use client'
import useSWR from 'swr'
import { apiGet } from '@/lib/api'
import type { DashboardSummaryResponse, BundleStatus } from '@scope4/types'
import EmissionsByCountryBar from '@/components/charts/EmissionsByCountryBar'
import EmissionsByProductDonut from '@/components/charts/EmissionsByProductDonut'
import MonthlyTrendArea from '@/components/charts/MonthlyTrendArea'
import AIInsightCard from '@/components/charts/AIInsightCard'
import styles from './page.module.css'

const STATUS_ORDER: BundleStatus[] = ['awaiting_parties', 'ready', 'processing', 'complete', 'failed']
const STATUS_LABELS: Record<BundleStatus, string> = {
  awaiting_parties: 'Awaiting', ready: 'Ready', processing: 'Processing',
  complete: 'Complete', failed: 'Failed'
}

function BigNumber({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="card">
      <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardSummaryResponse>(
    '/api/dashboard/summary',
    (url: string) => apiGet(url),
    { refreshInterval: 10000 }
  )

  if (isLoading || !data) {
    return <div className="grid-4" style={{ gap: 16 }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
    </div>
  }

  const insight = data.latest_insight
  const counts = data.bundle_counts

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-3xl font-extrabold">Carbon Intelligence Dashboard</h1>
        <p className="text-secondary">Real-time CBAM compliance analytics for your import portfolio</p>
      </div>

      {/* ── CBAM Reporting Layer KPIs ── */}
      <div style={{ marginBottom: 4 }}>
        <div className="text-xs font-semibold" style={{ color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          ― CBAM Reporting Layer — Production-embedded emissions only (EU Reg 2023/956)
        </div>
        <div className="grid-4">
          <BigNumber label="CBAM-liable Embedded tCO₂" value={insight ? insight.total_tco2.toFixed(0) : '—'} unit="tCO₂" color="var(--accent-green)" />
          <BigNumber label="Estimated CBAM Exposure ★" value={insight ? `€${(insight.total_cbam_eur / 1000).toFixed(0)}k` : '—'} color="var(--accent-amber)" />
          <BigNumber label="Complete Bundles" value={String(counts.complete)} color="var(--accent-green)" />
          <BigNumber label="Pending" value={String(counts.awaiting_parties + counts.ready + counts.processing)} color="var(--accent-blue)" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          ★ Estimate only. Certificate price placeholder: €50/tCO₂. Real CBAM uses EUA market price at time of declaration.
        </p>
      </div>

      {/* ── Bundle pipeline ── */}
      <div className="card">
        <h3 className="text-lg font-semibold" style={{ marginBottom: 16 }}>Bundle Pipeline</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {STATUS_ORDER.map(s => (
            <div key={s} className={`badge badge-${s}`} style={{ fontSize: 13, padding: '8px 16px' }}>
              {STATUS_LABELS[s]} · {counts[s] || 0}
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2">
        {insight && <EmissionsByCountryBar data={insight.by_country} />}
        {insight && <EmissionsByProductDonut data={insight.by_product} />}
      </div>

      {/* Monthly trend */}
      {insight && <MonthlyTrendArea data={insight.monthly_series} />}

      {/* AI Insight card */}
      {insight && <AIInsightCard text={insight.insight_text} topCountry={insight.top_country} topProduct={insight.top_product} />}
    </div>
  )
}
```

### Chart components

`apps/web/components/charts/EmissionsByCountryBar.tsx`:
```tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Record<string, { tco2: number; eur: number }>
}

const COUNTRY_LABELS: Record<string, string> = { TR: '🇹🇷 Turkey', CN: '🇨🇳 China' }

export default function EmissionsByCountryBar({ data }: Props) {
  const chartData = Object.entries(data).map(([country, vals]) => ({
    country: COUNTRY_LABELS[country] || country,
    tco2: parseFloat(vals.tco2.toFixed(1)),
    eur: parseFloat(vals.eur.toFixed(0)),
  }))

  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: 20 }}>Emissions by Origin Country</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={(v) => `${v}t`} tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <YAxis type="category" dataKey="country" tick={{ fill: '#8b9cb8', fontSize: 12 }} width={90} />
          <Tooltip
            contentStyle={{ background: '#0f1723', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#f0f4ff' }}
            formatter={(val: number) => [`${val.toFixed(1)} tCO₂`, 'Emissions']}
          />
          <Bar dataKey="tco2" fill="#00d992" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

`apps/web/components/charts/MonthlyTrendArea.tsx`:
```tsx
'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Array<{ month: string; tco2: number; eur: number }>
}

export default function MonthlyTrendArea({ data }: Props) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold" style={{ marginBottom: 20 }}>Monthly tCO₂ Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tco2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d992" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d992" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <YAxis tickFormatter={v => `${v}t`} tick={{ fill: '#8b9cb8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#0f1723', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            formatter={(v: number) => [`${v.toFixed(1)} tCO₂`, 'Emissions']}
          />
          <Area type="monotone" dataKey="tco2" stroke="#00d992" fill="url(#tco2Grad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

`apps/web/components/charts/AIInsightCard.tsx`:
```tsx
export default function AIInsightCard({ text, topCountry, topProduct }: { text: string; topCountry: string; topProduct: string }) {
  return (
    <div className="card" style={{ borderColor: 'rgba(0, 217, 146, 0.3)', background: 'rgba(0, 217, 146, 0.03)' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🤖</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            AI Portfolio Insight
          </div>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>{text}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 8: Landing Page (SiteLab)

`apps/landing/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scope4 — Trustless CBAM Carbon Compliance</title>
  <meta name="description" content="Scope4 automates EU CBAM carbon compliance using Solana blockchain attestations and Gemini AI agents. Built for importers of carbon-intensive goods." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <!-- Navigation -->
  <nav class="nav">
    <div class="nav-inner">
      <div class="logo"><span class="logo-mark">S4</span> Scope4</div>
      <a href="#how-it-works" class="btn btn-sm">How It Works</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero">
    <div class="hero-badge">🏆 Built for ETH Global Hackathon 2026</div>
    <h1 class="hero-title">
      CBAM compliance,<br />
      <span class="gradient-text">automated by AI.<br />Trusted by blockchain.</span>
    </h1>
    <p class="hero-subtitle">
      Scope4 connects sellers, importers, and logistics partners on Solana —
      then lets AI agents calculate your carbon exposure and generate auditable reports.
      No spreadsheets. No manual chasing. No greenwashing.
    </p>
    <div class="hero-cta">
      <a href="https://scope4-app.vercel.app" class="btn btn-primary btn-lg">
        Launch App →
      </a>
      <a href="https://github.com/ege-john/Scope4" class="btn btn-secondary btn-lg" target="_blank">
        View on GitHub
      </a>
    </div>
    <div class="hero-badges">
      <span class="tech-badge">⚡ Solana Devnet</span>
      <span class="tech-badge">🤖 Gemini AI</span>
      <span class="tech-badge">🔒 Multi-Party Attestation</span>
    </div>
  </section>

  <!-- Problem -->
  <section class="section" id="problem">
    <div class="section-label">The Problem</div>
    <h2 class="section-title">CBAM is getting mandatory.<br />The tooling isn't ready.</h2>
    <div class="cards-3">
      <div class="problem-card">
        <div class="problem-icon">📋</div>
        <h3>Manual & fragmented</h3>
        <p>Importers still collect emissions data via email, PDFs, and spreadsheets — scattered across systems that can't be verified.</p>
      </div>
      <div class="problem-card">
        <div class="problem-icon">🔓</div>
        <h3>No shared trust</h3>
        <p>Sellers, importers, logistics partners, and auditors each hold partial information with no tamper-resistant shared record.</p>
      </div>
      <div class="problem-card">
        <div class="problem-icon">⏳</div>
        <h3>Slow and costly</h3>
        <p>Without automation, compliance teams discover data gaps too late — increasing reporting errors and regulatory risk.</p>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="section" id="how-it-works" style="background: rgba(255,255,255,0.01);">
    <div class="section-label">The Solution</div>
    <h2 class="section-title">Three parties attest. One AI calculates.</h2>
    <div class="flow">
      <div class="flow-step">
        <div class="flow-number">1</div>
        <div class="flow-icon">🏭</div>
        <h3>Seller declares emissions</h3>
        <p>The exporter submits production intensity, facility reference, and supporting evidence. Hashed and attested on Solana.</p>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="flow-number">2</div>
        <div class="flow-icon">🏢</div>
        <h3>Importer submits trade data</h3>
        <p>Quantity, invoice, product type, and purchase reference — separately recorded on-chain as an independent attestation.</p>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="flow-number">3</div>
        <div class="flow-icon">🚢</div>
        <h3>Logistics confirms shipment</h3>
        <p>A third-party logistics partner verifies quantity, origin, and route consistency. Their signature triggers the AI.</p>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="flow-number">4</div>
        <div class="flow-icon">🤖</div>
        <h3>AI validates and reports</h3>
        <p>AI agents cross-check all three inputs, compute CBAM exposure, and generate a professional compliance report.</p>
      </div>
    </div>
  </section>

  <!-- Technology -->
  <section class="section" id="technology">
    <div class="section-label">Technology</div>
    <h2 class="section-title">Built on real infrastructure.</h2>
    <div class="cards-3">
      <div class="tech-card">
        <div class="tech-logo solana-logo">◎</div>
        <h3>Solana</h3>
        <p>Multi-party workflow attestation. Immutable, fast, and cheap enough to put every compliance event on-chain.</p>
      </div>
      <div class="tech-card">
        <div class="tech-logo gemini-logo">✦</div>
        <h3>Gemini AI</h3>
        <p>Event-driven AI agents validate, calculate, and narrate — turning raw attestation data into audit-ready reports.</p>
      </div>
      <div class="tech-card">
        <div class="tech-logo supabase-logo">⚡</div>
        <h3>Supabase</h3>
        <p>Off-chain data, document storage, and real-time dashboard powered by Postgres and a managed cloud stack.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="logo"><span class="logo-mark">S4</span> Scope4</div>
      <p style="color: #4a5c74; font-size: 13px;">Built for ETH Global Hackathon 2026 · Open source · MIT licence</p>
      <div style="display: flex; gap: 16px;">
        <a href="https://github.com/ege-john/Scope4" target="_blank" style="color: #8b9cb8; font-size: 13px;">GitHub →</a>
      </div>
    </div>
  </footer>

</body>
</html>
```

`apps/landing/styles.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; background: #080d14; color: #f0f4ff; -webkit-font-smoothing: antialiased; }

/* Nav */
.nav { position: sticky; top: 0; z-index: 100; padding: 0 40px; height: 64px; display: flex; align-items: center; background: rgba(8,13,20,0.8); border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(12px); }
.nav-inner { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1200px; margin: 0 auto; }
.logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; }
.logo-mark { width: 32px; height: 32px; border-radius: 8px; background: #00d992; color: #080d14; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; border: none; text-decoration: none; font-family: 'Inter', sans-serif; }
.btn-primary { background: #00d992; color: #080d14; }
.btn-primary:hover { background: #00f5a8; transform: translateY(-1px); box-shadow: 0 0 24px rgba(0,217,146,0.3); }
.btn-secondary { background: rgba(22,32,50,0.8); color: #f0f4ff; border: 1px solid rgba(255,255,255,0.1); }
.btn-secondary:hover { border-color: #00d992; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-lg { padding: 14px 28px; font-size: 16px; }

/* Hero */
.hero { max-width: 1200px; margin: 0 auto; padding: 120px 40px 100px; text-align: center; }
.hero-badge { display: inline-block; padding: 6px 16px; border-radius: 100px; background: rgba(0,217,146,0.1); border: 1px solid rgba(0,217,146,0.2); color: #00d992; font-size: 12px; font-weight: 600; margin-bottom: 32px; letter-spacing: 0.04em; }
.hero-title { font-size: clamp(36px, 6vw, 72px); font-weight: 900; line-height: 1.1; margin-bottom: 24px; letter-spacing: -0.02em; }
.gradient-text { background: linear-gradient(135deg, #00d992 0%, #3d91ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-subtitle { font-size: 18px; color: #8b9cb8; max-width: 640px; margin: 0 auto 40px; line-height: 1.7; }
.hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
.hero-badges { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.tech-badge { padding: 6px 14px; border-radius: 100px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #8b9cb8; }

/* Sections */
.section { padding: 100px 40px; }
.section > * { max-width: 1200px; margin: 0 auto; }
.section-label { font-size: 11px; font-weight: 700; color: #00d992; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
.section-title { font-size: clamp(28px, 4vw, 48px); font-weight: 800; line-height: 1.2; margin-bottom: 48px; letter-spacing: -0.02em; }

/* Problem cards */
.cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; }
.problem-card { background: rgba(22,32,50,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; }
.problem-icon { font-size: 36px; margin-bottom: 16px; }
.problem-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.problem-card p { font-size: 14px; color: #8b9cb8; line-height: 1.7; }

/* Flow diagram */
.flow { display: flex; align-items: flex-start; gap: 8px; max-width: 1200px; margin: 0 auto; flex-wrap: wrap; }
.flow-step { flex: 1; min-width: 180px; background: rgba(22,32,50,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 28px 20px; text-align: center; position: relative; }
.flow-number { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; background: #00d992; border-radius: 50%; color: #080d14; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.flow-icon { font-size: 32px; margin-bottom: 12px; }
.flow-step h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.flow-step p { font-size: 12px; color: #8b9cb8; line-height: 1.6; }
.flow-arrow { font-size: 24px; color: #00d992; margin-top: 60px; flex-shrink: 0; }

/* Tech cards */
.tech-card { background: rgba(22,32,50,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; }
.tech-logo { font-size: 36px; margin-bottom: 16px; }
.solana-logo { color: #9945FF; }
.gemini-logo { color: #4285F4; }
.supabase-logo { color: #3ECF8E; }
.tech-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
.tech-card p { font-size: 14px; color: #8b9cb8; line-height: 1.7; }

/* Footer */
.footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px; }
.footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }

@media (max-width: 768px) {
  .cards-3 { grid-template-columns: 1fr; }
  .flow { flex-direction: column; }
  .flow-arrow { transform: rotate(90deg); align-self: center; margin-top: 0; }
}
```

---

## Integration Checkpoints

### Checkpoint 1 (Day 1 end — A)
- [ ] `packages/types/index.ts` pushed to main
- [ ] Supabase project live, URL shared in group chat
- [ ] Seed script runs successfully
- B and C can now branch and start building against the type contracts

### Checkpoint 2 (Day 3 end — A)
- [ ] Solana Devnet program deployed, program address shared
- [ ] All 10 API endpoints return 200 with test data
- [ ] Agent polling loop starts without error
- B can now switch from fixture API calls to real API calls

### Checkpoint 3 (Day 3 end — C)
- [ ] `calculation.ts` unit tests all pass
- [ ] `fixtures.ts` complete and imported by API middleware
- [ ] `validation.ts` manually tested with 3 scenarios
- A can now wire the orchestrator to C's module functions

### Checkpoint 4 (Day 4 end — ALL)
- [ ] Full happy path works end-to-end: seller form → importer form → logistics form → AI agent processes → report visible
- [ ] Dashboard loads with real or fixture data
- All 3 run this together

### Final verification (Day 5)
- [ ] All Anchor tests pass on Devnet
- [ ] Demo mode (`DEMO_MODE=true`) returns deterministic fixtures
- [ ] Fallback screenshots captured for all 6 critical screens
- [ ] Video recording done
- [ ] README complete with contract address + deployed URLs
