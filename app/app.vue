<script setup lang="ts">
import { useFileUploader } from '~/composables/useFileUploader';

// Lấy ref và hàm xử lý từ composable mới
const { fileInput, handleFileChange } = useFileUploader();
</script>

<template>
  <div>
    <NuxtPage />

    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="hidden"
      @change="handleFileChange"
    >
  </div>

  <Footer />
</template>
