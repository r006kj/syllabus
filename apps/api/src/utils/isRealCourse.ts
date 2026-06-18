export const isRealCourse = (name: string) => {
  return /\([A-Za-z]{2,4}\d{3,4}\)/.test(name)
}