<script setup lang="ts">
import { useFileUploader } from '~/composables/useFileUploader';
import { useUserProfile } from '~/composables/useUserProfile';

const { fileInput, handleFileChange } = useFileUploader();

// Chỉ cần gọi composable ở đây, nó sẽ tự động xử lý việc lấy profile
useUserProfile();

// **BỔ SUNG: State để quản lý confirm modal**
const confirmModalState = reactive({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

// Hàm để các component khác có thể gọi
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmModalState.title = title;
  confirmModalState.message = message;
  confirmModalState.onConfirm = onConfirm;
  confirmModalState.show = true;
};

const handleConfirm = () => {
  confirmModalState.onConfirm();
  confirmModalState.show = false;
};

const handleCloseConfirm = () => {
  confirmModalState.show = false;
};

// Cung cấp hàm showConfirm cho tất cả component con
provide('showConfirm', showConfirm);

</script>

<template>
  <div>
    <NuxtPage />
    <input
      name="uploaFile"
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="hidden"
      @change="handleFileChange"
    >

    <ModalsConfirmModal 
      :show="confirmModalState.show" 
      :title="confirmModalState.title"
      :message="confirmModalState.message"
      @close="handleCloseConfirm" 
      @confirm="handleConfirm" 
    />
    
  </div>
</template>
