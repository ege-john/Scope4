'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, sha256File } from '@/lib/api'
import type { ProductType, Methodology } from '@scope4/types'
import SolanaLink from '@/components/ui/SolanaLink'

const PRODUCTS: { value: ProductType; label: string }[] = [
  { value: 'steel',       label: 'Steel' },
  { value: 'cement',      label: 'Cement' },
  { value: 'aluminium',   label: 'Aluminium' },
  { value: 'fertilisers', label: 'Fertilisers' },
  { value: 'electricity', label: 'Electricity' },
]

const METHODOLOGIES: { value: Methodology; label: string }[] = [
  { value: 'direct_measure', label: 'Direct Measurement' },
  { value: 'default_value',  label: 'Default Value' },
  { value: 'national_grid',  label: 'National Grid Average' },
]

export default function SellerAttestationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ solana_tx: string; trade_id: string } | null>(null)
  const [hash, setHash] = useState('')
  const [form, setForm] = useState({
    trade_id: '',
    seller_name: 'Karabük Demir Çelik A.Ş.',
    seller_wallet: 'CYqiXwY1b5snxDpcyZWMyAHJHoL1HR6W5sZgaMiMF7sW',
    facility_id: 'FAC-TR-KARBUK-01',
    product_type: 'steel' as ProductType,
    emissions_intensity_tco2_per_t: 1.89,
    methodology: 'direct_measure' as Methodology,
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setHash(await sha256File(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await apiPost<{ solana_tx: string; trade_id: string }>(
        '/api/attestations/seller',
        { ...form, doc_bundle_hash: hash || 'NO_DOC_HASH' },
      )
      setResult(data)
    } catch (err) {
      alert('Submission failed — is the API running?\n' + String(err))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 className="text-xl font-bold text-green" style={{ marginBottom: 8 }}>
            Attestation Recorded on Solana
          </h2>
          <p className="text-secondary" style={{ marginBottom: 16 }}>
            Your emissions declaration is now immutably recorded.
          </p>
          <SolanaLink tx={result.solana_tx} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => router.push(`/bundles/${result.trade_id}`)}>
              View Bundle →
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/seller')}>
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-2xl font-bold">Submit Emissions Declaration</h1>
        <p className="text-secondary" style={{ marginTop: 4 }}>
          Declare your production emissions intensity. This will be recorded on Solana.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Trade / Bundle ID</label>
          <input
            className="form-input"
            placeholder="e.g. TRD-1234567890-ABCD"
            value={form.trade_id}
            onChange={(e) => setForm((f) => ({ ...f, trade_id: e.target.value }))}
            required
          />
          <small className="text-muted" style={{ fontSize: 11 }}>
            Get this from the importer who initiated the bundle.
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Seller / Company Name</label>
          <input
            className="form-input"
            value={form.seller_name}
            onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Facility Reference ID</label>
          <input
            className="form-input"
            value={form.facility_id}
            onChange={(e) => setForm((f) => ({ ...f, facility_id: e.target.value }))}
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Product Type</label>
            <select
              className="form-select"
              value={form.product_type}
              onChange={(e) => setForm((f) => ({ ...f, product_type: e.target.value as ProductType }))}
            >
              {PRODUCTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Emissions Intensity (tCO₂/t)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={form.emissions_intensity_tco2_per_t}
              onChange={(e) =>
                setForm((f) => ({ ...f, emissions_intensity_tco2_per_t: parseFloat(e.target.value) }))
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Measurement Methodology</label>
          <select
            className="form-select"
            value={form.methodology}
            onChange={(e) => setForm((f) => ({ ...f, methodology: e.target.value as Methodology }))}
          >
            {METHODOLOGIES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Supporting Document (optional)</label>
          <input
            type="file"
            accept=".pdf,.xlsx,.csv"
            onChange={handleFile}
            style={{ color: 'var(--text-secondary)' }}
          />
          {hash && (
            <small style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-blue)' }}>
              SHA-256: {hash.slice(0, 24)}…
            </small>
          )}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px 24px', marginTop: 4 }} disabled={loading}>
          {loading ? 'Recording on Solana…' : 'Submit Attestation'}
        </button>
      </form>
    </div>
  )
}
