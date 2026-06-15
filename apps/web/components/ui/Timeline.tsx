import styles from './Timeline.module.css'

interface Step {
  label: string
  done: boolean
  tx?: string | null
  timestamp?: string | null
}

export default function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <div key={i} className={`${styles.step} ${step.done ? styles.done : ''}`}>
          <div className={styles.indicator}>
            <div className={styles.dot}>{step.done ? '✓' : i + 1}</div>
            {i < steps.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.content}>
            <div className={styles.label}>{step.label}</div>
            {step.timestamp && (
              <div className={styles.meta}>
                {new Date(step.timestamp).toLocaleString()}
              </div>
            )}
            {step.tx && (
              <a
                href={`https://explorer.solana.com/tx/${step.tx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                {step.tx.slice(0, 12)}… ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
