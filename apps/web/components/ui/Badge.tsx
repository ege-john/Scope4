import type { BundleStatus } from '@scope4/types'

interface BadgeProps {
  status: BundleStatus
  label?: string
}

const STATUS_LABELS: Record<BundleStatus, string> = {
  awaiting_parties: 'Awaiting Parties',
  ready:            'Ready',
  processing:       'Processing',
  complete:         'Complete',
  failed:           'Failed',
}

export default function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}
