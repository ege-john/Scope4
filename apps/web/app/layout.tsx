import type { Metadata } from 'next'
import '../styles/globals.css'
import styles from './layout.module.css'
import RoleHeader from '@/components/layout/RoleHeader'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Scope4 — CBAM Compliance Platform',
  description: 'AI-powered carbon compliance for EU importers. Built on Solana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className={styles.appShell}>
          <Sidebar />
          <div className={styles.mainArea}>
            <RoleHeader />
            <main className={styles.pageContent}>{children}</main>
            <footer className={styles.footer}>
              <span className={styles.footerLeaf}>🌍</span>
              <span>
                Scope4 makes carbon compliance <strong>transparent, auditable, and automated</strong> —
                helping global trade move toward a lower-carbon future.
              </span>
              <span className={styles.footerDivider}>·</span>
              <span className={styles.footerTag}>Tech for Good · Climate Accountability · Agentic AI</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
