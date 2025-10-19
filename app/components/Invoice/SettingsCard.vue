<script setup lang="ts">
import { ref, onMounted, watch, computed, inject } from 'vue'
import type { Settings } from '~/composables/useInvoiceGenerator'
import { useUserProfile } from '~/composables/useUserProfile'
import { useSenderProfiles, type SenderProfile } from '~/composables/useSenderProfiles'

const props = defineProps<{ settings: Settings }>()
const emit = defineEmits(['update:settings', 'openUpgradeModal'])

const localSettings = computed({
  get: () => props.settings,
  set: (value) => emit('update:settings', value),
})

// --- State Quản lý ---
const { isPro } = useUserProfile()
const { profiles, isLoading: isLoadingProfiles, fetchProfiles, saveProfile, updateProfile, deleteProfile } = useSenderProfiles()
const showConfirm = inject('showConfirm') as (title: string, message: string, onConfirm: () => void) => void;

const newProfileName = ref('')
const selectedProfileId = ref<number | null>(null)
const activeProfile = ref<SenderProfile | null>(null)
const isDirty = ref(false)

// Tải danh sách profile
onMounted(() => {
  if (isPro.value) fetchProfiles()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && profiles.value.length === 0) fetchProfiles()
})

// Theo dõi thay đổi của các trường thông tin so với profile đã load
watch(localSettings, (newData) => {
    if(activeProfile.value) {
        const currentData = JSON.stringify({cName: newData.cName, cEmail: newData.cEmail, cAddr: newData.cAddr});
        const originalData = JSON.stringify(activeProfile.value.profile_data);
        isDirty.value = currentData !== originalData;
    }
}, { deep: true });

// **LOGIC CHÍNH: Khi người dùng chọn một profile khác trong dropdown**
watch(selectedProfileId, (newId) => {
    // Nếu ID được chọn khác với profile đang active -> reset, đưa về trạng thái "Load"
    if (activeProfile.value && activeProfile.value.id !== newId) {
        activeProfile.value = null;
        isDirty.value = false;
    }
})


// --- Các hàm xử lý hành động ---

const proFeatureGuard = (action: Function) => {
  if (!isPro.value) return emit('openUpgradeModal');
  action();
}

const handleSaveNewProfile = async () => {
    proFeatureGuard(async () => {
        const dataToSave = { cName: localSettings.value.cName, cEmail: localSettings.value.cEmail, cAddr: localSettings.value.cAddr };
        const savedProfile = await saveProfile(newProfileName.value, dataToSave);
        if(savedProfile) {
            newProfileName.value = '';
            activeProfile.value = savedProfile; // Tự động active profile vừa lưu
            selectedProfileId.value = savedProfile.id;
        }
    });
}

const handleUpdateProfile = async () => {
    if (!activeProfile.value) return;
    proFeatureGuard(async () => {
        const dataToUpdate = { cName: localSettings.value.cName, cEmail: localSettings.value.cEmail, cAddr: localSettings.value.cAddr };
        const updated = await updateProfile(activeProfile.value.id, dataToUpdate);
        if(updated) {
            activeProfile.value = updated;
            isDirty.value = false;
        }
    });
}

const handleLoadProfile = () => {
    proFeatureGuard(() => {
        const profile = profiles.value.find(p => p.id === selectedProfileId.value);
        if (profile) {
            localSettings.value.cName = profile.profile_data.cName || '';
            localSettings.value.cEmail = profile.profile_data.cEmail || '';
            localSettings.value.cAddr = profile.profile_data.cAddr || '';
            activeProfile.value = JSON.parse(JSON.stringify(profile)); // Deep clone để so sánh
            isDirty.value = false;
        }
    });
}

const handleDeleteProfile = () => {
    if (!activeProfile.value) return;
    showConfirm(
      'Delete Profile',
      `Are you sure you want to delete the "${activeProfile.value.profile_name}" profile? This action cannot be undone.`,
      async () => {
        const success = await deleteProfile(activeProfile.value!.id);
        if(success) {
            localSettings.value.cName = 'Your Company';
            localSettings.value.cEmail = 'you@example.com';
            localSettings.value.cAddr = '123 Your Street, City';
            activeProfile.value = null;
            selectedProfileId.value = null;
        }
    });
}
</script>

<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2"><h2 class="text-[13px] font-semibold text-ink">3. Output & Style Settings</h2></div>
        <div class="p-3 pt-0">
            <div class="mb-4 rounded-md border border-slate-200 p-3 space-y-3">
                <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 flex items-center">
                    Sender Profiles <span class="pro-feature-badge ml-2">Pro</span>
                </h3>

                <div class="grid grid-cols-3 gap-2">
                    <select v-model="selectedProfileId" :disabled="!isPro || isLoadingProfiles" class="form-select-pro col-span-2 cursor-pointer !mt-0">
                        <option :value="null" disabled>{{ isPro ? 'Select a profile...' : 'Feature available for Pro' }}</option>
                        <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.profile_name }}</option>
                    </select>
                    
                    <div v-if="activeProfile && activeProfile.id === selectedProfileId" class="flex gap-2">
                        <button @click="handleUpdateProfile" :disabled="!isDirty || isLoadingProfiles" class="btn-primary w-full">
                            {{ isDirty ? 'Update' : 'Saved' }}
                        </button>
                        <button @click="handleDeleteProfile" :disabled="isLoadingProfiles" class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting" title="Delete profile">
                        
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M9 2a2 2 0 0 0-2 2v2H3v2h1.1l1.2 13.4A2 2 0 0 0 7.3 24h9.4a2 2 0 0 0 2-2.6L19.9 8H21V6h-4V4a2 2 0 0 0-2-2H9Zm2 5v12a1 1 0 1 1-2 0V7h2Zm4 0v12a1 1 0 1 1-2 0V7h2Z" clip-rule="evenodd"></path></svg>
                        
                        </button>
                    </div>
                    <button v-else @click="handleLoadProfile" :disabled="!selectedProfileId || isLoadingProfiles" class="btn w-full">
                        Load
                    </button>
                </div>
                
                <div class="border-t border-slate-200 my-2"></div>

                <div class="grid grid-cols-3 gap-2">
                    <input type="text" placeholder="Save current as new profile..." v-model="newProfileName" :disabled="!isPro || isLoadingProfiles" class="form-input col-span-2 !mt-0" />
                    <button @click="handleSaveNewProfile" :disabled="!newProfileName || isLoadingProfiles" class="btn w-full">Save New</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                <div class="col-span-2 space-y-2">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Sender Information (Your Info)</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="col-span-2 md:col-span-1"><div class="text-[12px] text-slate-500">Company Name</div>
                           <input v-model="localSettings.cName" class="form-input" />
                        </label>
                        <label class="col-span-2 md:col-span-1"><div class="text-[12px] text-slate-500">Contact Email</div>
                           <input v-model="localSettings.cEmail" class="form-input"/>
                        </label>
                    </div>
                    <label><div class="text-[12px] text-slate-500">Sender Address</div>
                        <textarea v-model="localSettings.cAddr" class="form-input" rows="2"></textarea>
                    </label>
                </div>
                 <div class="col-span-2 space-y-2 pt-3 mt-3 border-t border-slate-200">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Template</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                         <button @click="localSettings.template = 'modern'" class="group overflow-hidden rounded-md p-2 text-left text-[12px]" :class="localSettings.template === 'modern' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'">
                            <InvoiceTemplateThumbnail template="modern" /><div class="mt-1 font-medium text-ink">Modern</div>
                        </button>
                         <button @click="localSettings.template = 'classic'" class="group overflow-hidden rounded-md p-2 text-left text-[12px]" :class="localSettings.template === 'classic' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'">
                            <InvoiceTemplateThumbnail template="classic" /><div class="mt-1 font-medium">Classic</div>
                        </button>
                         <button @click="localSettings.template = 'technical'" class="group overflow-hidden rounded-md p-2 text-left text-[12px]" :class="localSettings.template === 'technical' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'">
                            <InvoiceTemplateThumbnail template="technical" /><div class="mt-1 font-medium">Technical</div>
                        </button>
                         <button @click="localSettings.template = 'elegant'" class="group overflow-hidden rounded-md p-2 text-left text-[12px]" :class="localSettings.template === 'elegant' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'">
                            <InvoiceTemplateThumbnail template="elegant" /><div class="mt-1 font-medium">Elegant</div>
                        </button>
                    </div>
                </div>
                <div class="col-span-2 space-y-2 pt-3 mt-3 border-t border-slate-200">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Document Settings</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <label><div class="text-[12px] text-slate-500">File name pattern</div><input v-model="localSettings.fileNamePattern" class="form-input" /></label>
                        <label><div class="text-[12px] text-slate-500">Starting Invoice Number</div><input v-model="localSettings.startInvoiceNumber" class="form-input" /></label>
                        <label><div class="text-[12px] text-slate-500">Currency</div><select v-model="localSettings.currency" class="form-select"><option>USD</option><option>EUR</option><option>VND</option></select></label>
                        <label><div class="text-[12px] text-slate-500">Locale</div><select v-model="localSettings.locale" class="form-select"><option>en-US</option><option>en-GB</option><option>vi-VN</option></select></label>
                        <label class="col-span-2"><div class="text-[12px] text-slate-500">Global Tax % (Optional)</div><input v-model.number="localSettings.taxPercent" type="number" class="form-input" placeholder="e.g., 10" /></label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
