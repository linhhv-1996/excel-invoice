// app/composables/useFileUploader.ts
import * as XLSX from 'xlsx'
import { useNotification } from '~/composables/useNotification'
import { useDb } from '~/composables/useDb'

// State này sẽ giữ tham chiếu đến thẻ input
const fileInput = ref<HTMLInputElement | null>(null)

export function useFileUploader() {
  const { showNotification } = useNotification()
  const { saveSession, clearSession } = useDb()
  const router = useRouter()

  // Hàm để các component khác có thể gọi để mở cửa sổ chọn file
  const triggerFileInput = () => {
    fileInput.value?.click()
  }

  // Hàm xử lý logic chính khi người dùng đã chọn file
  const handleFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    // Reset input để có thể upload lại cùng 1 file
    if (e.target) {
        (e.target as HTMLInputElement).value = ''
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        if (!jsonData.length) {
          showNotification('Error: No data found in the first sheet.')
          return
        }

        // Luôn xóa session cũ trước khi lưu session mới
        await clearSession()
        // Lưu session vào IndexedDB
        await saveSession(file.name, jsonData)

        // Nếu đang ở trang chủ thì chuyển trang, nếu đã ở trang app thì reload
        if (router.currentRoute.value.path === '/app') {
            window.location.reload()
        } else {
            await router.push('/app')
        }

      } catch (err: any) {
        showNotification(`Error parsing Excel file: ${err.message}`)
      }
    }
    reader.onerror = () => {
      showNotification('Error reading file.')
    }
    reader.readAsArrayBuffer(file)
  }

  return {
    fileInput,
    triggerFileInput,
    handleFileChange,
  }
}
