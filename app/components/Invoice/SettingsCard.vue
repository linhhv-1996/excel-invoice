<script setup lang="ts">
import { ref, onMounted, watch, computed, inject, nextTick } from 'vue'
import type { Settings } from '~/composables/useInvoiceGenerator'
import { useUserProfile } from '~/composables/useUserProfile'
import { useInvoicePresets, type InvoicePreset } from '~/composables/useInvoicePresets'
import type { InvoicePresetData } from '~/server/api/invoice-presets'
import { useNotification } from '~/composables/useNotification'

const props = defineProps<{ settings: Settings }>()
const emit = defineEmits(['update:settings', 'openUpgradeModal'])

const localSettings = computed({
  get: () => props.settings,
  set: (value) => emit('update:settings', value),
})

// --- State Quản lý ---
const { isPro } = useUserProfile()
const { presets, isLoading: isLoadingPresets, fetchPresets, savePreset, updatePreset, deletePreset } = useInvoicePresets()
const showConfirm = inject('showConfirm') as (title: string, message: string, onConfirm: () => void) => void;
const { showNotification } = useNotification()

const newPresetName = ref('')
const selectedPresetId = ref<number | null>(null)
const isDirty = ref(false)
let isProgrammaticChange = false // Flag để tránh race condition

// --- Lifecycle & Watchers ---
onMounted(() => {
  if (isPro.value) fetchPresets()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && presets.value.length === 0) fetchPresets()
})

watch(selectedPresetId, (newId) => {
  if (!newId) {
    isDirty.value = false;
    return;
  }
  proFeatureGuard(() => {
    const preset = presets.value.find(p => p.id === newId);
    if (preset) {
      isProgrammaticChange = true;
      Object.assign(localSettings.value, preset.profile_data);
      showNotification(`Preset "${preset.profile_name}" loaded!`);
      isDirty.value = false;
      nextTick(() => {
        isProgrammaticChange = false;
      });
    }
  });
});

// *** LOGIC ĐÃ ĐƯỢC SỬA LỖI HOÀN CHỈNH ***
watch(localSettings, (newSettings) => {
    if (isProgrammaticChange) return;

    if (selectedPresetId.value) {
        const selectedPreset = presets.value.find(p => p.id === selectedPresetId.value);
        if (selectedPreset) {
            // Helper để tạo một object preset data chuẩn hóa
            const normalize = (s: Partial<Settings>): InvoicePresetData => ({
                cName: s.cName || '',
                cEmail: s.cEmail || '',
                cAddr: s.cAddr || '',
                cTax: s.cTax || '',
                template: s.template || 'modern',
                fileNamePattern: s.fileNamePattern || '',
                startInvoiceNumber: s.startInvoiceNumber || '',
                currency: s.currency || 'USD',
                locale: s.locale || 'en-US',
                taxPercent: s.taxPercent || 0,
            });

            const currentData = normalize(newSettings);
            const originalData = normalize(selectedPreset.profile_data);

            isDirty.value = JSON.stringify(currentData) !== JSON.stringify(originalData);
        }
    } else {
        isDirty.value = false;
    }
}, { deep: true });


// --- Các hàm xử lý hành động ---
const proFeatureGuard = (action: Function) => {
  if (!isPro.value) {
    emit('openUpgradeModal');
    return false;
  }
  action();
  return true;
}

const getPresetDataFromSettings = (): InvoicePresetData => {
    const { freeMode, logo, ...rest } = localSettings.value;
    return rest;
}

const handleSaveNewPreset = async () => {
    if (!proFeatureGuard(() => {})) return;
    
    const dataToSave = getPresetDataFromSettings();
    const savedPreset = await savePreset(newPresetName.value, dataToSave);
    
    if(savedPreset) {
        newPresetName.value = ''; 
        selectedPresetId.value = savedPreset.id; 
    }
}

const handleUpdatePreset = async () => {
    const preset = presets.value.find(p => p.id === selectedPresetId.value);
    if (!preset) return;
    if (!proFeatureGuard(() => {})) return;

    const dataToUpdate = getPresetDataFromSettings();
    const updated = await updatePreset(preset.id, dataToUpdate);
    if(updated) {
        isDirty.value = false;
    }
}

const handleDeletePreset = () => {
    const preset = presets.value.find(p => p.id === selectedPresetId.value);
    if (!preset) return;
    showConfirm(
      'Delete Preset',
      `Are you sure you want to delete the "${preset.profile_name}" preset? This action cannot be undone.`,
      () => {
        if (!proFeatureGuard(() => {})) return;
        deletePreset(preset.id).then(success => {
            if(success) {
                selectedPresetId.value = null;
                Object.assign(localSettings.value, {
                    cName: 'Your Company', cEmail: 'you@example.com', cAddr: '123 Your Street, City',
                    template: 'modern', fileNamePattern: 'invoice_{client}_{date}', startInvoiceNumber: 'INV-001',
                    currency: 'USD', locale: 'en-US', taxPercent: 10
                });
            }
        });
    });
}
</script>

<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2"><h2 class="text-[13px] font-semibold text-ink">3. Output & Style Settings</h2></div>
        <div class="p-3 pt-0">
            <div class="mb-4 rounded-md border border-slate-200 p-3 space-y-3">
                <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 flex items-center">
                    Invoice Presets <span class="pro-feature-badge ml-2">Pro</span>
                </h3>

                <div v-if="isPro && presets.length === 0 && !isLoadingPresets" class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600">
                    <p>You haven't saved any presets yet.</p>
                    <p class="mt-1">Fill in all settings below, then save them as a preset for quick access!</p>
                </div>

                <div v-else class="flex items-center gap-2">
                    <select v-model="selectedPresetId" :disabled="!isPro || isLoadingPresets" class="form-select-pro flex-grow cursor-pointer !mt-0">
                        <option :value="null">{{ isPro ? 'Load a preset...' : 'Feature available for Pro' }}</option>
                        <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.profile_name }}</option>
                    </select>
                    
                    <template v-if="selectedPresetId">
                        <button @click="handleUpdatePreset" :disabled="!isDirty || isLoadingPresets" class="btn-primary">
                            {{ isDirty ? 'Update' : 'Saved' }}
                        </button>
                        <button @click="handleDeletePreset" :disabled="isLoadingPresets" class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting" title="Delete preset">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M9 2a2 2 0 0 0-2 2v2H3v2h1.1l1.2 13.4A2 2 0 0 0 7.3 24h9.4a2 2 0 0 0 2-2.6L19.9 8H21V6h-4V4a2 2 0 0 0-2-2H9Zm2 5v12a1 1 0 1 1-2 0V7h2Zm4 0v12a1 1 0 1 1-2 0V7h2Z" clip-rule="evenodd"></path></svg>
                        </button>
                    </template>
                </div>
                
                <div class="border-t border-slate-200 my-2"></div>

                <div class="grid grid-cols-3 gap-2">
                    <input type="text" placeholder="Save current settings as new preset..." v-model="newPresetName" :disabled="!isPro || isLoadingPresets" class="form-input col-span-2 !mt-0" />
                    <button @click="handleSaveNewPreset" :disabled="!newPresetName || isLoadingPresets" class="btn-primary w-full">Save New</button>
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
