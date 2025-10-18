<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const email = ref('')
const loading = ref(false)
const loadingGoogle = ref(false)
const { showNotification } = useNotification()

// Chuyển hướng nếu đã đăng nhập
watch(user, () => {
  if (user.value) {
    navigateTo('/app')
  }
}, { immediate: true })


// Hàm login bằng Magic Link
const handleLogin = async () => {
  if (!email.value) {
    showNotification('Please enter your email address.')
    return
  }
  try {
    loading.value = true
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/app`, // Redirect thẳng vào app sau khi login
      },
    })
    if (error) throw error
    showNotification('Check your email for the login link!')
  } catch (error: any) {
    showNotification(error.error_description || error.message)
  } finally {
    loading.value = false
  }
}

// Hàm login bằng Google
const handleGoogleLogin = async () => {
  loadingGoogle.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${window.location.origin}/app` // Redirect thẳng vào app sau khi login
    }
  })
  if (error) {
    showNotification(error.message)
    loadingGoogle.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <div class="w-full max-w-sm">
      <a href="/" class="flex items-center justify-center gap-2 font-extrabold tracking-tight text-2xl mb-6">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-sm text-white">EX</span>
        <span>Excel → Invoice</span>
      </a>
      <div class="bg-white p-6 rounded-xl border border-slate-200">
        <h1 class="text-xl font-semibold mb-2">Sign in / Sign up</h1>
        
        <button @click="handleGoogleLogin" :disabled="loadingGoogle || loading" class="btn w-full justify-center mt-2 mb-4 border-slate-300">
          <svg class="w-4 h-4 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.512-11.01-8.333l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.988,36.58,44,30.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
          Sign in with Google
        </button>

        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-300"></div></div>
          <div class="relative flex justify-center text-sm"><span class="bg-white px-2 text-slate-500">Or with email</span></div>
        </div>
        
        <form @submit.prevent="handleLogin">
          <div>
            <label for="email" class="text-sm font-medium">Email address</label>
            <input id="email" v-model="email" type="email" class="form-input mt-1" placeholder="you@example.com" :disabled="loading || loadingGoogle"/>
          </div>
          <button type="submit" class="btn-primary w-full justify-center mt-4" :disabled="loading || loadingGoogle">
            {{ loading ? 'Sending...' : 'Send Magic Link' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
