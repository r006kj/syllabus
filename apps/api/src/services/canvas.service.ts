import axios from 'axios'
import { fetchAllPages } from '../utils/canvasPaginate'

export const createCanvasClient = (domain: string, token: string) => {
  return axios.create({
    baseURL: `https://${domain}/api/v1`,
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const fetchCourses = async (domain: string, token: string) => {
  const client = createCanvasClient(domain, token)
  return fetchAllPages(client, '/courses?enrollment_state=active&include[]=term&per_page=100')
}

export const fetchAssignments = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  return fetchAllPages(
    client,
    `/courses/${courseId}/assignments?per_page=100&include[]=submission`
  )
}

export const fetchModules = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  try {
    return await fetchAllPages(client, `/courses/${courseId}/modules?include[]=items&per_page=100`)
  } catch (err: any) {
    if (err?.response?.status !== 403) throw err
    // Some Canvas instances (e.g. UTEC) forbid include[]=items — retry without items
    return fetchAllPages(client, `/courses/${courseId}/modules?per_page=100`)
  }
}

export const fetchSyllabus = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  const { data } = await client.get(`/courses/${courseId}?include[]=syllabus_body`)
  return data
}

export const fetchCourseDetails = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  const { data } = await client.get(`/courses/${courseId}?include[]=term`)
  return data
}
