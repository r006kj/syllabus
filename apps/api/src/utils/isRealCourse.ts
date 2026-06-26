const EXCLUDE_PATTERNS = [
  /sandbox/i,
  /test\s*course/i,
  /^test$/i,
  /^prueba$/i,
  /^demo$/i,
  /sample/i,
]

export const isRealCourse = (name: string) => {
  if (!name || name.trim().length < 3) return false
  return !EXCLUDE_PATTERNS.some(p => p.test(name))
}
