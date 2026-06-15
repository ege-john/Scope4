import { bundles, getBundleDetail } from '../data/fixtures'

// Generate mock reports based on our fixtures
const mockReports = bundles.map(b => {
  const detail = getBundleDetail(b.trade_id)
  return {
    ...detail.report,
    compliance_bundles: {
      trade_id: detail.bundle.trade_id,
      bundle_status: detail.bundle.bundle_status,
      seller_attestations: {
        seller_name: detail.seller?.seller_name,
        product_type: detail.seller?.product_type,
        emissions_intensity_tco2_per_t: detail.seller?.emissions_intensity_tco2_per_t,
      },
      trade_records: {
        quantity_kg: detail.trade?.quantity_kg,
        origin_country: detail.trade?.origin_country,
        destination_country: detail.trade?.destination_country,
      }
    }
  }
})

// A simple mock for Supabase client
export const mockSupabase = {
  from: (table: string) => ({
    select: (query: string) => ({
      eq: (column: string, value: any) => {
        if (table === 'compliance_reports' && column === 'compliance_bundles.bundle_status' && value === 'complete') {
          return Promise.resolve({ data: mockReports, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'mock-id', ...data }, error: null })
      })
    })
  })
}
