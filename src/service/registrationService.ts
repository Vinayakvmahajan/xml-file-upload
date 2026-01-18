import axiosInstance from '@/plugins/axios'

export const saveRegistrationBulk = (payload: any[]) => {
  return axiosInstance.post('/api/registration/bulk/upload', payload)
}