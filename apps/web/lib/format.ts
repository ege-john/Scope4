/**
 * Truncate long IDs for table/card display.
 * Full value is kept in the title attribute for copy/hover.
 * e.g. "TRD-1234567890-ABCDEF" → "TRD-1234…CDEF"
 */
export function truncateId(id: string | null | undefined, start = 8, end = 4): string {
  if (!id) return '—'
  if (id.length <= start + end + 3) return id
  return `${id.slice(0, start)}…${id.slice(-end)}`
}
