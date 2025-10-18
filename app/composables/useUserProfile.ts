// app/composables/useUserProfile.ts
import { ref, watch, computed } from 'vue'

export const useUserProfile = () => {
  // SỬA LỖI: Di chuyển 2 dòng này vào BÊN TRONG function để đúng ngữ cảnh Nuxt
  const userProfile = useState('userProfile', () => null as { subscription_tier: string } | null)
  const isLoadingProfile = useState('isLoadingProfile', () => true)

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const fetchProfile = async () => {
    if (!user.value) {
      userProfile.value = null
      isLoadingProfile.value = false
      return
    }

    isLoadingProfile.value = true
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.value.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Bỏ qua lỗi "không tìm thấy dòng", vì user mới có thể chưa có profile ngay
        throw error
      }
      
      userProfile.value = data
    } catch (err) {
      console.error('Error fetching profile:', err)
      userProfile.value = null
    } finally {
      isLoadingProfile.value = false
    }
  }

  // Theo dõi user state, nếu có thì lấy profile. Sẽ tự chạy khi app mở.
  watch(user, fetchProfile, { immediate: true })

  const isPro = computed(() => {
    const tier = userProfile.value?.subscription_tier
    return tier === 'pro' || tier === 'business'
  })

  return {
    userProfile,
    isLoadingProfile,
    isPro,
    fetchProfile
  }
}
