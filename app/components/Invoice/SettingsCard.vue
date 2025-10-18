<script setup lang="ts">
import type { Settings } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  settings: Settings
}>()
const emit = defineEmits(['update:settings', 'openUpgradeModal'])

const localSettings = computed({
  get: () => props.settings,
  set: (value) => {
    emit('update:settings', value)
  },
})
</script>

<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2"><h2 class="text-[13px] font-semibold text-ink">3. Output & Style Settings</h2></div>
        <div class="p-3 pt-0">
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
                    <div><div class="text-[12px] text-slate-500">Your Logo</div><input type="file" class="form-input file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[12px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"/></div>
                    <div class="pt-2">
                        <button class="btn-pro !py-1.5 w-full pro-feature-trigger" @click.prevent="$emit('openUpgradeModal')">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 mr-1.5"><path fill-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V2.5A.75.75 0 0 1 8 1.75Zm.89 5.03A.75.75 0 0 1 9.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.86-.72ZM5.75 7.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm.86 3.22a.75.75 0 0 1 1.04-.22l.4.3a.75.75 0 0 1-1.04 1.08l-.4-.3a.75.75 0 0 1 .02-1.06ZM10.5 10a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" /><path d="M6 5.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 5.25Zm0 5.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75Z" /><path fill-rule="evenodd" d="M3 1.75C3 .784 3.784 0 4.75 0h6.5C12.216 0 13 .784 13 1.75v12.5c0 .966-.784 1.75-1.75 1.75h-6.5C3.784 16 3 15.216 3 14.25V1.75Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-6.5Z" clip-rule="evenodd" /></svg>
                            Save and Reuse Profile (Pro)
                        </button>
                    </div>
                </div>

                <div class="col-span-2 space-y-2 pt-3 mt-3 border-t border-slate-200">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Template</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                         <button
                          @click="localSettings.template = 'modern'"
                          class="group overflow-hidden rounded-md p-2 text-left text-[12px]"
                          :class="localSettings.template === 'modern' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'"
                        >
                            <InvoiceTemplateThumbnail template="modern" />
                            <div class="mt-1 font-medium text-ink">Modern</div>
                        </button>
                         <button
                          @click="localSettings.template = 'classic'"
                          class="group overflow-hidden rounded-md p-2 text-left text-[12px]"
                          :class="localSettings.template === 'classic' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'"
                        >
                            <InvoiceTemplateThumbnail template="classic" />
                            <div class="mt-1 font-medium">Classic</div>
                        </button>
                         <button
                          @click="localSettings.template = 'technical'"
                          class="group overflow-hidden rounded-md p-2 text-left text-[12px]"
                          :class="localSettings.template === 'technical' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'"
                        >
                            <InvoiceTemplateThumbnail template="technical" />
                            <div class="mt-1 font-medium">Technical</div>
                        </button>
                         <button
                          @click="localSettings.template = 'elegant'"
                          class="group overflow-hidden rounded-md p-2 text-left text-[12px]"
                          :class="localSettings.template === 'elegant' ? 'border-2 border-indigo-500' : 'border border-slate-200 hover:border-ink'"
                        >
                            <InvoiceTemplateThumbnail template="elegant" />
                            <div class="mt-1 font-medium">Elegant</div>
                        </button>
                    </div>
                </div>
                <div class="col-span-2 space-y-2 pt-3 mt-3 border-t border-slate-200">
                    <h3 class="text-[12px] font-medium uppercase tracking-wide text-slate-500">Document Settings</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <label><div class="text-[12px] text-slate-500">File name pattern</div>
                            <input v-model="localSettings.fileNamePattern" class="form-input" />
                        </label>
                        <label><div class="text-[12px] text-slate-500">Starting Invoice Number</div>
                            <input v-model="localSettings.startInvoiceNumber" class="form-input" />
                        </label>
                        <label><div class="text-[12px] text-slate-500">Currency</div>
                            <select v-model="localSettings.currency" class="form-select">
                                <option>USD</option><option>EUR</option><option>VND</option>
                            </select>
                        </label>
                        <label><div class="text-[12px] text-slate-500">Locale</div>
                            <select v-model="localSettings.locale" class="form-select">
                                <option>en-US</option><option>en-GB</option><option>vi-VN</option>
                            </select>
                        </label>
                        <label class="col-span-2"><div class="text-[12px] text-slate-500">Global Tax % (Optional)</div>
                            <input v-model.number="localSettings.taxPercent" type="number" class="form-input" placeholder="e.g., 10" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
