import axios from 'axios'
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

/* =====================
   Request Interceptor
===================== */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

/* =====================
   Response Interceptor
===================== */
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

export default axiosInstance
