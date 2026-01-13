<script setup lang="ts">
import { ref } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { uploadXmlFile } from '@/service/xmlUploadService'

const selectedFile = ref<File | null>(null)
const error = ref<string>('')
const success = ref<string>('')
const loading = ref<boolean>(false)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const handleFileChange = (event: Event) => {
  error.value = ''
  success.value = ''

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  validateAndSetFile(file)
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  validateAndSetFile(file)
}

const validateAndSetFile = (file?: File) => {
  if (!file) return

  if (!file.name.endsWith('.xml')) {
    error.value = 'Only XML files are allowed.'
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    error.value = 'File size must be less than 10MB.'
    return
  }

  selectedFile.value = file
}

const uploadFile = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file first.'
    return
  }

  try {
    loading.value = true
    await uploadXmlFile(selectedFile.value)
    success.value = 'XML file uploaded successfully.'
    selectedFile.value = null
  } catch (err: any) {
    error.value = err?.message || 'Upload failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
    <div
      class="rounded-sm border border-stroke bg-white px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5"
    >
      <h4 class="mb-6 text-xl font-semibold text-black dark:text-white">
        XML Upload
      </h4>

      <div
        class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-400 px-6 py-10"
        @dragover.prevent
        @drop="handleDrop"
      >
        <div class="text-center">
          <div class="mt-4 flex text-sm text-gray-400 justify-center">
            <label
              for="file-upload"
              class="relative cursor-pointer rounded-md font-semibold text-indigo-500 hover:text-indigo-400"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                type="file"
                accept=".xml"
                class="sr-only"
                @change="handleFileChange"
              />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>

          <p class="text-xs text-gray-400 mt-1">XML up to 10MB</p>

          <p v-if="selectedFile" class="mt-2 text-sm text-green-500">
            Selected: {{ selectedFile.name }}
          </p>

          <p v-if="error" class="mt-2 text-sm text-red-500">
            {{ error }}
          </p>

          <p v-if="success" class="mt-2 text-sm text-green-600">
            {{ success }}
          </p>

          <button
            class="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
            :disabled="loading"
            @click="uploadFile"
          >
            {{ loading ? 'Uploading...' : 'Upload XML' }}
          </button>
        </div>
      </div>
    </div>
</template>
