<script setup lang="ts">
defineProps<{ show: boolean }>()
const emit = defineEmits(['close', 'confirm', 'upgrade'])
</script>

<template>
  <div v-if="show" class="modal-backdrop">
    <div class="w-full max-w-sm rounded-xl bg-white p-0 shadow-xl text-center overflow-hidden">
      
      <div class="p-6 relative">
        <button @click="$emit('close')" class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        
        <div class="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-indigo-100 mb-4">
          <svg class="w-9 h-9 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 class="text-xl font-semibold text-ink">Export with Watermark?</h2>
        <p class="mt-2 text-sm text-slate-600">
          Because you're on the Free plan, your exported invoices will include our branding. Upgrade to Pro to remove it.
        </p>
      </div>

      <div class="bg-slate-50 p-6 rounded-b-xl">
        <button @click="$emit('upgrade')" class="btn-pro w-full justify-center !py-2.5 text-base font-semibold">
          ✨ Upgrade and Remove Watermark
        </button>
        
        <button @click="$emit('confirm')" class="mt-4 text-xs text-slate-500 hover:text-slate-700 hover:underline">
          No thanks, continue exporting with a watermark
        </button>
      </div>
    </div>
  </div>
</template>
