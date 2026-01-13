import axiosInstance from "@/plugins/axios"


const API_URL = '/api/xml/upload'

export const uploadXmlFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
