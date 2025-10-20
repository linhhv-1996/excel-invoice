<script setup lang="ts">
import { ref, onMounted, watch, inject, computed } from 'vue' // Thêm computed
import type { Mapping } from '~/composables/useInvoiceGenerator'
import { useUserProfile } from '~/composables/useUserProfile'
import { useNotification } from '~/composables/useNotification'
import { useMappingTemplates } from '~/composables/useMappingTemplates'

const props = defineProps<{
  headers: string[]
  mapping: Mapping
}>()

const emit = defineEmits(['update:mapping', 'openUpgradeModal'])

const showConfirm = inject('showConfirm') as (title: string, message: string, onConfirm: () => void) => void;

// --- State Quản lý ---
const user = useSupabaseUser()
const { isPro } = useUserProfile()
const { showNotification } = useNotification()
const { templates, isLoading: isLoadingTemplates, fetchTemplates, saveTemplate, deleteTemplate } = useMappingTemplates()

const newTemplateName = ref('')
const selectedTemplateId = ref<number | null>(null)
const originalLoadedTemplateConfig = ref<string>('')
const isMappingDirty = ref(false)

// --- Computed property để lấy tên template đang chọn ---
const selectedTemplateName = computed(() => {
  if (!selectedTemplateId.value) return '';
  const selected = templates.value.find(t => t.id === selectedTemplateId.value);
  return selected ? selected.template_name : '';
});

// --- Lifecycle & Watchers ---
onMounted(() => {
  if (isPro.value) fetchTemplates()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && templates.value.length === 0) fetchTemplates()
})

watch(selectedTemplateId, (newId) => {
  if (!newId) {
    originalLoadedTemplateConfig.value = ''
    isMappingDirty.value = false; // Reset dirty state khi bỏ chọn
    return
  }
  // Không cần gọi proFeatureGuard ở đây vì dropdown chỉ hiện đầy đủ cho Pro
  const selected = templates.value.find(t => t.id === newId)
  if (selected) {
    const newMapping = { ...props.mapping, ...JSON.parse(JSON.stringify(selected.mapping_config)) }
    emit('update:mapping', newMapping)
    originalLoadedTemplateConfig.value = JSON.stringify(newMapping)
    isMappingDirty.value = false
    showNotification(`Preset "${selected.template_name}" loaded!`)
  }
})

watch(() => props.mapping, (newMapping) => {
  if (originalLoadedTemplateConfig.value) {
    const currentConfig = JSON.stringify(newMapping)
    isMappingDirty.value = originalLoadedTemplateConfig.value !== currentConfig
  } else {
    // Nếu không có template nào được load (selectedTemplateId là null), không coi là dirty
    isMappingDirty.value = false
  }
}, { deep: true })


// --- Các hàm xử lý hành động ---
const proFeatureGuard = (action: Function) => {
  if (!user.value) {
    showNotification('Please log in to use Pro features.');
    return navigateTo('/login');
  }
  if (!isPro.value) {
    emit('openUpgradeModal');
    return false;
  }
  // Chỉ gọi action nếu đã qua guard
  action();
  return true;
}

const handleSaveNewTemplate = async () => {
  // Guard đã được tích hợp trong proFeatureGuard
  if (!proFeatureGuard(async () => {
    const success = await saveTemplate(newTemplateName.value, props.mapping);
    if (success) {
      showNotification(`Preset "${newTemplateName.value}" saved!`);
      const newSavedTemplate = templates.value.find(t => t.template_name === newTemplateName.value.trim());
      if (newSavedTemplate) {
        selectedTemplateId.value = newSavedTemplate.id; // Tự động chọn preset vừa lưu
      }
      newTemplateName.value = ''; // Xóa input sau khi lưu thành công
    }
  })) return;
}


const handleUpdateTemplate = async () => {
  const selected = templates.value.find(t => t.id === selectedTemplateId.value);
  if (!selected) return;

  if (!proFeatureGuard(async () => {
    const success = await saveTemplate(selected.template_name, props.mapping); // Dùng lại saveTemplate vì nó có logic upsert
    if (success) {
      originalLoadedTemplateConfig.value = JSON.stringify(props.mapping);
      isMappingDirty.value = false;
      showNotification(`Preset "${selected.template_name}" updated!`);
    }
  })) return;
}

const handleDeleteTemplate = async () => {
  const selected = templates.value.find(t => t.id === selectedTemplateId.value);
  if (!selected) return;

  showConfirm(
    'Delete Preset',
    `Are you sure you want to delete the "${selected.template_name}" preset? This action cannot be undone.`,
    () => {
      // Guard được gọi bên trong callback của confirm
      if (!proFeatureGuard(async () => {
        const success = await deleteTemplate(selected.id);
        if (success) {
          selectedTemplateId.value = null; // Bỏ chọn khỏi dropdown
          originalLoadedTemplateConfig.value = ''; // Xóa config gốc đã lưu
          isMappingDirty.value = false; // Reset dirty state
        }
      })) return;
    }
  );
}

// Hàm để clear lựa chọn template
const clearSelectedTemplate = () => {
  selectedTemplateId.value = null;
  originalLoadedTemplateConfig.value = '';
  isMappingDirty.value = false;
}
</script>

<template>
  <div class="rounded-xl border border-slate-200">
    <div class="flex select-none items-center justify-between px-3 py-2">
      <h2 class="text-[13px] font-semibold text-ink">1. Data Mapping</h2>
    </div>
    <div class="p-3 pt-0">

      <div class="mb-4 rounded-md border border-slate-200 p-3 space-y-3">
        <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 flex items-center">
          Preset Mappings
          <span class="pro-feature-badge ml-2">Pro</span>
        </h3>

        <div v-if="!isPro"
          class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600 border border-slate-200">
          <p class="font-medium">💾 Save and reuse your mappings with Presets!</p>
          <p class="mt-1 text-xs">A time-saving feature available for Pro users.</p>
          <button @click="$emit('openUpgradeModal')" class="btn-pro mt-3 text-xs !py-1">✨ Upgrade to Pro</button>
        </div>

        <div v-else>
          <div v-if="templates.length === 0 && !isLoadingTemplates"
            class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600">
            <p>You don't have any saved presets yet.</p>
            <p class="mt-1">Configure your mapping below, then save it here for future use!</p>
          </div>

          <div v-if="templates.length > 0 || isLoadingTemplates" class="flex items-center gap-2 mb-3">
            <select name="selectedTemplateId" v-model="selectedTemplateId" :disabled="isLoadingTemplates"
              class="form-select flex-grow cursor-pointer !mt-0">
              <option :value="null">{{ isLoadingTemplates ? 'Loading presets...' : 'Load a preset...' }}</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.template_name }}
              </option>
            </select>
            <button v-if="selectedTemplateId" @click="clearSelectedTemplate" class="btn text-xs"
              title="Clear selection">Clear</button>
          </div>

          <div v-if="selectedTemplateId" class="flex items-center gap-2">
            <button @click="handleUpdateTemplate" :disabled="!isMappingDirty || isLoadingTemplates"
              class="btn-primary flex-grow justify-center">
              <span v-if="!isMappingDirty">Preset Matched</span>
              <span v-else>Update "{{ selectedTemplateName }}"</span>
            </button>
            <button @click="handleDeleteTemplate" :disabled="isLoadingTemplates"
              class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting"
              title="Delete preset">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path fill-rule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.816 1.387 2.816 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.389 6.073a.75.75 0 01.389.676v8.178a.75.75 0 01-1.5 0v-8.178a.75.75 0 011.111-.676zm4.5 0a.75.75 0 01.676-.389h.001a.75.75 0 01.389.676v8.178a.75.75 0 01-1.5 0v-8.178a.75.75 0 01.75-.75z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div v-if="!selectedTemplateId || templates.length === 0"
            class="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 mt-3">
            <input name="newTemplateName" type="text" placeholder="Save current mapping as new preset..."
              v-model="newTemplateName" :disabled="isLoadingTemplates" class="form-input col-span-2 !mt-0" />
            <button @click="handleSaveNewTemplate" :disabled="!newTemplateName || isLoadingTemplates"
              class="btn-primary w-full">Save New</button>
          </div>
        </div>
      </div>
      <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-2">Manual Configuration</h3>

      <div class="space-y-3">
        <div class="space-y-2 rounded-md border border-slate-200 p-3">
          <label class="flex items-center gap-2">
            <input name="isGroupingEnabled" type="checkbox"
              :checked="mapping.isGroupingEnabled"
              @change="emit('update:mapping', { ...mapping, isGroupingEnabled: ($event.target as HTMLInputElement).checked })"
              class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /><span
              class="text-[13px] font-medium text-ink">Group rows into single invoices</span></label>
          <p class="text-[12px] text-slate-600">Use this if multiple rows in your file belong to the same invoice.</p>
          <label class="block pt-1">
            <div class="text-[12px] text-slate-500">Group by column <span class="text-red-500">*</span></div>
            <select name="sltGroupBy" class="form-select" :value="mapping.groupBy"
              @change="emit('update:mapping', { ...mapping, groupBy: ($event.target as HTMLSelectElement).value })"
              :disabled="!mapping.isGroupingEnabled">
              <option value="">-- No Grouping --</option>
              <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
            </select>
          </label>
        </div>

        <div>
          <h4 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-1 mt-3">Column Details</h4>
          <div class="overflow-hidden rounded-md border border-slate-200">
            <table class="w-full text-[13px]">
              <thead class="bg-slate-50 text-slate-600">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">Invoice field</th>
                  <th class="px-3 py-2 text-left font-semibold">Your file's column</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr>
                  <td class="px-3 py-2">Client Name <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select name="sltCustomer" class="form-select" :value="mapping.customer"
                      @change="emit('update:mapping', { ...mapping, customer: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Client Email</td>
                  <td class="px-3 py-2">
                    <select name="sltEmail" class="form-select" :value="mapping.email"
                      @change="emit('update:mapping', { ...mapping, email: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Item Name <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select name="sltDesc" class="form-select" :value="mapping.desc"
                      @change="emit('update:mapping', { ...mapping, desc: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Quantity <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select name="sltQty" class="form-select" :value="mapping.qty"
                      @change="emit('update:mapping', { ...mapping, qty: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Unit price <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select name="sltUnut" class="form-select" :value="mapping.unit"
                      @change="emit('update:mapping', { ...mapping, unit: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
