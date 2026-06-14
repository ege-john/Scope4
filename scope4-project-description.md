# Scope4 Project Description

## Project Overview

Scope4 is a B2B compliance platform that combines blockchain and AI agents to automate CBAM compliance workflows and produce auditable ESG-ready carbon reporting for importers of carbon-intensive goods. The project is designed around a simple but high-impact thesis: cross-border carbon compliance is becoming a mandatory business process, yet the data collection, validation, and reporting flow is still fragmented, manual, and vulnerable to manipulation or error.[cite:5][cite:34]

The initial product focus is on EU importers dealing with CBAM-covered goods from Turkey and China. Instead of trying to cover every geography and every trade pattern, the project narrows the scope to the most demoable and most defensible version of the problem: an importer submits a shipment record, a logistics actor confirms the shipment on-chain, and an AI agent then calculates the emissions-related compliance output and generates a report.

This framing makes the project both practical and differentiated. It is practical because it focuses on the core compliance bottleneck rather than trying to reinvent global trade finance. It is differentiated because it uses Solana not merely as a database substitute, but as a multi-party trust layer where more than one actor participates in the evidence trail before the AI workflow begins.[cite:36][cite:68]

## The Problem

The European Union's Carbon Border Adjustment Mechanism (CBAM) requires importers of specified carbon-intensive goods to report embedded emissions and comply with a more formal declaration and certificate regime from 2026 onward.[cite:5][cite:34] This creates a new operational burden for importers, especially those buying from non-EU countries where emissions accounting methods, carbon pricing systems, and documentation quality may differ significantly.[cite:34]

Today, many businesses still rely on spreadsheets, email chains, supplier questionnaires, and fragmented trade documentation to assemble CBAM evidence. This creates five clear problems:

- Manual reporting is slow and costly.
- Supplier data is inconsistent and often incomplete.
- Embedded-emissions calculations are difficult to standardize across shipments.
- Auditability is weak because supporting evidence is scattered across emails, PDFs, and internal systems.
- Greenwashing and data manipulation become easier when the reporting trail is centralized and editable.

For a regulator, auditor, or enterprise compliance team, the hardest part is not only calculating a carbon number. The harder problem is proving that a shipment record, supporting documents, and emissions assumptions were captured in a trustworthy sequence and were not silently altered later.[cite:34][cite:43]

## The Solution

Scope4 addresses this problem by combining three elements into one workflow:

1. A web platform where importers submit trade data and compliance evidence.
2. A Solana-based smart-contract layer that records the trade attestation and logistics approval as immutable workflow events.
3. An AI agent system that reacts to approved on-chain events, computes CBAM-relevant outputs, and generates a structured compliance report.

The product does not attempt to move the underlying commercial payment for imports onto blockchain. That choice is deliberate. For the hackathon, the highest-value role of blockchain is not payment settlement but trust, auditability, shared verification, and workflow coordination between multiple parties.[cite:36][cite:68]

The result is a compliance product where blockchain secures the evidence trail and AI automates the reasoning and reporting layer.

## Core Workflow

The end-to-end flow of Scope4 is designed to be easy to understand in a live demo and strong enough to support the project's prize applications.

### Step 1: Importer submits a shipment

An importing company uses the web interface to submit a pending trade record. The form includes:

- Importer identity
- Supplier identity
- Product category
- Quantity
- Origin country
- Destination country
- Shipment or invoice reference
- Timestamp or shipment date
- Optional attached supporting documents

For the hackathon MVP, origin countries are limited to Turkey and China. This keeps the project narrow enough to be reliable while still representing major CBAM-relevant external trade relationships.

### Step 2: Smart contract records a pending trade event

A Solana smart contract stores a minimal version of the trade event on-chain. The record is not meant to hold large documents or the full final report. Instead, it stores structured proof that a shipment record was submitted, by whom, and in what state.

Example on-chain fields:

- Trade ID
- Importer wallet or company identifier
- Supplier identifier
- Product type
- Quantity
- Origin country
- Destination country
- Submission timestamp
- External invoice or receipt reference
- Hash of attached off-chain document bundle
- Workflow status

This keeps the blockchain layer lightweight, explainable, and aligned with real audit needs.

### Step 3: Logistics firm approves the shipment

A second actor, such as a logistics company or shipment-verification partner, confirms key shipment details on-chain. This is one of the most important design choices in the project.

Instead of making Solana a passive archive, Scope4 uses it as a multi-party trust layer. The importer cannot unilaterally push a trade into the compliance engine as final. The shipment first moves into a "pending" state and only becomes "approved" when the logistics actor validates it.

The logistics actor does not approve the carbon calculation. Its role is narrower and more realistic: it confirms operational shipment facts such as shipment reference, origin, and quantity consistency. After that approval, the contract emits an event that triggers the AI workflow.

### Step 4: AI agent detects the approved event

The AI agent backend listens for approved trade events emitted by the smart contract. Once an approval is detected, the agent retrieves the structured shipment payload and begins the compliance workflow.

This event-driven pattern is critical to the project narrative. It shows that the AI system is not acting on arbitrary user input alone; it acts on an attested workflow event that has already passed through a multi-party blockchain checkpoint.

### Step 5: AI agent enriches the record with carbon data

The AI agent queries an internal structured dataset rather than browsing the live web during the demo. This dataset contains country- and product-level emissions assumptions and reporting parameters for the supported demo scope.

For the MVP:

- Supported origin countries: Turkey and China
- Supported product categories: the architecture is extensible, but the demo implementation should remain narrow enough to fully work
- Carbon data source: hardcoded or structured internal dataset for demo reliability

This design choice reduces demo risk and improves reproducibility. A live web-browsing agent may sound more impressive, but it is much more likely to fail in a timed judging session.

### Step 6: AI agent calculates compliance outputs

Once the shipment data and carbon-intensity assumptions are available, the agent computes:

- Estimated embedded emissions for the shipment
- Emissions intensity per supported product logic
- A CBAM-relevant cost or exposure estimate
- Status flags for confidence, missing fields, or use of default assumptions

The goal is not to claim legal finality. The goal is to generate a credible, structured compliance artifact that helps importers understand risk and prepare reporting faster.

### Step 7: AI agent generates a human-readable report

After calculation, the AI system turns the structured output into a readable compliance summary that can be used internally by importers and externally for audit preparation.

The report may include:

- Shipment summary
- Source and destination context
- Emissions assumptions used
- Estimated embedded carbon
- Estimated CBAM liability or exposure
- Data-confidence notes
- Evidence references
- Audit trail summary

### Step 8: Dashboard displays the full audit trail and business intelligence layer

The frontend dashboard shows the progression of each shipment through the system:

- Submitted by importer
- Approved by logistics actor
- Processed by AI agent
- Report generated
- Compliance package ready

In addition to workflow visibility, Scope4 includes an interactive analytics dashboard that helps the importing company understand its carbon-tax story over time. The dashboard is not only a compliance monitor; it is also a financial and operational decision-support layer that can create direct business value from the collected trade and emissions data.

The dashboard should allow the company to explore:

- Estimated CBAM-related tax or certificate exposure across shipments
- Total spending driven by carbon-related import obligations
- Total embedded emissions associated with imported goods
- Emissions trends over time by shipment, product, supplier, and origin country
- Scope 1, Scope 2, and Scope 3 categorization views where relevant to the reporting model
- Estimated emissions contribution by scope category
- High-risk suppliers, products, or routes with elevated carbon cost exposure
- Comparison of lower-emission versus higher-emission sourcing patterns

An AI agent supports this dashboard by classifying shipment-related emissions into the relevant scope categories using imported-goods metadata, historical records, and previously learned patterns from the internal data model. This allows the company to move beyond static reporting and start using the platform as an emissions-intelligence and cost-analysis tool.

From a product strategy perspective, this dashboard matters because it expands Scope4 from a pure compliance utility into a decision-support platform. Instead of only answering "Are we compliant?" the system also answers "What is carbon regulation costing us?" "Where are our largest emissions exposures?" and "Which sourcing patterns create the highest financial and environmental burden?"

This gives the project a clearer path to financial value creation. A company could use Scope4 not only to reduce reporting friction, but also to optimize sourcing, compare suppliers, forecast regulatory cost exposure, and identify the operational drivers behind its imported carbon footprint. In a hackathon setting, this also makes the demo more compelling because the dashboard shows visible analytical value in addition to blockchain workflow automation.

## Why Blockchain Is Used

A central question the project must answer is: why use blockchain at all?

The answer is that Scope4 is not using blockchain because payments need to be tokenized. It is using blockchain because carbon-compliance workflows require a shared source of truth across actors who do not naturally trust one another, including importers, logistics partners, auditors, and potentially regulators.[cite:60][cite:68]

If all records sit only in a private vendor database, every stakeholder must trust the software provider's internal system. By contrast, an on-chain event log creates an immutable and independently verifiable sequence of approvals and state changes. In the Scope4 design, this improves:

- Trustworthiness of shipment attestation
- Resistance to silent record modification
- Transparency of the compliance workflow
- Cross-party auditability
- Sponsor alignment with Solana and Blockchain for Good themes

The blockchain role is therefore limited and purposeful: coordinate trust, not replace the entire trade ecosystem.

## Why AI Agents Are Used

AI agents are the automation and interpretation layer of the system.

Traditional compliance tooling often stops at recordkeeping or dashboards. Scope4 goes further by making the system reactive. Once an approved shipment event appears on-chain, the agent automatically starts the next steps: enrich data, apply the compliance logic, compute the estimate, and generate the report.

AI is useful in this context for three reasons:

- It reduces manual work in recurring compliance tasks.
- It converts structured calculations into readable reports for operations and compliance teams.
- It can flag uncertainty, missing information, or suspicious data patterns before reporting is finalized.

This makes the product a genuine AI + Web3 workflow rather than a blockchain-only proof-of-concept or an LLM wrapper with no trust layer.

## What Problems Scope4 Solves

Scope4 aims to solve the following business and policy problems:

### 1. Manual CBAM compliance overhead

Importers face growing reporting complexity as CBAM moves into its definitive regime, increasing the burden of gathering shipment and emissions data.[cite:5][cite:34]

### 2. Weak auditability

Compliance evidence is often dispersed across multiple systems and file types, which makes later verification harder.[cite:34]

### 3. Greenwashing and unverifiable claims

When environmental reporting depends on editable and siloed records, it becomes easier to manipulate or selectively omit information.

### 4. Poor cross-party trust

Importers, suppliers, logistics actors, and auditors may each hold partial information, but they lack a shared and tamper-resistant event history.

### 5. Delayed reporting decisions

Without automation, companies discover data gaps too late, increasing the risk of poor reporting quality and compliance stress.

## Prize Strategy

Scope4 is intentionally designed to fit several hackathon tracks and bounties shown in the event materials.

### Main Track

The Main Track calls for projects at the intersection of AI and Web3, especially trust layers for AI, autonomous coordination systems, and bold but functional products.[cite:17] Scope4 fits because the project combines a blockchain-based attestation workflow with an event-driven AI compliance agent, producing a trust-enabled automation layer for carbon reporting.

### Solana Prize

The Solana bounty asks for AI agents on Solana.[cite:18] Scope4 directly matches this requirement because a Solana smart contract emits the event that triggers the AI workflow. The on-chain state is not decorative; it controls the workflow transition from pending submission to approved compliance processing.

### Blockchain for Good Alliance

The Blockchain for Good bounty focuses on social and environmental impact, transparency and accountability, interoperability, and scalable solutions.[cite:18] Scope4 aligns strongly because it targets carbon-accountability infrastructure, helps reduce greenwashing risk, and improves trust in sustainability reporting.

### Mood Global Services

Mood Global seeks the best innovative AI use case.[cite:18] Scope4 is relevant because AI is not used as a chatbot gimmick; it is embedded into a real-world operational workflow where it performs compliance reasoning, structured calculation, and report generation after an on-chain attestation event.

### SiteLab

SiteLab rewards the best landing page or website for the idea.[cite:18] Scope4 plans to build a strong public-facing web experience that explains the problem, demonstrates the workflow, and presents the product with polished UX and visual clarity.

### Terna

The project does not target Terna because the Terna bounty is focused on AI-based electricity-grid and climate-risk analysis, especially around weather and landslide-related infrastructure monitoring.[cite:17] Scope4 is unrelated to that use case, so not applying is a strategic choice.

## Prize Requirements and How Scope4 Responds

The event materials indicate several baseline judging and submission requirements:

- A public open-source code repository must be provided.[cite:16]
- If applicable, deployed contract addresses should be shared.[cite:16]
- A walkthrough video or demo of up to 3 minutes is required.[cite:16]
- Teams will present in a short live demo format followed by Q&A.[cite:16]
- Judging heavily rewards live code, full implementation of claimed functionality, usability, feasibility, and innovation.[cite:16]

These requirements strongly influence the Scope4 product design. The project deliberately avoids unnecessary complexity, such as real on-chain import payment settlement, because such features would increase failure risk without materially improving prize fit.

Instead, the MVP focuses on an end-to-end workflow that can be fully demonstrated:

- Submit shipment
- Approve shipment on-chain
- Trigger AI agent
- Compute result
- Generate report
- Show dashboard and landing page

This increases the chance of scoring well on the event's code, feasibility, and navigation criteria.[cite:16]

## Product Boundaries for the Hackathon MVP

To keep the project feasible, the MVP should have clearly defined constraints.

### In scope

- One strong end-to-end demo scenario
- Turkey and China as origin countries
- Solana smart contract for workflow attestation
- Logistics approval step on-chain
- AI-triggered compliance pipeline
- Structured carbon-intensity dataset for demo use
- Dashboard for workflow visibility
- Strong landing page for SiteLab eligibility

### Out of scope

- Real on-chain commercial settlement of import payments
- Full support for every possible exporter country
- Full legal-grade enterprise integrations
- Real-time browsing across live regulatory sources during the demo
- Complex multi-sponsor feature creep that weakens the core use case

## Proposed Demo Narrative

The live demo should tell a simple story:

An Italian importer buys a CBAM-covered good from Turkey or China. The importer submits the shipment in Scope4. The logistics partner validates the shipment details on Solana. That approval triggers an AI agent, which retrieves the shipment data, applies the carbon-intensity assumptions, calculates the estimated compliance exposure, and generates an auditable report. The dashboard then shows the shipment's full journey from submission to compliance-ready output.

This narrative is easy to grasp, visibly uses both AI and blockchain, and maps directly to the prizes the project is targeting.

## Why This Project Is Strong for a Hackathon

Scope4 is a strong hackathon project because it has a real regulatory use case, a credible market need, a clear reason to use blockchain, and a clear reason to use AI. It also benefits from being demonstrable in a short time window.

Many hackathon projects are either technically flashy but commercially weak, or commercially plausible but technologically generic. Scope4 is stronger because it ties the technology choices directly to the workflow design:

- Blockchain is used for shared trust and auditability.
- AI is used for automation and report generation.
- The web app is used for usability and sponsor alignment.
- The scope is narrow enough to ship.

That combination makes the project more defensible in front of judges evaluating novelty, execution quality, and real-world usefulness.[cite:16][cite:17][cite:18]

## Final Positioning Statement

Scope4 is an AI-powered carbon compliance platform built on Solana that helps EU importers automate CBAM workflows through a shared, auditable evidence trail. Importers submit shipment data, logistics partners attest shipment details on-chain, and AI agents transform those trusted events into carbon estimates and compliance-ready reports. The project is designed to compete across Main Track, Solana, Blockchain for Good, Mood Global, and SiteLab by combining environmental impact, trust infrastructure, agentic automation, and a clear live-demo product story.[cite:16][cite:17][cite:18]
