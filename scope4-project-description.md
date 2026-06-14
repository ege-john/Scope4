# Scope4 Project Description

## Project Overview

Scope4 is a B2B compliance platform that combines blockchain and AI agents to automate CBAM (Carbon Border Adjustment Mechanism) compliance workflows and produce auditable ESG-ready carbon reporting for importers of carbon-intensive goods. The project is designed around a simple but high-impact thesis: cross-border carbon compliance is becoming a mandatory business process, yet the data collection, validation, and reporting flow is still fragmented, manual, and vulnerable to manipulation or error.

The initial product focus is on EU importers dealing with CBAM-covered goods from Turkey and China. Rather than trying to cover every geography and every trade pattern, the project narrows the scope to the most demoable and legally defensible version of the problem: a **4-Actor Hybrid Attestation Model** where the exporter, importer, and logistics partner independently attest to transaction facts on-chain before an AI agent orchestration pipeline processes the combined data.

This framing makes the project both practical and differentiated. It is practical because it focuses on the core compliance bottleneck rather than trying to reinvent global trade finance. It is differentiated because it uses Solana not merely as a database substitute, but as a multi-party trust layer where three distinct human parties (Seller, Importer, Logistics) sign their own version of the truth before the AI validation and compliance workflow begins.

Furthermore, Scope4 incorporates a legally rigorous **CBAM/BI Layer Separation**. EU Regulation 2023/956 dictates that CBAM certificates apply only to production-embedded emissions. Scope4 separates regulatory liabilities (embedded emissions only) from business intelligence carbon tracking (which includes transport/logistics emissions). This ensures compliance reports are fully defensible to auditors while providing a comprehensive carbon footprint narrative to corporate decision-makers.

---

## The Problem

The European Union's Carbon Border Adjustment Mechanism (CBAM) requires importers of specified carbon-intensive goods (steel, cement, aluminium, fertilisers, electricity) to report embedded emissions and purchase corresponding CBAM certificates from 2026 onward. This creates a new operational burden for importers, especially those buying from non-EU countries where emissions accounting methods, carbon pricing systems, and documentation quality differ significantly.

Today, many businesses still rely on spreadsheets, email chains, supplier questionnaires, and fragmented trade documentation to assemble CBAM evidence. This creates five clear problems:

- **Manual reporting overhead:** Gathering data from foreign suppliers, matching it with customs receipts, and manually computing footprint statistics is slow and costly.
- **Supplier verification gap:** Importers cannot credibly self-report emissions they did not produce. In a real-world scenario, the exporter (seller) must declare the production emissions, facility parameters, and methodology.
- **Complexity of calculations:** Embedded-emissions calculations are difficult to standardize, leading to compliance errors.
- **Weak audit trails:** Supporting evidence is scattered across email attachments, PDFs, and internal databases, making independent auditing slow and error-prone.
- **Data vulnerability:** Greenwashing and data manipulation are easy when the reporting trail is stored in a centralized, editable database.

For a regulator, auditor, or enterprise compliance team, the hardest part is not only calculating a carbon number. The harder problem is proving that a shipment record, supporting documents, and emissions assumptions were captured in a trustworthy sequence and were not silently altered later.

---

## The Solution

Scope4 addresses this problem by combining three elements into one workflow:

1. **A web platform** where Sellers, Importers, and Logistics partners log in, switch between simulated roles, submit trade data, and upload compliance evidence.
2. **A Solana-based smart-contract layer** that records the attestations and workflow states as immutable, on-chain records (Program Derived Addresses, or PDAs) containing hashes of the off-chain payloads.
3. **An AI agent system (Node.js TypeScript service)** that reacts to approved on-chain events, verifies data consistency, computes regulatory CBAM obligations and BI carbon footprint metrics, and generates a structured, human-readable compliance report using Gemini.

The product does not attempt to move the underlying commercial payment for imports onto the blockchain. That choice is deliberate. For the hackathon, the highest-value role of blockchain is not payment settlement, but trust, auditability, shared verification, and workflow coordination between multiple parties.

The result is a compliance product where blockchain secures the evidence trail and AI automates the reasoning, validation, and reporting layer.

---

## 4-Actor Hybrid Attestation Model

To model a realistic supply chain trust environment, Scope4 coordinates four actors who each contribute a distinct category of truth:

| Actor | Role | Key Contributions |
|---|---|---|
| **Seller / Exporter** | Turkish steel mill or Chinese manufacturer | Production emissions intensity, facility reference, emissions methodology (direct measurement, default values, or national grid), hash of supporting document bundle. |
| **Importer / Buyer** | European corporate importer | Commercial details: quantity (kg), destination country, invoice reference, purchase date, hash of trade invoice. |
| **Logistics Partner** | Freight forwarder / carrier | Operational facts: shipment reference, confirmed cargo weight, origin confirmation, route confirmation, dispatch date. |
| **AI Agents** | Verification, calculation, and reporting engine | Autonomous cross-checking of the three actor inputs for discrepancies, CBAM tax calculation, LLM-generated compliance report, and portfolio carbon insights. |

---

## Core Workflow

The end-to-end flow of Scope4 is designed to be easy to understand in a live demo and strong enough to support the project's prize applications.

```
  [SELLER / Exporter]           [IMPORTER / Buyer]        [LOGISTICS]
  Turkish steel mill            Italian company           Freight forwarder
        │                             │                        │
        │ 1. Submits                  │ 2. Submits             │ 3. Attests
        │ - production intensity      │ - quantity             │ - shipment ref
        │ - facility reference        │ - invoice ref          │ - qty check
        │ - methodology used          │ - product type         │ - route check
        │ - supporting doc hash       │ - destination          │ - dispatch date
        │                             │                        │
        ▼                             ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (off-chain)                           │
│  seller_attestations  │  trade_records  │  logistics_attestations     │
│  + documents stored in Supabase Storage                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ hashes + pubkeys
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   SOLANA DEVNET (on-chain)                            │
│                                                                       │
│  SellerAttestation PDA  │  TradeRecord PDA  │  LogisticsAttest PDA   │
│                         │                   │                         │
│           ComplianceBundle PDA — links all three                      │
│           state: AwaitingParties → ReadyForProcessing                 │
│                         │                                             │
│           Emits: ComplianceBundleReady event  ─────────────────────► │
└──────────────────────────────────────────────────────────────────────┘
                                                                        │
                                                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      AI AGENT SERVICE (Node.js)                       │
│                                                                       │
│  1. ValidationAgent    → cross-checks 3 actor inputs for consistency  │
│  2. EmissionsAgent     → deterministic CBAM calculation               │
│  3. ReportAgent        → LLM (Gemini) generates compliance report     │
│  4. AnalyticsAgent     → dashboard BI, insights, portfolio summary    │
└──────────────────────────────────────────────────────────────────────┘
                                                                        │
                                                                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                NEXT.JS FRONTEND (Vercel)                              │
│                                                                       │
│  /seller        /importer        /logistics        /dashboard         │
│  Seller portal  Importer portal  Approval portal   Analytics + BI     │
│                                                                       │
│  /bundles/[id]   Full compliance bundle audit trail + report          │
└──────────────────────────────────────────────────────────────────────┘
```

### Step 1: The Three Parties Attest
The three human-simulated actors submit their data:
- **The Seller** submits production intensity, facility data, methodology, and uploads supporting PDFs. The browser automatically computes a SHA-256 hash of the documents. A transaction is sent to Solana to record these parameters on-chain under a `SellerAttestation` account.
- **The Importer** submits commercial parameters, invoice numbers, and invoice files. A transaction is sent to Solana to record these parameters under a `TradeRecord` account.
- **The Logistics Partner** reviews the pending shipment, confirming quantity (kg), origin, and route. They submit their operational confirmation on-chain to the `LogisticsAttestation` account.
*(Submissions can happen in any order. The system handles asynchronous state aggregation).*

### Step 2: Smart Contract Updates State and Emits Trigger
The Solana program checks if all three attestations (Seller, Importer, Logistics) are complete for the given `trade_id`.
- If all three flags are true, the `ComplianceBundle` PDA updates its status from `AwaitingParties` to `ReadyForProcessing`.
- The contract emits a `ComplianceBundleReady` event. 

### Step 3: AI Agent Detects Event and Begins Validation
The AI agent service (monitoring the database via 5-second polling) detects the `ReadyForProcessing` status. 
1. **ValidationAgent (Deterministic):** Cross-checks the parameters submitted by the three actors. It checks that `seller.product_type === trade.product_type`, that the countries align, and that the logistics-confirmed weight is within a ±5% tolerance of the importer-declared invoice weight. If a discrepancy is found, it raises validation flags.

### Step 4: AI Agent Computes Emissions (CBAM/BI Split)
The **EmissionsCalculationAgent** processes the verified data using a two-layer calculation structure:
- **Layer 1 (CBAM Reporting Layer):** Calculates regulatory embedded production emissions:
  $$\text{Embedded } \text{tCO}_2 = \frac{\text{Quantity (kg)}}{1000} \times \text{Production Intensity}$$
  It multiplies this by a configurable certificate price placeholder (e.g., €50/tCO₂) to output the estimated CBAM certificate exposure.
- **Layer 2 (Business Intelligence Layer):** Separately computes transport emissions based on shipment route distance and transport mode factors. This transport footprint is tracked for corporate ESG carbon-story reporting but is strictly excluded from the regulatory CBAM liability calculation to ensure legal compliance with EU Regulation 2023/956.

### Step 5: Report Generation
The **ReportGenerationAgent** takes the structured calculation results and sends them to the **Gemini 1.5 Flash** API with a strict system prompt. The model generates a professional, human-readable compliance summary including a shipment summary, emissions breakdown, confidence assessment, and an audit trail mapping the Solana transactions.

### Step 6: Aggregation and Analytics
The **AnalyticsInsightAgent** aggregates the new data across the importer's portfolio (total tCO₂ by country, product, and supplier; total CBAM certificate costs). It uses Gemini to write a brief narrative summary card (e.g., "Turkish steel accounts for 67% of your CBAM exposure..."). The results are written to a dashboard cache for the frontend to render.

---

## Why Blockchain Is Used

A central question the project must answer is: why use blockchain at all?

Scope4 is using blockchain because carbon-compliance workflows require a shared source of truth across actors who do not naturally trust one another, including importers, suppliers, logistics partners, auditors, and regulators.

If all records sit only in a private vendor database, every stakeholder must trust the software provider's internal system. By contrast, an on-chain event log creates an immutable, independently verifiable sequence of approvals and state changes.

In the Scope4 design, this improves:
- **Trustworthiness of shipment attestation:** The seller declares the intensity, the importer declares the commercial volume, and the logistics partner confirms the physical movement. None of them can retrospectively edit their inputs to avoid tax liability without breaking the on-chain cryptographic signatures.
- **Resistance to silent record modification:** Document hashes (SHA-256) are stored on-chain. If an importer attempts to alter an invoice or certificate PDF, the hash will no longer match the Solana record, invalidating the audit trail.
- **Workflow coordination:** The AI engine is triggered by a verifiable state change (`ReadyForProcessing`) that can only be reached when all three parties have signed.

---

## Why AI Agents Are Used

AI agents are the automation and interpretation layer of the system.

Scope4 goes beyond standard compliance recordkeeping by making the system fully reactive. Once the on-chain checkpoint is passed, the agent daemon coordinates validation, calculation, and output formatting.

AI is used for three reasons:
- **Automated report writing:** It translates complex, multi-party shipment facts and formulas into professional, natural-language business reports that compliance teams and auditors can read.
- **Discrepancy explanation:** If the validation agent flags a discrepancy (e.g., a weight difference or mismatched product type), the LLM explains the potential cause and highlights the specific actor's input.
- **Dashboard insights:** It parses portfolio arrays (emissions by route, country, and product) to generate contextual text summaries that highlight carbon-tax risks and supplier performance, transforming raw numbers into decision-making logic.

---

## What Problems Scope4 Solves

Scope4 solves the following business and policy problems:

1. **Manual CBAM compliance overhead:** Replaces manual emails and spreadsheets with a single coordinated workflow.
2. **Weak auditability:** Provides a single, tamper-resistant audit trail where documents, signatures, and calculation steps are linked.
3. **Greenwashing and data manipulation:** Prevents selective omission or retrofitted carbon accounting by freezing the data state on Solana.
4. **Poor cross-party trust:** Establishes a shared record between exporters, buyers, and logistics companies.
5. **Legally inflated carbon estimates:** Protects importers by keeping transport emissions separated from the regulatory CBAM liability reporting, while still maintaining full footprint tracking for corporate ESG analytics.

---

## Prize Strategy

Scope4 is intentionally designed to fit several hackathon tracks and bounties:

- **Main Track (AI + Web3 Intersection):** Integrates Solana state tracking with an event-driven AI agent workflow, showing how blockchain serves as a trust anchor for automated AI reasoning.
- **Solana Prize (AI Agents on Solana):** Implements Program Derived Addresses (PDAs) to orchestrate supply chain roles, triggering the Gemini-powered agent service using on-chain state readiness.
- **Blockchain for Good Alliance:** Builds environmental accountability infrastructure, targeting carbon-accounting transparency and reducing regulatory fraud.
- **Mood Global Services (Innovative AI Use Case):** Uses AI not as a generic chatbot, but as an operational system agent performing multi-source validation, math parsing, and automated reporting.
- **SiteLab (Best Landing Page/Website):** Builds a polished, dark-mode, glass-morphism web dashboard that includes a dedicated landing page detailing the 4-actor solution.

---

## Product Boundaries for the Hackathon MVP

To keep the project feasible, the MVP has clearly defined constraints:

### In scope
- One complete happy-path demo scenario (Turkey/China to Italy).
- 4-Actor role switcher in the frontend header to allow easy live demonstrations.
- Solana Devnet smart contract implementing `ComplianceBundle`, `SellerAttestation`, `TradeRecord`, and `LogisticsAttestation` PDAs.
- Deterministic Validation and Emissions Calculation modules.
- Gemini 1.5 Flash report generation and dashboard insight generation.
- Polished, dark-mode dashboard with charts mapping embedded emissions, transport footprints, and estimated CBAM costs.
- Separate landing page design.

### Out of scope
- Real on-chain commercial payment or invoice settlement.
- Real Phantom wallet signatures for all three actors (all wallets are simulated using generated keypairs and signed programmatically to allow smooth, single-operator demo flows).
- Real-time regulatory web scraping (uses the internal `emissions_factors.json` static data).
- PDF download exports (simulated via preview in browser).

---

## Proposed Demo Scenario

```
[0:00 – 0:20]  Landing page: "Automate CBAM compliance. Trustlessly." Explain the 4-Actor model.
[0:20 – 0:55]  Switch to [🏭 Seller] role. Submit steel emissions intensity (1.89 tCO₂/t)
               and upload verification doc. Submit -> Solana tx links to Explorer.
[0:55 – 1:30]  Switch to [🏢 Importer] role. Submit purchase invoice for 500 tonnes of steel
               from Turkey destined for Italy. Submit -> Solana tx logs the invoice hash.
[1:30 – 2:00]  Switch to [🚢 Logistics] role. Review cargo weight and route.
               Submit approval -> Solana tx triggers state update: "Ready for Processing".
[2:00 – 2:30]  Switch to [🏢 Importer] role. Observe polling status "Processing..."
               changing to "Report Ready". Click to open report.
[2:30 – 3:15]  Show Compliance Report: Highlight CBAM Reporting Layer (945 tCO₂ embedded,
               estimated €47,250 obligation) separate from BI Layer (13.2 tCO₂ transport).
               Show the immutable audit trail linked to the Solana Explorer.
[3:15 – 4:00]  Show Dashboard: Aggregate ESG widgets, emissions charts, and the
               Gemini-generated portfolio summary explaining carbon exposure risk.
```

---

## Risk Mitigation & Fallback Matrix

| Failure | Fallback |
|---|---|
| **Solana Devnet down** | Enable `DEMO_MODE=true` in `.env` to bypass blockchain writes, logging simulated transaction hashes in the database. |
| **Agent service slow** | Pre-generated reports are stored in the database for the demo trade ID and loaded instantly if the agent is unresponsive. |
| **Gemini API quota** | Fallback to local cached summary narratives and cached markdown reports. |
| **Supabase database down** | Entire client switches to local React context loaded from `fixtures.ts`. |
