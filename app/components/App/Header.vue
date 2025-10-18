<script setup lang="ts">
defineProps<{
  fileName: string,
  isPreviewReady: boolean,
  exportCount: number,
}>()
const emit = defineEmits(['changeFile', 'export'])
</script>
<template>
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div class="mx-auto max-w-5xl px-3">
            <div class="flex h-12 items-center justify-between">
                <div class="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink">
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#0f172a"></rect><path d="M7 7H9.5L12.5 13.5V7H14.5V17H12L9 10.5V17H7V7Z" fill="white"></path></svg>
                    Excel → Invoice
                </div>
                <div class="flex items-center gap-2">
                    <button @click="$emit('changeFile')" class="btn cursor-pointer">
                        <span class="sm:inline">Change file</span>
                    </button>
                    <button @click="$emit('export')" class="btn-primary" :disabled="!isPreviewReady">
                        Export ({{ exportCount }})
                    </button>
                </div>
                 <div class="flex items-center gap-2">
                    <button class="btn">Login</button>
                    <button class="btn-primary">Sign Up</button>
                </div>
            </div>
        </div>
    </header>
</template>
