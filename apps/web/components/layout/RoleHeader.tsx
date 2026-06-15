'use client'

import { useRouter, usePathname } from 'next/navigation'
import styles from './RoleHeader.module.css'

const ROLES = [
  { label: 'Seller',    href: '/seller',    id: 'seller' },
  { label: 'Importer',  href: '/importer',  id: 'importer' },
  { label: 'Logistics', href: '/logistics', id: 'logistics' },
  { label: 'Dashboard', href: '/dashboard', id: 'dashboard' },
]

export default function RoleHeader() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <svg className={styles.logoMark} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="5"  r="3" fill="currentColor"/>
          <circle cx="5"  cy="22" r="3" fill="currentColor"/>
          <circle cx="23" cy="22" r="3" fill="currentColor"/>
          <line x1="14" y1="5"  x2="5"  y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
          <line x1="14" y1="5"  x2="23" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
          <line x1="5"  y1="22" x2="23" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
        </svg>
        <span className={styles.logoText}>
          Scope<span className={styles.logoAccent}>4</span>
        </span>
      </div>

      <nav className={styles.roleNav}>
        {ROLES.map((role) => (
          <button
            key={role.id}
            id={`role-btn-${role.id}`}
            className={`${styles.roleBtn} ${pathname.startsWith(role.href) ? styles.active : ''}`}
            onClick={() => router.push(role.href)}
          >
            {role.label}
          </button>
        ))}
      </nav>

      <div className={styles.networkBadge}>
        <span className={styles.dot} />
        Solana Devnet
      </div>
    </header>
  )
}
