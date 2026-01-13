<script setup lang="ts">
import { ref } from 'vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'

import TableThree from '@/components/Tables/TableThree.vue'

const pageTitle = ref('Tables')
</script>

<template>
    <!-- Breadcrumb Start -->
    <BreadcrumbDefault :pageTitle="pageTitle" />
    <!-- Breadcrumb End -->

    <div class="flex flex-col gap-10">
     
      <TableThree />
    </div>
</template>
