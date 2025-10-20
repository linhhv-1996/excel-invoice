// app/composables/useUserProfile.ts
import { ref, watchEffect, computed } from 'vue'

export const useUserProfile = () => {
  const userProfile = useState('userProfile', () => null as { subscription_tier: string } | null)
  const isLoadingProfile = useState('isLoadingProfile', () => true)

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  watchEffect(async () => {
    const userId = user.value?.id || (user.value as any)?.sub;

    if (!userId) {
      userProfile.value = null
      isLoadingProfile.value = false
      return
    }

    isLoadingProfile.value = true
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        throw error
      }
      
      userProfile.value = data
    } catch (err) {
      console.error('Error fetching profile:', err)
      userProfile.value = null
    } finally {
      isLoadingProfile.value = false
    }
  })

  // Cập nhật: Bất kỳ ai có gói 'personal' hoặc 'pro' đều được coi là người dùng trả phí
  const isPro = computed(() => {
    const tier = userProfile.value?.subscription_tier
    return tier === 'personal' || tier === 'pro'
  })

  return {
    userProfile,
    isLoadingProfile,
    isPro,
  }
}
