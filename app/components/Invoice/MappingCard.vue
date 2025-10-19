<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue'
import type { Mapping } from '~/composables/useInvoiceGenerator'
import { useUserProfile } from '~/composables/useUserProfile'
import { useNotification } from '~/composables/useNotification'
import { useMappingTemplates, type MappingTemplate } from '~/composables/useMappingTemplates'

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

// Template gốc được tải để so sánh thay đổi
const originalLoadedTemplateConfig = ref<string>('') 
const isMappingDirty = ref(false)

// --- Lifecycle & Watchers ---
onMounted(() => {
  if (isPro.value) fetchTemplates()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && templates.value.length === 0) fetchTemplates()
})

// Tự động load template khi người dùng chọn từ dropdown
watch(selectedTemplateId, (newId) => {
  if (!newId) {
    originalLoadedTemplateConfig.value = ''
    return
  }
  proFeatureGuard(() => {
    const selected = templates.value.find(t => t.id === newId)
    if (selected) {
      // Deep clone mapping config để tránh thay đổi ngoài ý muốn
      const newMapping = { ...props.mapping, ...JSON.parse(JSON.stringify(selected.mapping_config)) }
      emit('update:mapping', newMapping)
      
      // Lưu lại bản gốc để so sánh
      originalLoadedTemplateConfig.value = JSON.stringify(newMapping)
      isMappingDirty.value = false
      showNotification(`Preset "${selected.template_name}" loaded!`)
    }
  })
})

// Theo dõi sự thay đổi của mapping so với template đã load để bật/tắt nút Update
watch(() => props.mapping, (newMapping) => {
  if (originalLoadedTemplateConfig.value) {
    const currentConfig = JSON.stringify(newMapping)
    isMappingDirty.value = originalLoadedTemplateConfig.value !== currentConfig
  } else {
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
  action();
  return true;
}

const handleSaveNewTemplate = async () => {
  if (!proFeatureGuard(() => {})) return;
  const success = await saveTemplate(newTemplateName.value, props.mapping)
  if (success) {
    showNotification(`Preset "${newTemplateName.value}" saved!`);
    // Tự động chọn preset vừa lưu
    const newSavedTemplate = templates.value.find(t => t.template_name === newTemplateName.value.trim());
    if (newSavedTemplate) {
      selectedTemplateId.value = newSavedTemplate.id;
    }
    newTemplateName.value = ''
  }
}

const handleUpdateTemplate = async () => {
  const selected = templates.value.find(t => t.id === selectedTemplateId.value);
  if (!selected) return;
  
  if (!proFeatureGuard(() => {})) return;

  const success = await saveTemplate(selected.template_name, props.mapping);
  if (success) {
    // Cập nhật lại bản gốc để so sánh
    originalLoadedTemplateConfig.value = JSON.stringify(props.mapping);
    isMappingDirty.value = false;
    showNotification(`Preset "${selected.template_name}" updated!`);
  }
}

const handleDeleteTemplate = async () => {
  const selected = templates.value.find(t => t.id === selectedTemplateId.value);
  if (!selected) return;

  showConfirm(
    'Delete Preset',
    `Are you sure you want to delete the "${selected.template_name}" preset? This action cannot be undone.`,
    () => {
      if (!proFeatureGuard(() => {})) return;
      
      deleteTemplate(selected.id).then(success => {
        if (success) {
          selectedTemplateId.value = null; // Bỏ chọn khỏi dropdown
        }
      });
    }
  );
}
</script>

<template>
  <div class="rounded-xl border border-slate-200">
    <div class="flex select-none items-center justify-between px-3 py-2">
      <h2 class="text-[13px] font-semibold text-ink">1. Data Mapping</h2>
    </div>
    <div class="p-3 pt-0">
      
      <div class="mb-4 rounded-md border border-slate-200 p-3 space-y-3">
        <div>
          <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 flex items-center">
            Preset Mappings
            <span class="pro-feature-badge ml-2">Pro</span>
          </h3>
        </div>

        <div v-if="isPro && templates.length === 0 && !isLoadingTemplates" class="bg-slate-50 text-center p-4 rounded-md text-sm text-slate-600">
          <p>You don't have any saved presets yet.</p>
          <p class="mt-1">Configure your mapping below, then save it here for future use!</p>
        </div>

        <div v-else class="flex items-center gap-2">
          <select v-model="selectedTemplateId" :disabled="!isPro || isLoadingTemplates" class="form-select-pro flex-grow cursor-pointer !mt-0">
            <option :value="null">{{ isPro ? 'Load a preset...' : 'Available for Pro' }}</option>
            <option v-if="isPro" v-for="template in templates" :key="template.id" :value="template.id">{{ template.template_name }}</option>
          </select>
          
          <template v-if="selectedTemplateId">
            <button @click="handleUpdateTemplate" :disabled="!isMappingDirty || isLoadingTemplates" class="btn-primary">
              {{ isMappingDirty ? 'Update' : 'Saved' }}
            </button>
            <button @click="handleDeleteTemplate" :disabled="isLoadingTemplates" class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting" title="Delete preset">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                <path fill-rule="evenodd" d="M9 2a2 2 0 0 0-2 2v2H3v2h1.1l1.2 13.4A2 2 0 0 0 7.3 24h9.4a2 2 0 0 0 2-2.6L19.9 8H21V6h-4V4a2 2 0 0 0-2-2H9Zm2 5v12a1 1 0 1 1-2 0V7h2Zm4 0v12a1 1 0 1 1-2 0V7h2Z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </template>
        </div>

        <div class="border-t border-slate-200 my-2"></div>
        <div class="grid grid-cols-3 gap-2">
          <input type="text" placeholder="Save current mapping as new preset..." v-model="newTemplateName" :disabled="!isPro || isLoadingTemplates" class="form-input col-span-2 !mt-0" />
          <button @click="handleSaveNewTemplate" :disabled="!newTemplateName || isLoadingTemplates" class="btn-primary w-full">Save New</button>
        </div>
      </div>

      <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-2">Manual Configuration</h3>

      <div class="space-y-3">
        <div class="space-y-2 rounded-md border border-slate-200 p-3">
          <label class="flex items-center gap-2"><input type="checkbox" :checked="mapping.isGroupingEnabled"
              @change="emit('update:mapping', { ...mapping, isGroupingEnabled: ($event.target as HTMLInputElement).checked })"
              class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /><span
              class="text-[13px] font-medium text-ink">Group rows into single invoices</span></label>
          <p class="text-[12px] text-slate-600">Use this if multiple rows in your file belong to the same invoice.</p>
          <label class="block pt-1">
            <div class="text-[12px] text-slate-500">Group by column <span class="text-red-500">*</span></div>
            <select class="form-select" :value="mapping.groupBy"
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
                    <select class="form-select" :value="mapping.customer"
                      @change="emit('update:mapping', { ...mapping, customer: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Client Email</td>
                  <td class="px-3 py-2">
                    <select class="form-select" :value="mapping.email"
                      @change="emit('update:mapping', { ...mapping, email: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Item Name <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select class="form-select" :value="mapping.desc"
                      @change="emit('update:mapping', { ...mapping, desc: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Quantity <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select class="form-select" :value="mapping.qty"
                      @change="emit('update:mapping', { ...mapping, qty: ($event.target as HTMLSelectElement).value })">
                      <option value="">-- Select Column --</option>
                      <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="px-3 py-2">Unit price <span class="text-red-500">*</span></td>
                  <td class="px-3 py-2">
                    <select class="form-select" :value="mapping.unit"
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
