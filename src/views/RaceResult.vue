<script setup lang="ts">
import { ref, computed } from 'vue'
import AlertError from '@/components/Alerts/AlertError.vue'
import AlertSuccess from '@/components/Alerts/AlertSuccess.vue'
import ConfirmModel from '@/components/Popup/ConfirmModel.vue'
import {
  fetchRaceResult,
  downloadRaceReport
} from '@/service/raceResultService'

/* ===================== STATE ===================== */
const selectedDate = ref('')
const loading = ref(false)

const errorAlertMessage = ref('')
const successAlertMessage = ref('')

const summaryData = ref<any[]>([])
const detailData = ref<any[]>([])

const showConfirmModal = ref(false)
const popUpMsg = ref('')

/* ===================== COLUMNS ===================== */
const availableColumns = [
  'Army No',
  'Name',
  'Rank',
  'Unit',
  'Coy/Batch',
  'Timing',
  'Position',
  'Category'
]

const selectedColumns = ref<string[]>([
  'Army No',
  'Name',
  'Timing',
  'Position'
])

/* ===================== FETCH DATA ===================== */
const loadRaceResult = async () => {
  if (!selectedDate.value) {
    errorAlertMessage.value = 'Please select date'
    return
  }

  try {
    loading.value = true
    errorAlertMessage.value = ''

    const response = await fetchRaceResult({
      date: selectedDate.value,
      columns: selectedColumns.value
    })

    summaryData.value = response.summary || []
    detailData.value = response.details || []

    successAlertMessage.value = 'Race data loaded successfully'
  } catch (err: any) {
    errorAlertMessage.value =
      err.message || 'Failed to fetch race result'
  } finally {
    loading.value = false
  }
}

/* ===================== DOWNLOAD ===================== */
const downloadType = ref<'OVERALL' | 'COY'>('OVERALL')

const openDownloadConfirm = () => {
  popUpMsg.value =
    downloadType.value === 'OVERALL'
      ? 'Download Overall Result?'
      : 'Download Coy/Batch Wise Result?'

  showConfirmModal.value = true
}

const confirmDownload = async () => {
  showConfirmModal.value = false
  try {
    loading.value = true

    await downloadRaceReport({
      date: selectedDate.value,
      type: downloadType.value
    })

    successAlertMessage.value = 'Report generated successfully'
  } catch (err: any) {
    errorAlertMessage.value =
      err.message || 'Download failed'
  } finally {
    loading.value = false
  }
}

const hasData = computed(() => {
  return summaryData.value.length || detailData.value.length
})
</script>

<template>
  <div class="p-6 bg-white border rounded shadow">
    <h4 class="text-xl font-semibold mb-4">
      Race Result Screen
    </h4>

    <AlertError
      :show="errorAlertMessage !== ''"
      :message="errorAlertMessage"
    />
    <AlertSuccess
      :show="successAlertMessage !== ''"
      :message="successAlertMessage"
    />

    <!-- FILTER -->
    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 border rounded"
    >
      <div>
        <label class="block text-sm font-medium mb-1">
          Select Date
        </label>
        <input
          type="date"
          v-model="selectedDate"
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium mb-1">
          Select Columns
        </label>

        <div class="flex flex-wrap gap-2">
          <label
            v-for="col in availableColumns"
            :key="col"
            class="flex items-center gap-1 text-sm"
          >
            <input
              type="checkbox"
              :value="col"
              v-model="selectedColumns"
            />
            {{ col }}
          </label>
        </div>
      </div>
    </div>

    <button
      class="bg-indigo-600 text-white px-4 py-2 rounded mb-6"
      :disabled="loading"
      @click="loadRaceResult"
    >
      {{ loading ? 'Loading...' : 'Fetch Result' }}
    </button>

    <!-- REPORT -->
    <div
      v-if="hasData"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <!-- SUMMARY -->
      <div>
        <h5 class="font-semibold mb-2">
          Summary Report
        </h5>

        <table class="min-w-full border text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th
                v-for="(val, key) in summaryData[0]"
                :key="key"
                class="border px-2 py-1"
              >
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in summaryData" :key="i">
              <td
                v-for="(val, key) in row"
                :key="key"
                class="border px-2 py-1"
              >
                {{ val }}
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
                <th
                  v-for="(val, key) in detailData[0]"
                  :key="key"
                  class="border px-2 py-1"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in detailData" :key="i">
                <td
                  v-for="(val, key) in row"
                  :key="key"
                  class="border px-2 py-1"
                >
                  {{ val }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- DOWNLOAD -->
    <div v-if="hasData" class="mt-6 flex gap-4">
      <select
        v-model="downloadType"
        class="border px-3 py-2 rounded"
      >
        <option value="OVERALL">
          Download Overall Result
        </option>
        <option value="COY">
          Download Coy/Batch Wise Result
        </option>
      </select>

      <button
        class="bg-green-600 text-white px-4 py-2 rounded"
        @click="openDownloadConfirm"
      >
        Download Report
      </button>
    </div>
  </div>

  <ConfirmModel
    :show="showConfirmModal"
    title="Confirm"
    :message="popUpMsg"
    @confirm="confirmDownload"
    @cancel="showConfirmModal = false"
  />
</template>
