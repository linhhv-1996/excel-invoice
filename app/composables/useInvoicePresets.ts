// app/composables/useInvoicePresets.ts
import { ref } from 'vue'
import { useNotification } from './useNotification'
import type { InvoicePresetData } from '~/server/api/invoice-presets'

// Interface mới, đồng bộ với backend
export interface InvoicePreset {
  id: number;
  profile_name: string;
  profile_data: InvoicePresetData;
}

export function useInvoicePresets() {
  const { showNotification } = useNotification()
  const presets = ref<InvoicePreset[]>([])
  const isLoading = ref(false)

  const fetchPresets = async () => {
    isLoading.value = true
    try {
      // Gọi đến API endpoint mới
      presets.value = await $fetch<InvoicePreset[]>('/api/invoice-presets')
    } catch (e: any) { showNotification('Could not fetch your presets.') }
    finally { isLoading.value = false }
  }

  const savePreset = async (name: string, data: InvoicePresetData) => {
    isLoading.value = true
    try {
      const newPreset = await $fetch<InvoicePreset>('/api/invoice-presets', { 
        method: 'POST', 
        body: { profile_name: name, profile_data: data }
      })
      presets.value.push(newPreset)
      // Sắp xếp lại danh sách theo alphabet
      presets.value.sort((a, b) => a.profile_name.localeCompare(b.profile_name));
      showNotification(`Preset "${name}" saved!`)
      return newPreset
    } catch (e: any) { showNotification(e.data?.message || 'Failed to save preset.') }
    finally { isLoading.value = false }
  }

  const updatePreset = async (id: number, data: InvoicePresetData) => {
     isLoading.value = true
    try {
      const updatedPreset = await $fetch<InvoicePreset>('/api/invoice-presets', { 
        method: 'PUT', 
        body: { id, profile_data: data }
      })
      const index = presets.value.findIndex(p => p.id === id)
      if (index !== -1) presets.value[index] = updatedPreset
      showNotification(`Preset updated!`)
      return updatedPreset
    } catch (e: any) { showNotification(e.data?.message || 'Failed to update preset.') }
    finally { isLoading.value = false }
  }

  const deletePreset = async (id: number) => {
    isLoading.value = true
    try {
      await $fetch('/api/invoice-presets', { method: 'DELETE', body: { id } })
      const index = presets.value.findIndex(p => p.id === id);
      if (index > -1) {
        const deletedName = presets.value[index].profile_name;
        presets.value.splice(index, 1)
        showNotification(`Preset "${deletedName}" deleted.`)
      }
      return true
    } catch (e: any) { showNotification(e.data?.message || 'Failed to delete preset.') }
    finally { isLoading.value = false }
    return false
  }

  return { 
    presets, 
    isLoading, 
    fetchPresets, 
    savePreset, 
    updatePreset, 
    deletePreset 
  }
}
