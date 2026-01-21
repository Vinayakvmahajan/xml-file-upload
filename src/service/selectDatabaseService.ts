import axiosInstance from '@/plugins/axios'

export const getDatabaseConfigs = () => {
  return axiosInstance.get('/config')
}

export const saveDatabaseConfigs = (payload: any[]) => {
  return axiosInstance.post('/config/update', payload)
}