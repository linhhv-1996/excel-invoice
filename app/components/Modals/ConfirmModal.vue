<script setup lang="ts">
defineProps<{
  show: boolean;
  title?: string;
  message?: string;
}>();
const emit = defineEmits(['close', 'confirm']);
</script>

<template>
  <div v-if="show" class="modal-backdrop">
    <div class="w-full max-w-md rounded-xl bg-white p-0 shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 class="text-lg font-semibold text-ink">{{ title || 'Confirm Action' }}</h2>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-600">{{ message || 'Are you sure you want to proceed?' }}</p>
      </div>
      <div class="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 rounded-b-xl">
        <button @click="$emit('confirm')" class="btn bg-red-600 text-white hover:bg-red-700 border-red-600">
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
