/**
 * ==============================================================================
 * PRE-START TASK: Day-0 Team Sync Agreements
 * WHO DID THIS: Member A (Blockchain/Backend) and Member C (AI/Data Models)
 * WHAT WE DID: Defined the exact TypeScript interfaces and function signatures.
 * WHY WE DID IT: This serves as the "Source of Truth" contract. By locking these 
 * types on Day 0, Member A can call these functions and Member C can implement 
 * them in parallel without breaking each other's code.
 * ==============================================================================
 */

export interface Product {
    id: string;
    name: string;
    hs_code: string;
    co2_per_unit: number; // tons of CO2 equivalent
}

export interface Supplier {
    id: string;
    name: string;
    country: string;
}

export interface ComplianceBundle {
    id: string;
    products: Product[];
    supplier: Supplier;
    total_emissions: number;
    cbam_due_eur: number;
    status: 'draft' | 'validated' | 'submitted' | 'attested';
}

export interface Attestation {
    id: string;
    actor_id: string;
    role: 'seller' | 'importer' | 'logistics';
    bundle_id: string;
    signature: string;
    timestamp: string;
}

export interface ValidationResult {
    passed: boolean;
    flags: string[];
    cbam_cost?: number;
    tco2?: number;
}

// ── MODULE FUNCTION SIGNATURES ────────────────────────────────────
// These are the exact signatures that Member C (AI) will implement 
// and Member A (Backend/Agent) will call.

export type RunValidationFn = (
    bundle: ComplianceBundle, 
    attestations: Attestation[]
) => Promise<ValidationResult>;

export type CalculateCbamFn = (
    bundle: ComplianceBundle
) => Promise<{ cost_eur: number; effective_rate: number }>;
