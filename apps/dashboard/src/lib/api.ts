import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15_000,
})

api.interceptors.response.use(
  (r) => r.data,
  (err) => Promise.reject(err.response?.data ?? err)
)
