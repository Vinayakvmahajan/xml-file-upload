import axiosInstance from '@/plugins/axios'

export const saveRegistrationBulk = (payload: any[]):any => {
  return axiosInstance.post('/api/registration/bulk/upload', payload)
}

export const fetchRaceResult = (payload:any):any =>{
    return axiosInstance.post('/api/race/result', payload)
}

export const downloadRaceReport = (payload:any):any =>{
    return axiosInstance.post('/race/result/download', payload)
}
