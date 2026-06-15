'use client'

import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
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
        <Image src="/SC-33.png" alt="Scope4" width={120} height={36} style={{ objectFit: 'contain' }} priority />
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
