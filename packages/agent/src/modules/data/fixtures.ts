import { ComplianceBundle, Attestation } from '@scope4/types';

/**
 * ==============================================================================
 * PRE-START TASK: Day-0 Team Sync Agreements
 * WHO DID THIS: Member C (AI/Data Models)
 * WHAT WE DID: Created hardcoded "dummy" data objects (fixtures) that exactly match 
 * the TypeScript types agreed upon in the types package.
 * WHY WE DID IT: So that Member B (Frontend) can immediately import this mock data 
 * to build the UI (charts, tables) without having to wait for Member A to finish 
 * building the actual database or API endpoints.
 * ==============================================================================
 */

export const mockBundle: ComplianceBundle = {
    id: 'bundle-001',
    products: [
        { id: 'p1', name: 'Steel Coils', hs_code: '7208', co2_per_unit: 2.1 },
        { id: 'p2', name: 'Aluminum Sheets', hs_code: '7606', co2_per_unit: 1.5 }
    ],
    supplier: { id: 's1', name: 'Global Metals Inc.', country: 'TR' },
    total_emissions: 3.6, // sum of co2_per_unit
    cbam_due_eur: 180.50, // mock calculation
    status: 'validated'
};

export const mockAttestations: Attestation[] = [
    {
        id: 'att-001',
        actor_id: 'CYqiXwY1b5snxDpcyZWMyAHJHoL1HR6W5sZgaMiMF7sW', // Seller PubKey
        role: 'seller',
        bundle_id: 'bundle-001',
        signature: 'sig_mock_xyz123',
        timestamp: new Date().toISOString()
    },
    {
        id: 'att-002',
        actor_id: '8vkjdjQx2PS1HXhdNbfAcMjogKKPkDa6di5He62BCM1N', // Logistics PubKey
        role: 'logistics',
        bundle_id: 'bundle-001',
        signature: 'sig_mock_abc456',
        timestamp: new Date().toISOString()
    }
];

export const mockDashboardData = {
    total_tco2: 4823,
    total_cbam_eur: 241150,
    top_country: 'TR',
    active_shipments: 12
};
