<template>
  <AlertError :show="errorAlertMessage !== ''" :message="errorAlertMessage" />
  <AlertSuccess :show="successAlertMessage !== ''" :message="successAlertMessage" />
     <p v-if="loading" class="text-sm text-gray-500">
      Loading databases...
    </p>
  <div v-if="databases.length>0" class="p-6 bg-white border rounded shadow">
    <h4 class="text-lg font-semibold mb-4">
      Select Database(s)
    </h4>

    <!-- Database List -->
    <div  class="space-y-2">
      <label
        v-for="db in databases"
        :key="db.name"
        class="flex items-center gap-2 cursor-pointer"
      >
        <input
          type="checkbox"
          :checked="isSelected(db)"
          @change="toggleSelection(db)"
          class="h-4 w-4"
        />
        <span>{{ formatDbName(db.name) }}</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="mt-4">
      <button
        class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        :disabled="saving"
        @click="saveSelection"
      >
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <p v-if="error" class="text-red-600 text-sm mt-2">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDatabaseConfigs, saveDatabaseConfigs } from '@/service/selectDatabaseService';
import AlertError from '@/components/Alerts/AlertError.vue';
import AlertSuccess from '@/components/Alerts/AlertSuccess.vue';



/* state */
const databases = ref<any>([])
const loading = ref(false)
const saving = ref(false)
const success = ref(false)
const error = ref<string | null>(null)
    
const errorAlertMessage = ref('')
const successAlertMessage = ref('')

/* lifecycle */
onMounted(() => {
  fetchDatabases()
})


/* methods */
const fetchDatabases = async () => {
  loading.value = true;
  error.value = null;

  try {
    const res = await getDatabaseConfigs();
    console.log('Fetched databases:', res);
    databases.value = Array.isArray(res)
  ? res.filter(val => typeof val?.name === 'string' && val.name.startsWith('DB_'))
  : [];
  } catch (e) {
    errorAlertMessage.value = 'Failed to load databases';
  } finally {
    loading.value = false;
  }
};

const saveSelection = async () => {
  saving.value = true;
  success.value = false;
  error.value = null;
  console.log('Databases to save:', databases.value);

  try {
    await saveDatabaseConfigs(databases.value);

    success.value = true;
    successAlertMessage.value = 'Database selection saved successfully';
    setTimeout(() => {
      successAlertMessage.value = ''
    }, 5000)
  } catch (e) {
    errorAlertMessage.value = 'Failed to save database selection';
    setTimeout(() => {
      errorAlertMessage.value = ''
    }, 5000)
  } finally {
    saving.value = false;
  }
};

const formatDbName = (name:string) => {
  return name.startsWith('DB_') ? name.replace(/^DB_/, '') : name;
};

const isSelected = (db:any) => db.value === "True"

const toggleSelection = (db:any) => {
  db.value = db.value.trim() === "True" ? "False" : "True"
}

</script>
