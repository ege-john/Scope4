'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, sha256File } from '@/lib/api'
import type { ProductType, OriginCountry, DestinationCountry } from '@scope4/types'
import SolanaLink from '@/components/ui/SolanaLink'

const PRODUCTS: { value: ProductType; label: string }[] = [
  { value: 'steel',       label: 'Steel' },
  { value: 'cement',      label: 'Cement' },
  { value: 'aluminium',   label: 'Aluminium' },
  { value: 'fertilisers', label: 'Fertilisers' },
  { value: 'electricity', label: 'Electricity' },
]

const ORIGINS: { value: OriginCountry; label: string }[] = [
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'CN', label: '🇨🇳 China' },
]

const DESTINATIONS: { value: DestinationCountry; label: string }[] = [
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
]

export default function ImporterTradeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ solana_tx: string; trade_id: string } | null>(null)
  const [hash, setHash] = useState('')
  const [form, setForm] = useState({
    importer_name: 'Ferretti Imports S.r.l.',
    importer_wallet: 'Aac9ghUvsgMgDKMTKKjdR4s9rf5c8cs6C3oUocPZKbkd',
    seller_ref: '',
    product_type: 'steel' as ProductType,
    quantity_kg: 500000,
    origin_country: 'TR' as OriginCountry,
    destination_country: 'IT' as DestinationCountry,
    invoice_ref: '',
    purchase_date: new Date().toISOString().split('T')[0],
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
        '/api/importer/trade',
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
            Trade Record Submitted
          </h2>
          <p className="text-secondary" style={{ marginBottom: 8 }}>
            Bundle ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{result.trade_id}</span>
          </p>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 16 }}>
            Share this ID with your seller and logistics partner so they can attest.
          </p>
          <SolanaLink tx={result.solana_tx} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => router.push(`/bundles/${result.trade_id}`)}>
              View Bundle →
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/importer')}>
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-2xl font-bold">Submit Trade Record</h1>
        <p className="text-secondary" style={{ marginTop: 4 }}>
          Record the commercial details of your import. A new compliance bundle will be created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Importer Company Name</label>
          <input
            className="form-input"
            value={form.importer_name}
            onChange={(e) => setForm((f) => ({ ...f, importer_name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Seller / Supplier Reference</label>
          <input
            className="form-input"
            placeholder="e.g. Karabük Demir Çelik A.Ş."
            value={form.seller_ref}
            onChange={(e) => setForm((f) => ({ ...f, seller_ref: e.target.value }))}
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
            <label className="form-label">Quantity (kg)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={form.quantity_kg}
              onChange={(e) => setForm((f) => ({ ...f, quantity_kg: parseInt(e.target.value) }))}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Origin Country</label>
            <select
              className="form-select"
              value={form.origin_country}
              onChange={(e) => setForm((f) => ({ ...f, origin_country: e.target.value as OriginCountry }))}
            >
              {ORIGINS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Destination Country</label>
            <select
              className="form-select"
              value={form.destination_country}
              onChange={(e) =>
                setForm((f) => ({ ...f, destination_country: e.target.value as DestinationCountry }))
              }
            >
              {DESTINATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Invoice Reference</label>
            <input
              className="form-input"
              placeholder="e.g. INV-2026-001"
              value={form.invoice_ref}
              onChange={(e) => setForm((f) => ({ ...f, invoice_ref: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Purchase Date</label>
            <input
              className="form-input"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Invoice Document (optional)</label>
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

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Creating Bundle…' : 'Submit Trade Record'}
        </button>
      </form>
    </div>
  )
}
