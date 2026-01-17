<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  message: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-2">
        {{ title || 'Confirmation' }}
      </h3>

      <p class="text-sm text-gray-600 mb-6">
        {{ message }}
      </p>

      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          Cancel
        </button>

        <button
          class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          @click="$emit('confirm')"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>
