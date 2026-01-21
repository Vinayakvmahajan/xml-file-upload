<template>
  <AlertError :show="errorAlertMessage !== ''" :message="errorAlertMessage" />
  <div v-if="databases.length>0" class="p-6 bg-white border rounded shadow">
    <h4 class="text-lg font-semibold mb-4">
      Select Database(s)
    </h4>

    <!-- Loading -->
    <p v-if="loading" class="text-sm text-gray-500">
      Loading databases...
    </p>

    <!-- Database List -->
    <div v-else class="space-y-2">
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

    <!-- Status -->
    <p v-if="success" class="text-green-600 text-sm mt-2">
      Database selection saved successfully
    </p>
    <p v-if="error" class="text-red-600 text-sm mt-2">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getDatabaseConfigs, saveDatabaseConfigs } from '@/service/selectDatabaseService';
import AlertError from '@/components/Alerts/AlertError.vue';



/* state */
const databases = ref<Array<{ name: string; value: string }>>([])
const loading = ref(false)
const saving = ref(false)
const success = ref(false)
const error = ref<string | null>(null)
    
const errorAlertMessage = ref('')

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
    databases.value = res.data;
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
  } catch (e) {
    errorAlertMessage.value = 'Failed to save database selection';
  } finally {
    saving.value = false;
  }
};

const formatDbName = (name:string) => {
  return name.startsWith('DB_') ? name.replace(/^DB_/, '') : name;
};

const isSelected = (db:any) => db.value === "True"

const toggleSelection = (db:any) => {
  db.value = db.value === "True" ? "False" : "True"
}

</script>
