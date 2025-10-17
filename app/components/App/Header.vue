<script setup lang="ts">
defineProps<{
  fileName: string
  isPreviewReady: boolean
  freeMode: boolean
  isFileUploaded: boolean // <-- Prop mới
}>()

const emit = defineEmits([
  'update:freeMode',
  'browse',
  'preview',
  'export',
  'reset',
  'downloadTemplate',
])

const onFreeModeChange = (event: Event) => {
  emit('update:freeMode', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
      <a href="#" class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </div>
        <span class="text-sm font-extrabold tracking-tight">Excel Invoice Pro</span>
      </a>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-600 hidden md:inline">100% client-side • Data never leaves your device</span>
      </div>
    </div>
    <div class="mx-auto max-w-5xl px-4 pb-3">
      <template v-if="!isFileUploaded">
        <div class="card p-3 flex flex-wrap items-center gap-3">
          <div class="file">
            <button class="btn btn-primary" @click="$emit('browse')"> Browse .xlsx File
            </button>
            <span class="file-name">{{ fileName }}</span>
          </div>
          <div class="ml-auto">
             <button class="btn btn-outline" @click="$emit('reset')">Reset App</button>
          </div>
        </div>
        <div class="card p-3 mt-3 text-xs text-slatey">
          <div class="font-semibold mb-2">Upload rules</div>
          <ul class="list-disc pl-5 space-y-1">
            <li>First row must be the header.</li>
            <li>Ensure there are no merged cells.</li>
            <li>Avoid subtotal or empty rows in your data.</li>
            <li>Not sure? <a href="#" class="font-semibold text-money underline hover:text-leaf" @click.prevent="$emit('downloadTemplate')">Download sample template</a>.</li>
          </ul>
        </div>
      </template>

      <template v-else>
        <div class="card p-3 flex flex-wrap items-center gap-3">
           <button class="btn btn-outline" @click="$emit('browse')">Change File</button>
           <span class="file-name">{{ fileName }}</span>

          <div class="ml-auto flex items-center gap-3">
            <label class="inline-flex items-center gap-2 text-xs select-none">
              <input type="checkbox" class="chk" :checked="freeMode" @change="onFreeModeChange">
              Free mode (10 invoices + watermark)
            </label>
            <button class="btn btn-outline" :disabled="!isPreviewReady" @click="$emit('preview')">Fullscreen</button>
            <button class="btn btn-primary" :disabled="!isPreviewReady" @click="$emit('export')">Export ZIP</button>
          </div>
        </div>
      </template>
    </div>
  </header>
</template>
