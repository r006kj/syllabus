/**
 * Returns the current academic term code based on the calendar date.
 * USIL convention:
 *   Jan–Feb  → YYYY-00  (verano)
 *   Mar–Jul  → YYYY-01  (ciclo 1)
 *   Aug–Nov  → YYYY-02  (ciclo 2)
 *   Dec      → (YYYY+1)-00  (verano del siguiente año)
 */
export const getCurrentTerm = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1–12

  if (month <= 2)  return `${year}-00`
  if (month <= 7)  return `${year}-01`
  if (month <= 11) return `${year}-02`
  return `${year + 1}-00`
}

/**
 * Returns true if a Canvas course belongs to the current term.
 * Checks both the course name and the Canvas term name (if present).
 */
export const isCurrentTermCourse = (course: { name?: string; term?: { name?: string } }): boolean => {
  const term = getCurrentTerm()
  // Normalize: lowercase + collapse whitespace/underscores to dashes
  const clean = (s: string) => (s ?? '').toLowerCase().replace(/[\s_]+/g, '-')
  return clean(course.name ?? '').includes(term) || clean(course.term?.name ?? '').includes(term)
}
