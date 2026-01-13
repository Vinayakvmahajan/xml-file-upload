<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'

const selectedFile = ref<File | null>(null)
const error = ref('')
const success = ref('')
const loading = ref(false)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Preview states
const showPreview = ref(false)
const previewColumns = ref<string[]>([])
const expectedColumns = ref<string[]>(['Army No', 'Rank', 'Name', 'Date of Birth', 'Gender', 'RFID Chest No', 'COY / Batch Name', 'Unit Name', 'Soldier Type'])
const previewRows = ref<any[]>([])
const columnMapping = ref<Record<string, string>>({})

// ---------------- FILE HANDLING ----------------
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  validateAndSetFile(target.files?.[0])
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  validateAndSetFile(event.dataTransfer?.files[0])
}

const validateAndSetFile = (file?: File) => {
  error.value = ''
  success.value = ''

  if (!file) return

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(extension || '')) {
    error.value = 'Only Excel files (.xlsx, .xls) are allowed.'
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    error.value = 'File size must be less than 10MB.'
    return
  }

  selectedFile.value = file
}

// ---------------- EXCEL PARSING ----------------
const uploadFile = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file first.'
    return
  }

  loading.value = true
  try {
    const data = await selectedFile.value.arrayBuffer()
    parseExcel(data)
    showPreview.value = true
    success.value = 'Excel parsed successfully. Preview below.'
  } catch (e) {
    error.value = 'Failed to parse Excel file.'
  } finally {
    loading.value = false
  }
}

const parseExcel = (buffer: ArrayBuffer) => {
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Take first sheet
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' })

  if (!jsonData.length) {
    throw new Error('No data found in Excel')
  }

  previewColumns.value = Object.keys(jsonData[0])

  // Default column mapping
  previewColumns.value.forEach(col => {
    columnMapping.value[col] = col
  })

  previewRows.value = jsonData
}
const addRow = () => {
  const newRow: any = {}
  previewColumns.value.forEach(col => {
    newRow[col] = ''
  })
  previewRows.value.push(newRow)
}

const deleteRow = (index: number) => {
  previewRows.value.splice(index, 1)
}

// ---------------- FINAL SUBMIT ----------------
const finalUpload = () => {
  const finalPayload = previewRows.value.map(row => {
    const mapped: any = {}
    Object.keys(columnMapping.value).forEach(src => {
      mapped[columnMapping.value[src]] = row[src]
    })
    return mapped
  })

  console.log('FINAL PAYLOAD:', finalPayload)
  alert('Final upload done. Check console.')
}
</script>

<template>
  <div class="rounded-sm border bg-white p-6 shadow">
    <h4 class="text-xl font-semibold mb-6">Upload Registration screen</h4>

    <!-- Upload Box -->
    <div class="flex justify-center rounded-lg border border-dashed px-6 py-10" @dragover.prevent @drop="handleDrop">
      <div class="text-center">
        <label class="cursor-pointer text-indigo-600 font-semibold">
          Upload Excel File
          <input type="file" accept=".xlsx,.xls" class="sr-only" @change="handleFileChange" />
          <p class="text-sm text-gray-400">or drag and drop</p>
        </label>

        
        <p class="text-sm text-gray-400">Mandatory Column Names before uploading the Excel file:</p>
        <p class="text-sm text-gray-400">Army No | Rank | Name | Date of Birth | Gender | RFID Chest No | COY / Batch Name | Unit Name | Soldier Type</p>

        <p v-if="selectedFile" class="mt-2 text-green-600">
          {{ selectedFile.name }}
        </p>

        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
        <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>

        <button class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded" :disabled="loading" @click="uploadFile">
          {{ loading ? 'Processing...' : 'Upload Excel' }}
        </button>
      </div>
    </div>

    <!-- PREVIEW TABLE -->
    <!-- PREVIEW TABLE WITH HEADER MAPPING -->
    <div v-if="showPreview" class="mt-6 overflow-auto">
      <table class="min-w-full border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th v-for="col in previewColumns" :key="col" class="border px-3 py-2">
              <div class="flex flex-col gap-1">
                <span class="font-semibold">{{ col }}</span>
                <select v-model="columnMapping[col]" class="border rounded px-1 py-0.5 text-xs">
                  <option value="">-- Map To --</option>
                  <option v-for="exp in expectedColumns" :key="exp" :value="exp">
                    {{ exp }}
                  </option>
                </select>
              </div>
            </th>

            <!-- ACTION COLUMN -->
            <th class="border px-3 py-2 text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, i) in previewRows" :key="i">
            <td v-for="col in previewColumns" :key="col" class="border px-2 py-1">
              <input v-model="previewRows[i][col]" class="w-full border rounded px-1" />
            </td>

            <!-- DELETE ROW -->
            <td class="border px-2 py-1 text-center">
              <button class="text-red-600 hover:text-red-800" @click="deleteRow(i)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ADD ROW BUTTON -->
      <div class="mt-4">
        <button class="bg-blue-600 text-white px-3 py-1 rounded" @click="addRow">
          + Add Row
        </button>
      </div>
    </div>


    <!-- FINAL UPLOAD -->
    <div v-if="showPreview" class="mt-6">
      <button class="bg-green-600 text-white px-4 py-2 rounded" @click="finalUpload">
        Confirm & Final Upload
      </button>
    </div>
  </div>
</template>
