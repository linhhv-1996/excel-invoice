<script setup lang="ts">
import { useNotification } from '~/composables/useNotification'

const { isVisible, message } = useNotification()
</script>

<template>
  <div
    id="notification"
    class="fixed bottom-5 right-5 bg-ink text-white p-3 rounded-lg shadow-lg text-sm z-[110]"
    :class="{ show: isVisible }"
  >
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
/* Copy y hệt CSS từ file gốc */
#notification {
    transition: transform 0.3s ease-in-out;
    transform: translateX(calc(100% + 1.25rem));
}

#notification.show {
    transform: translateX(0);
}
</style>
