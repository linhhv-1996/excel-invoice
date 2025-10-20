<script setup lang="ts">
import { useUserProfile } from '~/composables/useUserProfile';

defineProps<{
  isPreviewReady: boolean,
  exportCount: number, // Giờ là số lượng đã chọn
  isExportDisabled?: boolean, // Thêm prop để disable nút khi đang xử lý
  isExporting?: boolean, // Thêm prop để hiển thị trạng thái đang export
  exportProgress?: { value: number, text: string } // Thêm prop để hiển thị tiến trình
}>()
const emit = defineEmits(['changeFile', 'export', 'openUpgradeModal'])
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { isPro } = useUserProfile();

async function handleLogout() {
  await supabase.auth.signOut()
  window.location.reload()
}
</script>
<template>
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div class="mx-auto max-w-5xl px-3">
            <div class="flex h-12 items-center justify-between">
                <a href="/" class="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink">
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#0f172a"></rect><path d="M7 7H9.5L12.5 13.5V7H14.5V17H12L9 10.5V17H7V7Z" fill="white"></path></svg>
                    <span>Excel → Invoice</span>
                </a>
                <div class="flex items-center gap-2">
                    <button @click="$emit('changeFile')" class="btn cursor-pointer">
                        <span class="sm:inline">Change file</span>
                    </button>
                    <button
                        @click="$emit('export')"
                        class="btn-primary relative overflow-hidden"
                        :disabled="!isPreviewReady || exportCount === 0 || isExportDisabled"
                        style="min-width: 100px;" 
                    >
                         <span v-if="isExporting && exportProgress"
                              class="absolute inset-0 bg-slate-600/50 flex items-center justify-center text-xs leading-none"
                              :style="{ transform: `translateX(-${100 - exportProgress.value}%)` }">
                        </span>
                         <span class="relative z-10">
                            {{ isExporting ? (exportProgress?.text || 'Processing...') : `Export (${exportCount})` }}
                        </span>
                    </button>
                </div>

                 <div class="flex items-center gap-2">
                    <button v-if="!isPro" @click="$emit('openUpgradeModal')" class="btn-pro">Upgrade to Pro</button>

                    <template v-if="!user">
                        <a href="/login" class="btn">Login</a>
                    </template>
                    <template v-else>
                        <button @click="handleLogout" class="btn">Logout</button>
                    </template>
                </div>
            </div>
        </div>
    </header>
</template>
