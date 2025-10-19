// app/composables/useSenderProfiles.ts
import { ref } from 'vue'
import { useNotification } from './useNotification'

export interface SenderProfileData {
  cName?: string;
  cEmail?: string;
  cAddr?: string;
  logo?: string | null;
}

export interface SenderProfile {
  id: number;
  profile_name: string;
  profile_data: SenderProfileData;
}

export function useSenderProfiles() {
  const { showNotification } = useNotification()
  const profiles = ref<SenderProfile[]>([])
  const isLoading = ref(false)

  const fetchProfiles = async () => {
    isLoading.value = true
    try {
      profiles.value = await $fetch<SenderProfile[]>('/api/sender-profiles')
    } catch (e: any) { showNotification('Could not fetch sender profiles.') }
    finally { isLoading.value = false }
  }

  const saveProfile = async (name: string, data: SenderProfileData) => {
    isLoading.value = true
    try {
      const newProfile = await $fetch<SenderProfile>('/api/sender-profiles', { 
        method: 'POST', 
        body: { profile_name: name, profile_data: data }
      })
      profiles.value.push(newProfile)
      showNotification(`Profile "${name}" saved!`)
      return newProfile
    } catch (e: any) { showNotification(e.data?.message || 'Failed to save profile.') }
    finally { isLoading.value = false }
  }

  const updateProfile = async (id: number, data: SenderProfileData) => {
     isLoading.value = true
    try {
      const updatedProfile = await $fetch<SenderProfile>('/api/sender-profiles', { 
        method: 'PUT', 
        body: { id, profile_data: data }
      })
      const index = profiles.value.findIndex(p => p.id === id)
      if (index !== -1) profiles.value[index] = updatedProfile
      showNotification(`Profile updated!`)
      return updatedProfile
    } catch (e: any) { showNotification(e.data?.message || 'Failed to update profile.') }
    finally { isLoading.value = false }
  }

  const deleteProfile = async (id: number) => {
    isLoading.value = true
    try {
      await $fetch('/api/sender-profiles', { method: 'DELETE', body: { id } })
      profiles.value = profiles.value.filter(p => p.id !== id)
      showNotification('Profile deleted.')
      return true
    } catch (e: any) { showNotification(e.data?.message || 'Failed to delete profile.') }
    finally { isLoading.value = false }
    return false
  }

  return { profiles, isLoading, fetchProfiles, saveProfile, updateProfile, deleteProfile }
}
