export const normalizeCourseName = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(lab|laboratorio|teoria|theory)\b/g, '')
    .replace(/[^a-z]/g, '')
    .trim()
}