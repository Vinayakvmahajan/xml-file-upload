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

const errorAlertMessage = ref('')
const successAlertMessage = ref('')

const summaryData = ref<any>()
const detailData = ref<any[]>([])

const showConfirmModal = ref(false)
const popUpMsg = ref('')

/* ===================== COLUMNS ===================== */
const availableColumns = [
  'Army No',
  'Rank',
  'Name',
  'Age',
  'RFID Chest No',
  'Gender',
  'Coy/Batch Name',
  'Unit Name',
  'Soldier Type',
  'Start Time',
  'End Time',
  'Total Run Time',
  'Status',
  'Race Type'
]

const selectedColumns = ref<string[]>([
  'Army No',
  'Rank',
  'Name',
  'Age',
  'Gender',
  'Coy/Batch Name',
  'Total Run Time',
  'RFID Chest No'

])

/* ===================== FETCH DATA ===================== */
const formattedDate = computed(() => {
  if (!selectedDate.value) return ''

  const [year, month, day] = selectedDate.value.split('-')
  return `${day}/${month}/${year}`
})

const loadRaceResult = async () => {
  if (!selectedDate.value) {
    errorAlertMessage.value = 'Please select date'
    return
  }

  try {
    loading.value = true
    errorAlertMessage.value = ''

    const response = await fetchRaceResult(formattedDate.value)

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

    selectedColumns.value.forEach(label => {
      const key = columnKeyMap[label]
      if (key && row[key] !== undefined) {
        filteredRow[label] = row[key]
      }
    })

    return filteredRow
  })
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

const confirmDownload = async (payload: any) => {
  showConfirmModal.value = false
  try {
    loading.value = true
    const type = payload.type
    delete payload.type // remove type from payload as it's sent as query param
    await downloadRaceReport(payload, formattedDate.value, type)

    successAlertMessage.value = 'Report generated successfully'
  } catch (err: any) {
    errorAlertMessage.value =
      err.message || 'Download failed'
  } finally {
    loading.value = false
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
          <label v-for="col in availableColumns.filter(c => c !== 'RFID Chest No' && c !== 'Total Run Time')" :key="col"
            class="flex items-center gap-1 text-sm">
            <input type="checkbox" :value="col" v-model="selectedColumns" />
            {{ col }}
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
        Download Report
      </button>
    </div>
  </div>

  <DownloadReportModal :show="showConfirmModal" :coyOptions="uniqueBatchNames" @cancel="showConfirmModal = false"
    @download="confirmDownload" />
</template>
