interface SolanaLinkProps {
  tx: string | null
  label?: string
}

export default function SolanaLink({ tx, label }: SolanaLinkProps) {
  if (!tx) return <span style={{ color: 'var(--text-muted)' }}>—</span>

  const base =
    process.env.NEXT_PUBLIC_SOLANA_EXPLORER_BASE || 'https://explorer.solana.com/tx'
  const href = `${base}/${tx}?cluster=devnet`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--accent-blue)', fontSize: 12, fontFamily: 'monospace' }}
    >
      {label ?? `${tx.slice(0, 8)}…${tx.slice(-6)}`} ↗
    </a>
  )
}
