<script setup lang="ts">
defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal open" @click="onBackdropClick">
      <div class="card flex flex-col bg-white p-4" style="max-height: calc(100vh - 5rem); max-width: calc(100vw - 2rem)">
        <div class="flex items-center justify-between flex-shrink-0">
          <h4 class="text-sm font-bold">
            Fullscreen Preview
          </h4>
          <button class="btn btn-outline" @click="emit('close')">
            Close
          </button>
        </div>
        <div class="mt-3 overflow-auto w-full">
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
