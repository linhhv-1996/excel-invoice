<template>
  <div class="aspect-[4/3] rounded border border-slate-200 bg-white p-1.5">
    <div v-if="template === 'modern'" class="h-full w-full flex flex-col gap-1">
      <div class="flex justify-between items-start">
        <div class="w-1/2 h-4 bg-slate-100 rounded-sm"></div>
        <div class="w-1/4 h-4 bg-slate-100 rounded-sm"></div>
      </div>
      <div class="h-2 w-1/3 bg-slate-100 rounded-sm"></div>
      <div class="flex-grow bg-slate-50 rounded-sm mt-1"></div>
    </div>

    <div v-if="template === 'classic'" class="h-full w-full flex flex-col gap-1 items-center">
      <div class="h-3 w-1/2 bg-slate-200 rounded-sm"></div>
      <div class="h-2 w-1/3 bg-slate-100 rounded-sm"></div>
      <div class="w-full h-px bg-slate-200 my-1"></div>
      <div class="flex-grow w-full bg-slate-50 rounded-sm"></div>
    </div>

    <div v-if="template === 'technical'" class="h-full w-full flex flex-col gap-1 font-mono text-[5px] text-slate-300">
        <p>// INVOICE</p>
        <p>[SENDER]</p>
        <p>INV_ID: ...</p>
        <div class="flex-grow border border-dashed border-slate-200 rounded-sm mt-1"></div>
    </div>

    <div v-if="template === 'elegant'" class="h-full w-full flex">
        <div class="w-1/3 h-full bg-slate-50 rounded-l-sm"></div>
        <div class="w-2/3 h-full flex flex-col gap-1 p-1">
            <div class="h-4 w-full bg-slate-200 rounded-sm"></div>
            <div class="h-2 w-1/2 bg-slate-100 rounded-sm"></div>
            <div class="flex-grow border-t border-slate-200 mt-2"></div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  template: 'modern' | 'classic' | 'technical' | 'elegant'
}>()
</script>
