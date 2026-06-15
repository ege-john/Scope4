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
    <html lang="en">
      <body>
        <div className={styles.appShell}>
          <Sidebar />
          <div className={styles.mainArea}>
            <RoleHeader />
            <main className={styles.pageContent}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
