<script setup lang="ts">
defineProps<{ 
  show: boolean,
  title?: string 
}>()
const emit = defineEmits(['close'])

</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-backdrop">
      <div class="card flex flex-col bg-white w-full max-w-4xl rounded-xl overflow-hidden" style="max-height: calc(100vh - 5rem);">
        <div class="flex items-center justify-between flex-shrink-0 border-b border-slate-200 px-4 py-3">
          <h4 class="text-sm font-bold">
            {{ title || 'Preview' }}
          </h4>
          <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div class="p-4 overflow-auto w-full">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
