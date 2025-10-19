// app/composables/useMappingTemplates.ts
import { ref } from 'vue'
import { useNotification } from './useNotification'
import type { Mapping } from './useInvoiceGenerator'

export interface MappingTemplate {
  id: number;
  template_name: string;
  mapping_config: Mapping;
}

export function useMappingTemplates() {
  const { showNotification } = useNotification()
  const templates = ref<MappingTemplate[]>([])
  const isLoading = ref(false)

  /**
   * Lấy danh sách template từ API server
   */
  const fetchTemplates = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<MappingTemplate[]>('/api/mapping-templates')
      templates.value = data || []
    } catch (error: any) {
      showNotification(`Error fetching templates: ${error.data?.statusMessage || error.message}`)
      templates.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Lưu (tạo mới hoặc cập nhật) template thông qua API server
   */
  const saveTemplate = async (name: string, config: Mapping) => {
    if (!name || name.trim() === '') {
      showNotification('Please enter a template name.')
      return false
    }

    isLoading.value = true
    try {
      await $fetch('/api/mapping-templates', {
        method: 'POST',
        body: { name: name.trim(), config }
      })

      // Không cần thông báo ở đây, vì component sẽ thông báo tùy ngữ cảnh (updated/saved)
      await fetchTemplates() // Tải lại danh sách để có ID mới nhất
      return true
    } catch (error: any) {
      showNotification(`Error saving template: ${error.data?.statusMessage || error.message}`)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Xóa một template thông qua API server
   */
  const deleteTemplate = async (templateId: number) => {
    isLoading.value = true
    try {
      await $fetch('/api/mapping-templates', {
        method: 'DELETE',
        body: { id: templateId }
      })

      const index = templates.value.findIndex(t => t.id === templateId)
      if (index > -1) {
        const deletedName = templates.value[index].template_name
        templates.value.splice(index, 1)
        showNotification(`Template "${deletedName}" deleted!`)
      }
      return true
    } catch (error: any) {
      showNotification(`Error deleting template: ${error.data?.statusMessage || error.message}`)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    templates,
    isLoading,
    fetchTemplates,
    saveTemplate,
    deleteTemplate,
  }
}
