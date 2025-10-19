<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { inject } from 'vue';
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
const { isPro, isLoadingProfile } = useUserProfile()
const { showNotification } = useNotification()
const { templates, isLoading: isLoadingTemplates, fetchTemplates, saveTemplate, deleteTemplate } = useMappingTemplates()

const newTemplateName = ref('')
const selectedTemplateId = ref<number | null>(null)

// Template hiện tại đang được "active" để chỉnh sửa
const activeTemplate = ref<MappingTemplate | null>(null)
// Cờ báo hiệu có thay đổi so với template đã load
const isMappingDirty = ref(false)

// Tải danh sách template ban đầu
onMounted(() => {
  if (isPro.value) fetchTemplates()
})
watch(isPro, (isUserPro) => {
  if (isUserPro && templates.value.length === 0) fetchTemplates()
})

// Theo dõi sự thay đổi của mapping so với template đã load
watch(() => props.mapping, (newMapping) => {
  if (activeTemplate.value) {
    const originalConfig = JSON.stringify(activeTemplate.value.mapping_config)
    const currentConfig = JSON.stringify(newMapping)
    isMappingDirty.value = originalConfig !== currentConfig
  }
}, { deep: true })


// Khi người dùng chọn một template khác trong dropdown, reset về trạng thái "Load"
watch(selectedTemplateId, (newId) => {
  if (activeTemplate.value && activeTemplate.value.id !== newId) {
    activeTemplate.value = null;
    isMappingDirty.value = false;
  }
})

// --- Các hàm xử lý hành động ---

const proFeatureGuard = (action: Function) => {
  if (!user.value) {
    showNotification('Please log in to use Pro features.');
    return navigateTo('/login');
  }
  if (!isPro.value) {
    return emit('openUpgradeModal');
  }
  action();
}

const handleSaveNewTemplate = async () => {
  proFeatureGuard(async () => {
    const success = await saveTemplate(newTemplateName.value, props.mapping)
    if (success) {
      showNotification(`Template "${newTemplateName.value}" saved!`);
      newTemplateName.value = ''
      // Tùy chọn: Tự động chọn template vừa lưu
      const newSavedTemplate = templates.value.find(t => t.template_name === newTemplateName.value.trim());
      if (newSavedTemplate) {
        selectedTemplateId.value = newSavedTemplate.id;
        activeTemplate.value = newSavedTemplate;
      }
    }
  })
}

const handleUpdateTemplate = async () => {
  if (!activeTemplate.value) return;
  proFeatureGuard(async () => {
    const success = await saveTemplate(activeTemplate.value!.template_name, props.mapping);
    if (success) {
      isMappingDirty.value = false;
      const updatedTemplate = templates.value.find(t => t.id === activeTemplate.value!.id);
      if (updatedTemplate) activeTemplate.value = JSON.parse(JSON.stringify(updatedTemplate));
      showNotification(`Template "${updatedTemplate?.template_name}" updated!`);
    }
  });
}

const handleLoadTemplate = () => {
  proFeatureGuard(() => {
    const selected = templates.value.find(t => t.id === selectedTemplateId.value)
    if (selected) {
      emit('update:mapping', { ...props.mapping, ...selected.mapping_config })
      activeTemplate.value = JSON.parse(JSON.stringify(selected));
      isMappingDirty.value = false;
      showNotification(`Template "${selected.template_name}" loaded!`)
    }
  })
}

const handleDeleteTemplate = async () => {
  if (!activeTemplate.value) return;

  showConfirm(
        'Delete Template',
        `Are you sure you want to delete the "${activeTemplate.value.template_name}" template? This action cannot be undone.`,
        () => {
            // Logic xóa chỉ chạy khi người dùng nhấn "Confirm" trên modal
            proFeatureGuard(async () => {
                const success = await deleteTemplate(activeTemplate.value!.id);
                if (success) {
                    activeTemplate.value = null;
                    selectedTemplateId.value = null;
                    isMappingDirty.value = false;
                }
            });
        }
    );
}

</script>

<template>
  <div class="rounded-xl border border-slate-200">
    <div class="flex select-none items-center justify-between px-3 py-2">
      <h2 class="text-[13px] font-semibold text-ink">1. Mapping & Grouping</h2>
    </div>
    <div class="p-3 pt-0">
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
      <div class="mt-3">
        <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-1">Column Mapping</h3>
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

      <div class="mt-3 rounded-md border border-slate-200 p-3 space-y-3">
        <div>
          <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 flex items-center">
            Mapping Templates
            <span class="pro-feature-badge ml-2">Pro</span>
          </h3>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <select v-model="selectedTemplateId" :disabled="!isPro || isLoadingTemplates"
            class="form-select-pro col-span-2 cursor-pointer !mt-0">
            <option :value="null" disabled>{{ isPro ? 'Select a template...' : 'Available for Pro' }}</option>
            <option v-if="isPro" v-for="template in templates" :key="template.id" :value="template.id">{{
              template.template_name }}</option>
          </select>

          <div v-if="activeTemplate && activeTemplate.id === selectedTemplateId" class="flex gap-2">
            <button @click="handleUpdateTemplate" :disabled="!isMappingDirty || isLoadingTemplates"
              class="btn-primary w-full">
              {{ isMappingDirty ? 'Update' : 'Saved' }}
            </button>
            <button @click="handleDeleteTemplate" :disabled="isLoadingTemplates"
              class="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-2 btnDeleteSetting" title="Delete template">

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                <path fill-rule="evenodd"
                  d="M9 2a2 2 0 0 0-2 2v2H3v2h1.1l1.2 13.4A2 2 0 0 0 7.3 24h9.4a2 2 0 0 0 2-2.6L19.9 8H21V6h-4V4a2 2 0 0 0-2-2H9Zm2 5v12a1 1 0 1 1-2 0V7h2Zm4 0v12a1 1 0 1 1-2 0V7h2Z"
                  clip-rule="evenodd" />
              </svg>

            </button>
          </div>
          <button v-else @click="handleLoadTemplate" :disabled="!selectedTemplateId || isLoadingTemplates"
            class="btn w-full">
            Load
          </button>
        </div>

        <div class="border-t border-slate-200 my-2"></div>

        <div class="grid grid-cols-3 gap-2">
          <input type="text" placeholder="Save current as new template..." v-model="newTemplateName"
            :disabled="!isPro || isLoadingTemplates" class="form-input col-span-2 !mt-0" />
          <button @click="handleSaveNewTemplate" :disabled="!newTemplateName || isLoadingTemplates"
            class="btn w-full">Save New</button>
        </div>
      </div>
    </div>
  </div>
</template>
