<script setup lang="ts">
import { useFileUploader } from '~/composables/useFileUploader';
import { useUserProfile } from '~/composables/useUserProfile';

const { fileInput, handleFileChange } = useFileUploader();
const user = useSupabaseUser();
const { fetchProfile } = useUserProfile();

// Theo dõi user state, nếu có thì lấy profile
watch(user, () => {
  fetchProfile();
}, { immediate: true });
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
</template>
