<script setup lang="ts">
import type { Mapping } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  headers: string[]
  mapping: Mapping
}>()

const emit = defineEmits(['update:mapping'])

const localMapping = computed({
  get: () => props.mapping,
  set: (value) => {
    emit('update:mapping', value)
  },
})

const requiredFields: (keyof Mapping)[] = ['customer', 'desc', 'qty', 'unit']
</script>

<template>
  <div class="card p-4 mt-3">
    <h2 class="text-sm font-bold">
      Map Columns
    </h2>
    <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <div v-for="field in Object.keys(localMapping)" :key="field" :class="{ 'md:col-span-2': field === 'groupBy' }">
        <label class="text-xs font-medium capitalize">
          {{ field.replace(/([A-Z])/g, ' $1').trim() }}
          <span v-if="requiredFields.includes(field as keyof Mapping)" class="text-red-500">*</span>
        </label>
        <select v-model="localMapping[field as keyof Mapping]" class="select mt-1">
          <option value="">
            -- select column --
          </option>
          <option v-for="header in headers" :key="header" :value="header">
            {{ header }}
          </option>
        </select>
        <p v-if="field === 'groupBy'" class="mt-1 text-xs text-slate-500">
          Tip: Split invoices with an additional key (e.g., Order ID, Project), not only by customer.
        </p>
      </div>
    </div>
  </div>
</template>
