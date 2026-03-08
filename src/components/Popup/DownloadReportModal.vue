<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{
    coyOptions: string[]
    show: boolean
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'download', payload: any): void
    (e: 'cancel'): void
}>()

const downloadType = ref<'OVERALL' | 'COY'>('OVERALL')
const selectedCoy = ref<string>('')

const errorMsg = ref('')
const header = ref('')
const signs = ref({
    sign1: '',
    sign2: '',
    sign3: '',
    sign4: '',
    sign5: ''
})

//const coyOptions = ['COY A', 'COY B', 'COY C', 'COY E']

const isCoySelected = computed(() => downloadType.value === 'COY')

const downloadNow = (type: 'excel' | 'pdf') => {
    // Validation
    if (downloadType.value === 'COY' && !selectedCoy.value) {
        errorMsg.value = '⚠ Please select COY / Batch'
        return
    }
    errorMsg.value = ''
    emit('download', {
        type: type,
        batch: selectedCoy.value?.trim() ? selectedCoy.value : 'ALL',
        header: header.value,
        ...signs.value
    })

    resetForm();
}

const resetForm = () => {
    downloadType.value = 'OVERALL'
    selectedCoy.value = ''
    header.value = ''
    signs.value = {
        sign1: '',
        sign2: '',
        sign3: '',
        sign4: '',
        sign5: ''
    }
    errorMsg.value = ''
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
        <div class="bg-gray-100 w-full max-w-3xl rounded-lg shadow-xl border
           max-h-[90vh] overflow-y-auto p-8">
            <!-- Title -->
            <h2 class="text-2xl font-semibold text-center mb-6">
                Select Download Types ?
            </h2>

            <!-- Download Type -->
            <div class="space-y-3 mb-6">
                <label class="flex items-center gap-3">
                    <input type="radio" value="OVERALL" v-model="downloadType" class="w-5 h-5" />
                    Download Overall Result
                </label>

                <label class="flex items-center gap-3">
                    <input type="radio" value="COY" v-model="downloadType" class="w-5 h-5" />
                    Download CoY/Batch Wise Result
                </label>

            </div>

            <!-- Coy Selection -->
            <div v-if="isCoySelected" class="mb-6 ml-8">


                <select v-model="selectedCoy" class=" border rounded px-3 py-2 bg-white">
                    <option value="" disabled>Select COY/Batch Name</option>
                    <option v-for="coy in coyOptions" :key="coy" :value="coy">
                        {{ coy }}
                    </option>
                </select>
                <p v-if="errorMsg" class="text-red-600 text-sm mt-2">
                    {{ errorMsg }}
                </p>
            </div>



            <!-- Header -->
            <div class="mb-6">
                <label class="block font-semibold mb-2">
                    Enter Header
                </label>
                <input v-model="header" class="w-full border rounded px-3 py-2" />
            </div>

            <!-- Signs -->
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div>
                    <label class="font-semibold">Sign 1</label>
                    <input v-model="signs.sign1" class="w-full border rounded px-2 py-1" />
                </div>
                <div>
                    <label class="font-semibold">Sign 2</label>
                    <input v-model="signs.sign2" class="w-full border rounded px-2 py-1" />
                </div>
                <div>
                    <label class="font-semibold">Sign 3</label>
                    <input v-model="signs.sign3" class="w-full border rounded px-2 py-1" />
                </div>
                <div>
                    <label class="font-semibold">Sign 4</label>
                    <input v-model="signs.sign4" class="w-full border rounded px-2 py-1" />
                </div>
                <div>
                    <label class="font-semibold">Sign 5</label>
                    <input v-model="signs.sign5" class="w-full border rounded px-2 py-1" />
                </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-center gap-4">
                <button class="px-6 py-2 border rounded" @click="$emit('cancel')">
                    Cancel
                </button>

                <button class="px-8 py-2 bg-blue-700 text-white rounded" @click="downloadNow('excel')">
                    Download Excel
                </button>

                <button class="px-8 py-2 bg-green-700 text-white rounded" @click="downloadNow('pdf')">
                    Download PDF
                </button>
            </div>

        </div>
    </div>
</template>