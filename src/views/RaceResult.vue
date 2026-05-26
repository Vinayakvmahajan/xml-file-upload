<script setup lang="ts">
import { ref, computed } from 'vue'
import AlertError from '@/components/Alerts/AlertError.vue'
import AlertSuccess from '@/components/Alerts/AlertSuccess.vue'
import {
  fetchRaceResult,
  downloadRaceReport,
  columnKeyMap
} from '@/service/raceResultService'
import DownloadReportModal from '@/components/Popup/DownloadReportModal.vue'

/* ===================== STATE ===================== */
const selectedDate = ref('')
const loading = ref(false)
const downloadLoading = ref(false)

const errorAlertMessage = ref('')
const successAlertMessage = ref('')

const summaryData = ref<any>()
const detailData = ref<any[]>([])

const showConfirmModal = ref(false)
const popUpMsg = ref('')
const sortBy = ref('')

/* ===================== COLUMNS ===================== */
const availableColumns = [
  'Army No',
  'Rank',
  'Name',
  'Age',
  'Gender',
  'Soldier Type',
  'Coy/Batch Name',
  'Unit Name',
  'RFID Chest No',
  'Race Type',
  'Start Time',
  'End Time',
  'Run Time',
  'Status',
  'Remark'
]

const selectedColumns = ref<string[]>([
  'Army No',
  'Rank',
  'Name',
  'Age',
  'Gender',
  'Coy/Batch Name',
  'Run Time',
  'RFID Chest No',
  'Remark'
])

/* ===================== FETCH DATA ===================== */
const formattedDate = computed(() => {
  if (!selectedDate.value) return ''

  const [year, month, day] = selectedDate.value.split('-')
  return `${day}/${month}/${year}`
})

const loadRaceResult = async () => {
  detailData.value = []
  summaryData.value = undefined;
  if (!selectedDate.value) {
    errorAlertMessage.value = 'Please select date'
    return
  }

  try {
    loading.value = true
    errorAlertMessage.value = ''

    const response = await fetchRaceResult(formattedDate.value,sortBy.value)

    detailData.value = response || []
    summaryData.value = response[0].raceResultSummaryDto || []


    successAlertMessage.value = 'Race data loaded successfully'
    setTimeout(() => {
      successAlertMessage.value = ''
    }, 10000)

  } catch (err: any) {
    errorAlertMessage.value =
      err.message || 'Failed to fetch race result'
  } finally {
    loading.value = false
  }
}

const filteredDetailData = computed(() => {
  return detailData.value.map(row => {
    const filteredRow: Record<string, any> = {}

    availableColumns.forEach(label => {
      if (selectedColumns.value.includes(label)) {
        const key = columnKeyMap[label]

        if (key && row[key] !== undefined) {
          filteredRow[label] = row[key]
        }
      }
    })

    return filteredRow
  })
})

const orderedSelectedColumns = computed(() => {
  return availableColumns.filter(col =>
    selectedColumns.value.includes(col)
  )
})


const openDownloadConfirm = () => {
  showConfirmModal.value = true
}

const uniqueBatchNames = computed(() => {
  return [
    ...new Set(
      detailData.value
        .map(item => item.coyBatchName)
        .filter(Boolean)
    )
  ].sort()
})

const baseUrl = import.meta.env.VITE_API_BASE_URL
const confirmDownload = async (payload: any) => {
  showConfirmModal.value = false
  downloadLoading.value = true 
  successAlertMessage.value = ''

  try {
    const type = payload.type
    delete payload.type
    payload.columns =  orderedSelectedColumns.value

    const queryParams = new URLSearchParams({
      date: formattedDate.value,
      type
    })

    if (sortBy.value !== '') {
      queryParams.append('sortBy', sortBy.value)
    }

    const res = await fetch(
      `${baseUrl}/api/raceresult/export?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )

    if (!res.ok) {
      const errorText = await res.json();
      const errorMessage = errorText.error || 'Failed to download report';
      throw new Error(
        errorMessage
      )
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    const disposition = res.headers.get('content-disposition')
    let filename = `race-results-${formattedDate.value}.${type === 'excel' ? 'xlsx' : 'pdf'}`

     if (disposition && disposition.includes('filename=')) {
      filename = disposition
        .split('filename=')[1]
        .replace(/"/g, '')
    }

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()

    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    successAlertMessage.value = 'Report downloaded successfully'

  } catch (err) {
    console.error(err)
    errorAlertMessage.value = err instanceof Error ? err.message : 'Failed to download report'
  } finally {
    downloadLoading.value = false
  }
}

const hasData = computed(() => {
  return summaryData.value || detailData.value.length
})
</script>

<template>
  <div class="p-6 bg-white border rounded shadow">
    <h4 class="text-xl font-semibold mb-4">
      Race Result Screen
    </h4>

    <AlertError :show="errorAlertMessage !== ''" :message="errorAlertMessage" />
    <AlertSuccess :show="successAlertMessage !== ''" :message="successAlertMessage" />

    <!-- FILTER -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 border rounded">
      <div>
        <label class="block text-sm font-medium mb-1">
          Select Date
        </label>
        <input type="date" v-model="selectedDate" class="w-full border rounded px-3 py-2" />
      </div>

      


      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-2">
          Select Columns
        </label>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <label v-for="col in availableColumns.filter(c => c !== 'RFID Chest No' && c !== 'Run Time' && c !== 'Remark')" :key="col"
            class="flex items-center gap-1 text-sm">
            <input type="checkbox" :value="col" v-model="selectedColumns" />
            {{ col }}
          </label>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium mb-2">
          Sort By
        </label>

        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input
              type="radio"
              v-model="sortBy"
              value="totalRunTime"
            />
            Total Run Time
          </label>

          <label class="flex items-center gap-2">
            <input
              type="radio"
              v-model="sortBy"
              value="chestNumber"
            />
            RFID/Chest No
          </label>
        </div>
      </div>
    </div>

    <button class="bg-indigo-600 text-white px-4 py-2 rounded mb-6" :disabled="loading" @click="loadRaceResult">
      {{ loading ? 'Loading...' : 'Fetch Result' }}
    </button>

    <!-- REPORT -->
    <div v-if="hasData" class="flex flex-col gap-8">
      <!-- SUMMARY -->
      <div>
        <h5 class="font-semibold mb-2">
          Summary Report
        </h5>

        <table class="min-w-full border text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-2 py-1 bg-gray-200"> Status </th>
              <th class="border px-2 py-1 bg-yellow-100"> Super Excellent </th>
              <th class="border px-2 py-1 bg-yellow-100"> Excellent </th>
              <th class="border px-2 py-1 bg-yellow-100"> Good </th>
              <th class="border px-2 py-1 bg-yellow-100"> Satisfactory </th>
              <th class="border px-2 py-1 bg-yellow-100"> Fail </th>
              <th class="border px-2 py-1 bg-yellow-100"> Total </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border px-2 py-1 bg-gray-200 font-semibold align-middle text-center">
                Count
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.superExcellent }}
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.excellent }}
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.good }}
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.satisfactory }}
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.fail }}
              </td>
              <td class="border px-2 py-1">
                {{ summaryData.total }}
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- DETAIL -->
      <div>
        <h5 class="font-semibold mb-2">
          Detailed Report
        </h5>

        <div class="overflow-auto max-h-[500px]">
          <table class="min-w-full border text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th v-for="(val, key) in filteredDetailData[0]" :key="key" class="border px-2 py-1">
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in filteredDetailData" :key="i">
                <td v-for="(val, key) in row" :key="key" class="border px-2 py-1">
                  {{ val }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- DOWNLOAD -->
    <div v-if="hasData" class="mt-6 flex gap-4 justify-end">
      <button class="bg-green-600 text-white px-4 py-2 rounded" @click="openDownloadConfirm">
        <span v-if="downloadLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
           {{ downloadLoading ? 'Downloading...' : 'Download Report' }}
      </button>
    </div>
  </div>

  <DownloadReportModal :show="showConfirmModal" :coyOptions="uniqueBatchNames" @cancel="showConfirmModal = false"
    @download="confirmDownload" />
</template>
