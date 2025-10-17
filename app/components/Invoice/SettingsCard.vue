<script setup lang="ts">
import type { Settings } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  settings: Settings
}>()
const emit = defineEmits(['update:settings', 'save'])

const localSettings = computed({
  get: () => props.settings,
  set: (value) => {
    emit('update:settings', value)
  },
})

const saveBtnText = ref('Save Settings')
const saveBtnClass = ref('btn-outline')

const onSave = () => {
  emit('save')
  saveBtnText.value = 'Saved!'
  saveBtnClass.value = 'btn-primary'
  setTimeout(() => {
    saveBtnText.value = 'Save Settings'
    saveBtnClass.value = 'btn-outline'
  }, 2000)
}
</script>

<template>
  <div class="card p-4 mt-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-bold">
        Invoice Settings
      </h2>
      <button :class="['btn', saveBtnClass]" @click="onSave">
        {{ saveBtnText }}
      </button>
    </div>
    <div class="mt-3 grid grid-cols-1 gap-3">
      <div>
        <label class="text-xs font-medium">Company name</label>
        <input v-model="localSettings.cName" type="text" class="input mt-1" placeholder="e.g., ACME Co.">
      </div>
      <div>
        <label class="text-xs font-medium">Address / Notes</label>
        <textarea v-model="localSettings.cAddr" rows="2" class="textarea mt-1" placeholder="Address or payment notes" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-medium">Tax ID (optional)</label>
          <input v-model="localSettings.cTax" type="text" class="input mt-1">
        </div>
        <div>
          <label class="text-xs font-medium">Currency</label>
          <select v-model="localSettings.currency" class="select mt-1">
            <option value="USD">
              USD ($)
            </option>
            <option value="EUR">
              EUR (€)
            </option>
            <option value="VND">
              VND (₫)
            </option>
          </select>
        </div>
      </div>
      <div>
        <label class="text-xs font-medium">Template</label>
        <select v-model="localSettings.template" class="select mt-1">
          <option value="modern">
            Modern
          </option>
          <option value="classic">
            Classic
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
