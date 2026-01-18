<script setup lang="ts">
import { saveRegistrationBulk } from '@/service/registrationService'
import ConfirmModel from '@/components/Popup/ConfirmModel.vue'
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import AlertError from '@/components/Alerts/AlertError.vue'
import { normalizeToMaxColumns, removeDecorativeMergedRows, removeFirstAndEmptyColumns, removeTrailingEmptyRows } from '@/utils/excelUtil'

/* ===================== CONSTANTS ===================== */
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const expectedColumns = [
  'Army No',
  'Rank',
  'Name',
  'Date of Birth',
  'Gender',
  'RFID Chest No',
  'COY / Batch Name',
  'Unit Name',
  'Soldier Type'
]

/* ===================== STATE ===================== */
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const showPreview = ref(false)
const previewColumns = ref<string[]>([])
const previewRows = ref<any[]>([])
const columnMapping = ref<Record<string, string>>({})

const showConfirmModal = ref(false)
const errorAlertMessage = ref('')

const bulkBatchName = ref('')
const bulkUnitName = ref('')
const bulkSoldierType = ref('')


/* Cell-level errors: "rowIndex-columnName" -> message */
const cellErrors = ref<Record<string, string>>({})

/* ===================== FILE HANDLING ===================== */
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  validateAndSetFile(file)
}

const handleDrop = (e: DragEvent) => {
  reset();
  e.preventDefault()
  validateAndSetFile(e.dataTransfer?.files[0])
}

const validateAndSetFile = (file?: File) => {
  error.value = ''
  success.value = ''
  showPreview.value = false

  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(ext || '')) {
    error.value = 'Only Excel files (.xlsx, .xls) are allowed.'
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    error.value = 'File size must be less than 10MB.'
    return
  }

  selectedFile.value = file
}

/* ===================== EXCEL PARSING ===================== */
const uploadFile = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file first.'
    return
  }

  const file = selectedFile.value
  reset()
  selectedFile.value = file

  loading.value = true
  try {
    const buffer = await selectedFile.value.arrayBuffer()
    parseExcel(buffer)
    showPreview.value = true
    success.value = 'Excel parsed successfully. Please review data.'
  } catch {
    error.value = 'Failed to parse Excel file.'
  } finally {
    loading.value = false
  }
}



const parseExcel = (buffer: ArrayBuffer) => {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]

  let sheet = workbook.Sheets[sheetName]

  // Remove merged rows only
  sheet = removeDecorativeMergedRows(sheet)

  let json = XLSX.utils.sheet_to_json<any>(sheet, {
    defval: '',
    blankrows: false,
    raw: false
  })

  if (!json.length) {
    errorAlertMessage.value = 'No usable data after removing merged title rows'
    return
  }

  // Remove first row and empty columns
  json = removeFirstAndEmptyColumns(json)

  // Remove trailing empty rows
  json = removeTrailingEmptyRows(json)

  json = normalizeToMaxColumns(json, 10)


  if (!json.length || !Object.keys(json[0]).length) {
    errorAlertMessage.value = 'No usable columns after cleaning'
    return
  }

  previewColumns.value = Object.keys(json[0])
  previewRows.value = json

  columnMapping.value = {}
  previewColumns.value.forEach(col => {
    columnMapping.value[col] = col
  })
}



/* ===================== DOB HANDLING ===================== */
const parseDOB = (value: string): string | null => {
  if (!value) return null

  const cleaned = value.replace(/[._-]/g, '/')
  const parts = cleaned.split('/')

  if (parts.length !== 3) return null

  let [dd, mm, yy] = parts.map(Number)
  if (!dd || !mm || !yy) return null

  if (yy < 100) yy += 2000

  const date = new Date(yy, mm - 1, dd)
  if (
    date.getFullYear() !== yy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) return null

  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

const validateColumnMapping = () => {
  errorAlertMessage.value = ''

  const mappedTargets = Object.values(columnMapping.value).filter(v => v)

  /* Check mandatory mappings */
  const missing = expectedColumns.filter(
    col => !mappedTargets.includes(col)
  )

  if (missing.length) {
    errorAlertMessage.value = `Missing column mapping for: ${missing.join(', ')}`
    return false
  }

  /* Check duplicate mapping */
  const duplicates = mappedTargets.filter(
    (v, i, arr) => arr.indexOf(v) !== i
  )

  if (duplicates.length) {
    errorAlertMessage.value = `Duplicate column mapping detected: ${[...new Set(duplicates)].join(', ')}`
    return false
  }

  return true
}


/* ===================== VALIDATION ===================== */
const validateAll = () => {
  cellErrors.value = {}
  const armySet = new Set<string>()
  const rfidSet = new Set<string>()

  previewRows.value.forEach((row, r) => {
    Object.entries(columnMapping.value).forEach(([src, target]) => {
      const val = String(row[src] ?? '').trim()
      const key = `${r}-${src}`

      /* Mandatory */
      if (
        ['Army No', 'Rank', 'Name', 'Date of Birth', 'Gender', 'RFID Chest No']
          .includes(target) && !val
      ) {
        cellErrors.value[key] = 'Mandatory field'
        return
      }

      if (target === 'Name' || target === 'Rank') {
        if (!/^[A-Za-z\s]+$/.test(val)) {
          cellErrors.value[key] = 'Text only (letters and spaces)'
        }
      }

      /* Army No */
      if (target === 'Army No') {
        if (!/^[a-z0-9]+$/i.test(val))
          cellErrors.value[key] = 'Alphanumeric only'
        if (armySet.has(val))
          cellErrors.value[key] = 'Duplicate Army No'
        armySet.add(val)
      }

      /* RFID */
      if (target === 'RFID Chest No') {
        if (!/^\d+$/.test(val))
          cellErrors.value[key] = 'Numeric only'
        if (rfidSet.has(val))
          cellErrors.value[key] = 'Duplicate RFID'
        rfidSet.add(val)
      }

      /* Gender */
      if (target === 'Gender' && !['Male', 'Female'].includes(val))
        cellErrors.value[key] = 'Male / Female only'

      if(bulkBatchName.value || target === 'COY / Batch Name'){
        if (target === 'COY / Batch Name' && bulkBatchName.value === '' && val === '') {
          cellErrors.value[key] = 'Mandatory field'
          errorAlertMessage.value = 'Please provide Bulk COY / Batch Name or fill individual rows.'
        }
      }

      if(bulkUnitName.value || target === 'Unit Name'){
        if (target === 'Unit Name' && bulkUnitName.value === '' && val === '') {
          cellErrors.value[key] = 'Mandatory field'
          errorAlertMessage.value = 'Please provide Bulk Unit Name or fill individual rows.'
        }
      }

       if(bulkUnitName.value || target === 'Unit Name'){
        if (target === 'Unit Name' && bulkUnitName.value === '' && val === '') {
          cellErrors.value[key] = 'Mandatory field'
          errorAlertMessage.value = 'Please provide Bulk Unit Name or fill individual rows.'
        }
      }

    })
  })
}

const getCellError = (rowIndex: number, col: string) => {
  return cellErrors.value[`${rowIndex}-${col}`] || ''
}


const hasErrors = computed(() => Object.keys(cellErrors.value).length > 0)

/* ===================== ROW ACTIONS ===================== */
const addRow = () => {
  const row: any = {}
  previewColumns.value.forEach(c => (row[c] = ''))
  previewRows.value.push(row)
}

const deleteRow = (i: number) => {
  previewRows.value.splice(i, 1)
}

/* ===================== FINAL SUBMIT ===================== */
const finalUpload = async () => {
  errorAlertMessage.value = ''
  if (!validateColumnMapping()) {
    return
  }

  validateAll()

  if (hasErrors.value) {
    errorAlertMessage.value = 'Please fix highlighted errors before submitting.'
    return
  }

  showConfirmModal.value = true
}

const submitToServer = async () => {
  try {
    loading.value = true
    errorAlertMessage.value = ''
    const payload = previewRows.value.map(row => {
      const obj: any = {}
      Object.entries(columnMapping.value).forEach(([src, tgt]) => {
        obj[tgt] = row[src]
      })
      return obj
    })
    const requestPayload = payload.map(row => ({
      name: String(row['Name'] ?? '').trim(),
      dob: String(row['Date of Birth'] ?? ''),
      gender: String(row['Gender'] ?? '').trim(),
      rank: String(row['Rank'] ?? null),
      armyNumber: String(row['Army No'] ?? '').trim(),
      unit: String(row['Unit Name']) || String(bulkUnitName.value).trim(),
      company: String(row['COY / Batch Name']) || String(bulkBatchName.value.trim()),
      soldierType: String(row['Soldier Type']).trim() || String(bulkBatchName.value.trim()),
      chestNumber: String(row['RFID Chest No'] ?? '').trim()
    }))

    console.log('Payload to submit:', requestPayload)

    const response = await saveRegistrationBulk(requestPayload)

    if (response) {
      reset();
    } else {
      errorAlertMessage.value = 'Error while registration Please try again !';
    }
  } catch {
    errorAlertMessage.value = 'Error while registration Please try again !';
  } finally {
    loading.value = false
    showConfirmModal.value = false
  }
}

const reset = () => {
  previewRows.value = []
  previewColumns.value = []
  columnMapping.value = {}
  cellErrors.value = {}
  errorAlertMessage.value = ''
  success.value = ''
  showPreview.value = false
  error.value = ''
}

</script>

<template>
  <div class="p-6 bg-white border rounded shadow">
    <h4 class="text-xl font-semibold mb-4">Upload Registration Screen</h4>

    <!-- Upload -->
    <div class="border border-dashed rounded p-6 text-center" @dragover.prevent @drop="handleDrop">
      <label class="cursor-pointer text-indigo-600 font-semibold">
        Select Excel File
        <input type="file" class="sr-only" accept=".xls,.xlsx"  @click="reset" @change="handleFileChange" />
      </label>

      <p class="text-sm text-gray-500 mt-2">
        Mandatory Columns:
        Army No | Rank | Name | Date of Birth | Gender | RFID Chest No |
        COY / Batch Name | Unit Name | Soldier Type
      </p>

      <p v-if="selectedFile" class="text-green-600 mt-2">
        {{ selectedFile.name }}
      </p>

      <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
      <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>

      <button class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded" :disabled="loading" @click="uploadFile">
        {{ loading ? 'Processing...' : 'Upload Excel' }}
      </button>
    </div>

    <AlertError :show="errorAlertMessage !== ''" :message="errorAlertMessage" />



    <!-- PREVIEW -->
    <div v-if="showPreview" class="mt-6 overflow-auto">
      <!-- BULK MAPPING INPUTS -->
      <div class="max-w-4xl mx-auto p-4 mb-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Bulk COY / Batch Name</label>
          <input v-model="bulkBatchName" type="text" placeholder="Enter Batch Name (applies to all rows)"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Bulk Unit Name</label>
          <input v-model="bulkUnitName" type="text" placeholder="Enter Unit Name (applies to all rows)"
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Soldier Type</label>
          <select v-model="bulkSoldierType"
            class="w-full px-3 py-2 border rounded bg-white focus:ring-2 focus:ring-indigo-500">
            <option value="" disabled>Select Soldier Type</option>
            <option value="AGNIVEER">Agniveer</option>
            <option value="TRAINED">Trained Soldier</option>
          </select>
        </div>
      </div>


      <table class="min-w-full border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th>Serial No.</th>
            <th v-for="col in previewColumns" :key="col" class="border px-2 py-1">
              <div class="flex flex-col">
                <!-- <span class="font-semibold">{{ col }}</span> -->
                <select v-model="columnMapping[col]" class="border rounded text-xs">
                  <option value="">-- Map To --</option>
                  <option v-for="exp in expectedColumns" :key="exp" :value="exp">
                    {{ exp }}
                  </option>
                </select>
              </div>
            </th>
            <th class="border px-2 py-1">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, i) in previewRows" :key="i">
            <td class="border px-1 text-center">{{ i + 1 }}</td>
            <td v-for="col in previewColumns" :key="col" class="border px-1">
              <div class="flex flex-col">
                <input v-model="previewRows[i][col]" class="w-full border rounded px-1"
                  :class="{ 'border-red-500 bg-red-50': getCellError(i, col) }" @blur="validateAll" />

                <span v-if="getCellError(i, col)" class="text-xs text-red-600 mt-0.5">
                  {{ getCellError(i, col) }}
                </span>
              </div>

            </td>
            <td class="border text-center">
              <button class="text-red-600" @click="deleteRow(i)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <button class="mt-3 bg-blue-600 text-white px-3 py-1 rounded" @click="addRow">
        + Add Row
      </button>
    </div>

    <!-- FINAL -->
    <div v-if="showPreview" class="mt-6">
      <button class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" @click="finalUpload">
        Confirm & Final Upload
      </button>
    </div>
  </div>

  <ConfirmModel :show="showConfirmModal" title="Confirm Upload"
    message="All records are valid. Do you want to proceed with saving?" :loading="loading" @confirm="submitToServer"
    @cancel="showConfirmModal = false" />
</template>
