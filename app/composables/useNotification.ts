// composables/useNotification.ts
import { ref, readonly } from 'vue'

// Trạng thái được chia sẻ toàn cục
const isVisible = ref(false)
const message = ref('')
let timeoutId: NodeJS.Timeout | null = null

export function useNotification() {
  const showNotification = (msg: string, duration = 4000) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    message.value = msg
    isVisible.value = true

    timeoutId = setTimeout(() => {
      isVisible.value = false
    }, duration)
  }

  return {
    // Chỉ cho phép component đọc trạng thái, không được sửa
    isVisible: readonly(isVisible),
    message: readonly(message),
    // Hàm để kích hoạt thông báo
    showNotification,
  }
}
