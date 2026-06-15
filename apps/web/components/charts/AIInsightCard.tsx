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
