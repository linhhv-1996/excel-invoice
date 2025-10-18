<script setup lang="ts">
import type { Mapping } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  headers: string[]
  mapping: Mapping
}>()

const emit = defineEmits(['update:mapping', 'openUpgradeModal'])

const localMapping = computed({
  get: () => props.mapping,
  set: (value) => {
    emit('update:mapping', value)
  },
})
</script>
<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2">
            <h2 class="text-[13px] font-semibold text-ink">1. Mapping & Grouping</h2>
        </div>
        <div class="p-3 pt-0">
            <div id="mapping-template-section" class="mb-3 rounded-md border border-slate-200 p-3">
                <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Mapping Templates <span class="pro-feature-badge">Pro</span></h3>
                <div class="mt-2 grid grid-cols-3 gap-2">
                    <select id="mapping-template-select" class="form-select-pro col-span-3 md:col-span-2 pro-feature-trigger cursor-pointer" @click.prevent="$emit('openUpgradeModal')"><option>Load saved template...</option></select>
                    <div class="col-span-3 md:col-span-1 flex gap-2">
                        <button id="load-template-btn" class="btn w-full pro-feature-trigger" @click.prevent="$emit('openUpgradeModal')">Load</button>
                        <button id="save-template-btn" class="btn w-full pro-feature-trigger" @click.prevent="$emit('openUpgradeModal')">Save</button>
                    </div>
                </div>
            </div>

            <div class="space-y-2 rounded-md border border-slate-200 p-3">
                <label class="flex items-center gap-2"><input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked/><span class="text-[13px] font-medium text-ink">Group rows into single invoices</span></label>
                <p class="text-[12px] text-slate-600">Use this if multiple rows in your file belong to the same invoice.</p>
                <label class="block pt-1">
                    <div class="text-[12px] text-slate-500">Group by column <span class="text-red-500">*</span></div>
                    <select class="form-select" v-model="localMapping.groupBy">
                         <option value="">-- No Grouping --</option>
                         <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                    </select>
                </label>
            </div>

            <div class="mt-3">
                <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-1">Column Mapping</h3>
                <div class="overflow-hidden rounded-md border border-slate-200">
                    <table class="w-full text-[13px]">
                        <thead class="bg-slate-50 text-slate-600"><tr><th class="px-3 py-2 text-left font-semibold">Invoice field</th><th class="px-3 py-2 text-left font-semibold">Your file's column</th></tr></thead>
                        <tbody class="divide-y divide-slate-200">
                            <tr><td class="px-3 py-2">Client Name <span class="text-red-500">*</span></td><td class="px-3 py-2">
                                <select class="form-select" v-model="localMapping.customer">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                </select>
                            </td></tr>
                             <tr><td class="px-3 py-2">Client Email</td><td class="px-3 py-2">
                                <select class="form-select" v-model="localMapping.email">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                </select>
                            </td></tr>
                            <tr><td class="px-3 py-2">Item Name <span class="text-red-500">*</span></td><td class="px-3 py-2">
                                <select class="form-select" v-model="localMapping.desc">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                </select>
                            </td></tr>
                            <tr><td class="px-3 py-2">Quantity <span class="text-red-500">*</span></td><td class="px-3 py-2">
                                <select class="form-select" v-model="localMapping.qty">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                </select>
                            </td></tr>
                            <tr><td class="px-3 py-2">Unit price <span class="text-red-500">*</span></td><td class="px-3 py-2">
                                <select class="form-select" v-model="localMapping.unit">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
                                </select>
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>
