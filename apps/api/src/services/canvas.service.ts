import axios from 'axios'

export const createCanvasClient = (domain: string, token: string) => {
  return axios.create({
    baseURL: `https://${domain}/api/v1`,
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const fetchCourses = async (domain: string, token: string) => {
  const client = createCanvasClient(domain, token)
  const { data } = await client.get('/courses?enrollment_state=active&per_page=50')
  return data
}


export const fetchAssignments = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  const { data } = await client.get(`/courses/${courseId}/assignments`, {
    params: {
      per_page: 50,
      'include[]': 'submission'
    }
  })
  return data
}

export const fetchModules = async (domain: string, token: string, courseId: number) => {
  const client = createCanvasClient(domain, token)
  const { data } = await client.get(`/courses/${courseId}/modules?include[]=items&per_page=50`)
  return data
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

