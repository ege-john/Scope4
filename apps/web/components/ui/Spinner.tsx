interface SpinnerProps {
  size?: number
}

export default function Spinner({ size = 24 }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid var(--border-glass)`,
        borderTopColor: 'var(--accent-green)',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}
