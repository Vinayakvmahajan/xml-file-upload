import axiosInstance from '@/plugins/axios'

export const saveRegistrationBulk = (payload: any[]): any => {
  return axiosInstance.post('/api/registration/bulk/upload', payload)
}

export const fetchRaceResult = (date: string): any => {
  console.log('date in service', date);
  return axiosInstance.get('api/raceresult/details', {
    params: {
      date: date
    }
  })

}

export const downloadRaceReport = (
  payload: any,
  selectedDate: string,
  type: 'excel' | 'pdf'
) => {
  return axiosInstance.post(
    '/api/raceresult/export',
    payload,
    {
      params: { date: selectedDate, type },
      responseType: 'blob'
    }
  )
}

export const columnKeyMap: Record<string, string> = {
  'Army No': 'armyNumber',
  'Rank': 'rank',
  'Name': 'name',
  'Age': 'age',
  'RFID Chest No': 'chestNumber',
  'Gender': 'gender',
  'Coy/Batch Name': 'coyBatchName',
  'Unit Name': 'unitName',
  'Soldier Type': 'soldierType',
  'Start Time': 'startTime',
  'End Time': 'endTime',
  'Run Time': 'totalRunTime',
  'Status': 'status',
  'Race Type': 'raceType'
}