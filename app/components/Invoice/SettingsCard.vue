<script setup lang="ts">
import { ref, onMounted, watch, computed, inject, nextTick } from 'vue'
import type { Settings } from '~/composables/useInvoiceGenerator'
import { useUserProfile } from '~/composables/useUserProfile'
import { useInvoicePresets, type InvoicePreset } from '~/composables/useInvoicePresets'
import type { InvoicePresetData } from '~/server/api/invoice-presets'
import { useNotification } from '~/composables/useNotification'

const props = defineProps<{ settings: Settings }>()
const emit = defineEmits(['update:settings', 'openUpgradeModal'])

// Sử dụng computed để v-model hoạt động đúng cách
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
let originalLoadedPresetData = ref<string>('') // Lưu trạng thái gốc dưới dạng JSON string
let isProgrammaticChange = false // Flag để tránh cập nhật isDirty khi load preset

// --- Computed property để lấy tên preset đang chọn ---
const selectedPresetName = computed(() => {
    if (!selectedPresetId.value) return '';
    const selected = presets.value.find(p => p.id === selectedPresetId.value);
    return selected ? selected.profile_name : '';
});


// --- Lifecycle & Watchers ---
onMounted(() => {
  if (isPro.value) fetchPresets()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && presets.value.length === 0) fetchPresets()
})

// Tự động load preset khi người dùng chọn từ dropdown
watch(selectedPresetId, (newId) => {
  if (!newId) {
    originalLoadedPresetData.value = ''
    isDirty.value = false; // Reset dirty state khi bỏ chọn
    return;
  }
  // Không cần guard ở đây vì dropdown chỉ hiện đầy đủ cho Pro
  const preset = presets.value.find(p => p.id === newId);
  if (preset) {
    isProgrammaticChange = true; // Đánh dấu là thay đổi do code
    // Merge preset data vào settings hiện tại, ghi đè các trường có trong preset
    const updatedSettings = { ...localSettings.value, ...preset.profile_data };
    emit('update:settings', updatedSettings); // Phát sự kiện update
    originalLoadedPresetData.value = JSON.stringify(getPresetDataFromSettings(updatedSettings)); // Lưu trạng thái gốc mới
    showNotification(`Preset "${preset.profile_name}" loaded!`);
    isDirty.value = false; // Reset dirty sau khi load
    nextTick(() => {
      isProgrammaticChange = false; // Bỏ đánh dấu sau khi cập nhật xong
    });
  }
});

// Theo dõi sự thay đổi của settings để bật/tắt nút Update
watch(localSettings, (newSettings) => {
    if (isProgrammaticChange) return; // Bỏ qua nếu thay đổi do code (load preset)

    if (originalLoadedPresetData.value) { // Chỉ kiểm tra dirty khi có preset được load
        const currentDataString = JSON.stringify(getPresetDataFromSettings(newSettings));
        isDirty.value = currentDataString !== originalLoadedPresetData.value;
    } else {
        isDirty.value = false; // Không dirty nếu không có preset nào được load
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

// Helper function để lấy dữ liệu cần lưu/so sánh từ object Settings
const getPresetDataFromSettings = (settingsObj: Settings = localSettings.value): InvoicePresetData => {
    const { freeMode, logo, ...rest } = settingsObj; // Loại bỏ freeMode và logo
    // Đảm bảo các giá trị không phải là undefined hoặc null, thay bằng giá trị mặc định nếu cần
    return {
        cName: rest.cName || '',
        cEmail: rest.cEmail || '',
        cAddr: rest.cAddr || '',
        cTax: rest.cTax || '', // Thêm cTax nếu có
        template: rest.template || 'modern',
        fileNamePattern: rest.fileNamePattern || '',
        startInvoiceNumber: rest.startInvoiceNumber || '',
        currency: rest.currency || 'USD',
        locale: rest.locale || 'en-US',
        taxPercent: rest.taxPercent || 0,
    };
}


const handleSaveNewPreset = async () => {
    if (!proFeatureGuard(async () => {
        const dataToSave = getPresetDataFromSettings();
        const savedPreset = await savePreset(newPresetName.value.trim(), dataToSave);

        if (savedPreset) {
            newPresetName.value = '';
            // Tự động chọn preset vừa lưu
            selectedPresetId.value = savedPreset.id;
             // Cập nhật lại originalLoadedPresetData sau khi lưu thành công
            originalLoadedPresetData.value = JSON.stringify(savedPreset.profile_data);
            isDirty.value = false; // Reset dirty state
        }
    })) return;
}

const handleUpdatePreset = async () => {
    const preset = presets.value.find(p => p.id === selectedPresetId.value);
    if (!preset) return;
    if (!proFeatureGuard(async () => {
        const dataToUpdate = getPresetDataFromSettings();
        const updated = await updatePreset(preset.id, dataToUpdate);
        if (updated) {
            originalLoadedPresetData.value = JSON.stringify(dataToUpdate); // Cập nhật trạng thái gốc
            isDirty.value = false; // Reset dirty state
             // Cập nhật lại preset trong danh sách local để tên không bị lỗi nếu đổi tên (mặc dù hiện tại không cho đổi tên)
            const index = presets.value.findIndex(p => p.id === updated.id);
            if (index > -1) presets.value[index] = updated;
        }
    })) return;
}


const handleDeletePreset = () => {
    const preset = presets.value.find(p => p.id === selectedPresetId.value);
    if (!preset) return;
    showConfirm(
      'Delete Preset',
      `Are you sure you want to delete the "${preset.profile_name}" preset? This action cannot be undone.`,
      () => {
        if (!proFeatureGuard(async () => {
            const success = await deletePreset(preset.id);
            if (success) {
                selectedPresetId.value = null; // Bỏ chọn
                originalLoadedPresetData.value = ''; // Xóa trạng thái gốc
                isDirty.value = false; // Reset dirty state
                // Optionally reset settings to default
                // emit('update:settings', { ...defaultSettings });
            }
        })) return;
    });
}

// Hàm để clear lựa chọn preset
const clearSelectedPreset = () => {
    selectedPresetId.value = null;
    originalLoadedPresetData.value = '';
    isDirty.value = false;
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

                <div v-if="!isPro" class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600 border border-slate-200">
                    <p class="font-medium">⚙️ Save and reuse your Invoice Settings with Presets!</p>
                    <p class="mt-1 text-xs">A time-saving feature available for Pro users.</p>
                    <button @click="$emit('openUpgradeModal')" class="btn-pro mt-3 text-xs !py-1">✨ Upgrade to Pro</button>
                </div>

                <div v-else>
                     <div v-if="presets.length === 0 && !isLoadingPresets" class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600">
                        <p>You haven't saved any settings presets yet.</p>
                        <p class="mt-1">Fill in the settings below, then save them as a preset for quick access!</p>
                    </div>

                    <div v-if="presets.length > 0 || isLoadingPresets" class="flex items-center gap-2 mb-3">
                        <select name="sltLoadingPreset" v-model="selectedPresetId" :disabled="isLoadingPresets" class="form-select flex-grow cursor-pointer !mt-0">
                            <option :value="null">{{ isLoadingPresets ? 'Loading presets...' : 'Load a preset...' }}</option>
                            <option v-for="p in presets" :key="p.id" :value="p.id">
                                {{ p.profile_name }}
                            </option>
                        </select>
                         <button v-if="selectedPresetId" @click="clearSelectedPreset" class="btn text-xs" title="Clear selection">Clear</button>
                    </div>

                     <div v-if="selectedPresetId" class="flex items-center gap-2">
                        <button @click="handleUpdatePreset" :disabled="!isDirty || isLoadingPresets" class="btn-primary flex-grow justify-center">
                             <span v-if="!isDirty">Preset Matched</span>
                             <span v-else>Update "{{ selectedPresetName }}"</span>
                        </button>
                        <button @click="handleDeletePreset" :disabled="isLoadingPresets" class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting" title="Delete preset">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.816 1.387 2.816 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.389 6.073a.75.75 0 01.389.676v8.178a.75.75 0 01-1.5 0v-8.178a.75.75 0 011.111-.676zm4.5 0a.75.75 0 01.676-.389h.001a.75.75 0 01.389.676v8.178a.75.75 0 01-1.5 0v-8.178a.75.75 0 01.75-.75z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>

                    <div v-if="!selectedPresetId || presets.length === 0" class="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 mt-3">
                        <input name="newPresentName" type="text" placeholder="Save current settings as new preset..." v-model="newPresetName" :disabled="isLoadingPresets" class="form-input col-span-2 !mt-0" />
                        <button @click="handleSaveNewPreset" :disabled="!newPresetName || isLoadingPresets" class="btn-primary w-full">Save New</button>
                    </div>
                </div>
            </div>

             <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                <div class="col-span-2 space-y-2">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Sender Information (Your Info)</h3>

                    <div class="grid grid-cols-2 gap-2">
                        <label class="col-span-2 md:col-span-1"><div class="text-[12px] text-slate-500">Company Name</div>
                           <input name="cName" v-model="localSettings.cName" class="form-input" />
                        </label>
                        <label class="col-span-2 md:col-span-1"><div class="text-[12px] text-slate-500">Contact Email</div>
                           <input name="cEmail" v-model="localSettings.cEmail" type="email" class="form-input"/>
                        </label>
                    </div>

                     <label class="col-span-2">
                        <div class="mt-1 text-[12px] text-slate-500">Sender Address</div>
                        <input nonce="cAddr" v-model="localSettings.cAddr" class="form-input" placeholder="123 Your Street, City, Country"/>
                     </label>

                     <div class="grid grid-cols-2 gap-2">
                          <label class="col-span-2 md:col-span-1">
                              <div class="text-[12px] text-slate-500">Tax ID / VAT Number (Optional)</div>
                              <input name="cTax" v-model="localSettings.cTax" class="form-input" placeholder="e.g., VAT DE123456789"/>
                          </label>

                          <div class="col-span-2 md:col-span-1">
                                <div class="text-[12px] text-slate-500">Your Logo</div>
                                <div class="flex items-center gap-2">
                                    <input
                                        name="logo"
                                        type="file"
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        @change="handleLogoChange"
                                        ref="logoInputRef"
                                        class="form-input file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[12px] file:font-medium file:text-slate-700 hover:file:bg-slate-200 flex-grow p-0 cursor-pointer"
                                    />
                                    <img v-if="localSettings.logo" :src="localSettings.logo" alt="Logo Preview" class="h-8 w-auto border border-slate-200 rounded object-contain"/>
                                    <button v-if="localSettings.logo" @click="removeLogo" class="btn text-xs !px-1.5 flex-shrink-0" title="Remove logo">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M5.22 5.22a.75.75 0 0 1 1.06 0L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 1 1-1.06 1.06L8 9.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
                                    </button>
                                </div>
                                <p class="mt-1 text-[11px] text-slate-500">Max 1MB.</p>
                          </div>
                     </div>
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
                        <label class="col-span-2"><div class="text-[12px] text-slate-500">Global Tax % (Optional)</div><input v-model.number="localSettings.taxPercent" type="number" step="0.01" class="form-input" placeholder="e.g., 10" /></label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
