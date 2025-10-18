<script setup lang="ts">
import type { Invoice, Settings } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  invoice: Invoice | null
  settings: Settings
}>()

const emit = defineEmits(['fullscreen'])

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat(props.settings.locale || 'en-US', { style: 'currency', currency: props.settings.currency || 'USD' }).format(Number(n || 0))
  }
  catch {
    return String(n || 0)
  }
}

const subtotal = computed(() => props.invoice?.lines.reduce((acc, line) => acc + line.total, 0) || 0)
const taxAmount = computed(() => (subtotal.value * (props.settings.taxPercent || 0)) / 100)
const total = computed(() => subtotal.value + taxAmount.value)

</script>

<template>
    <div>
        <div class="mb-2 flex items-center justify-between">
            <h3 id="preview-title" class="text-[13px] font-semibold text-ink">
                Preview ({{ invoice?.customer || 'No Selection' }})
            </h3>
            <button @click="$emit('fullscreen')" id="fullscreen-preview-btn" class="text-slate-400 hover:text-slate-600" title="Full-screen preview"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg></button>
        </div>

        <div id="preview-content" class="rounded-xl border border-slate-200">
            <div v-if="invoice" class="p-4">
                <div v-if="settings.template === 'modern'">
                     <div class="flex items-start justify-between">
                        <div class="text-[15px] font-semibold text-ink">{{ settings.cName }}</div>
                        <div class="text-right text-[12px]">
                            <div class="font-semibold">INVOICE</div>
                            <div>#{{ invoice.invoiceNo }}</div>
                        </div>
                    </div>
                    <div class="mt-3 flex justify-between text-[12px]">
                        <div>
                            <div class="font-medium text-slate-700">Bill To</div>
                            <div>{{ invoice.customer }}</div>
                            <div>{{ invoice.email }}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-medium text-slate-700">From</div>
                            <div>{{ settings.cName }}</div>
                        </div>
                    </div>
                    </div>
                <div v-if="settings.template === 'classic'" class="font-serif">
                     <div class="text-center">
                        <div class="text-2xl font-bold">{{ settings.cName }}</div>
                        <div class="text-xs text-slate-500">{{ settings.cAddr }}</div>
                     </div>
                     <div class="my-6 h-px bg-slate-200"></div>
                     <div class="flex justify-between">
                        <div>
                             <div class="text-xs text-slate-500">Billed to</div>
                             <div class="font-bold">{{ invoice.customer }}</div>
                        </div>
                        <div class="text-right">
                             <div class="text-xs">Invoice #: <span class="font-semibold">{{ invoice.invoiceNo }}</span></div>
                             <div class="text-xs">Date: {{ new Date().toLocaleDateString(settings.locale) }}</div>
                        </div>
                     </div>
                    </div>
                 <div v-if="settings.template === 'technical'" class="font-mono text-xs">
                    <p class="text-base text-slate-500">// INVOICE DOCUMENT</p>
                    <div class="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-slate-500">[SENDER]</p>
                            <p>{{ settings.cName }}</p>
                            <p>{{ settings.cAddr }}</p>
                        </div>
                         <div class="text-right">
                            <p>INV_ID: {{ invoice.invoiceNo }}</p>
                            <p>DATE:   {{ new Date().toLocaleDateString(settings.locale) }}</p>
                        </div>
                    </div>
                     <div class="mt-4">
                        <p class="text-slate-500">[RECIPIENT]</p>
                        <p>{{ invoice.customer }}</p>
                        <p>{{ invoice.email }}</p>
                    </div>
                </div>
                 <div v-if="settings.template === 'elegant'" class="flex font-serif">
                    <div class="w-40 flex-shrink-0 bg-slate-50 p-4 -m-4 mr-4">
                         <h2 class="text-base font-bold text-indigo-800">{{ settings.cName }}</h2>
                         <p class="text-xs text-slate-500 mt-2">{{ settings.cAddr }}</p>
                         <div class="mt-12">
                             <p class="text-xs font-bold text-slate-500">INVOICE TO</p>
                             <p class="font-bold">{{ invoice.customer }}</p>
                             <p class="text-xs text-slate-500">{{ invoice.email }}</p>
                         </div>
                    </div>
                    <div class="flex-grow">
                        <h1 class="text-3xl font-bold text-slate-800">INVOICE</h1>
                        <p class="text-xs text-slate-500 mt-2">Invoice #{{ invoice.invoiceNo }}</p>
                        <p class="text-xs text-slate-500">Date: {{ new Date().toLocaleDateString(settings.locale) }}</p>

                        <div class="mt-6 border-t-2 border-indigo-800 pt-2">
                             <div v-for="(line, i) in invoice.lines" :key="i" class="flex justify-between py-3 border-b border-slate-100">
                                 <div>
                                     <p class="font-semibold">{{ line.desc }}</p>
                                     <p class="text-xs text-slate-500">{{ line.qty }} x {{ fmtMoney(line.unit) }}</p>
                                 </div>
                                 <p class="font-semibold">{{ fmtMoney(line.total) }}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div v-if="['modern', 'classic'].includes(settings.template)" class="mt-4 overflow-hidden rounded-lg border border-slate-200">
                    <table class="w-full text-[12px]">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-3 py-2 text-left font-medium">Item</th>
                                <th class="px-3 py-2 text-right font-medium">Qty</th>
                                <th class="px-3 py-2 text-right font-medium">Price</th>
                                <th class="px-3 py-2 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            <tr v-for="(line, i) in invoice.lines" :key="i">
                                <td class="px-3 py-2">{{ line.desc }}</td>
                                <td class="px-3 py-2 text-right">{{ line.qty }}</td>
                                <td class="px-3 py-2 text-right">{{ fmtMoney(line.unit) }}</td>
                                <td class="px-3 py-2 text-right font-medium">{{ fmtMoney(line.total) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="['modern', 'classic', 'technical'].includes(settings.template)" class="mt-3 flex justify-end">
                    <div class="w-full max-w-xs text-[13px]">
                        <div class="flex justify-between py-1"><span>Subtotal</span><span>{{ fmtMoney(subtotal) }}</span></div>
                        <div v-if="settings.taxPercent > 0" class="flex justify-between py-1"><span>Tax ({{ settings.taxPercent }}%)</span><span>{{ fmtMoney(taxAmount) }}</span></div>
                        <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-ink"><span>Total</span><span>{{ fmtMoney(total) }}</span></div>
                    </div>
                </div>

                 <div v-if="settings.template === 'elegant'" class="mt-3 flex justify-end">
                     <div class="w-64 text-sm">
                        <div class="flex justify-between py-1">
                            <span class="text-slate-500">Subtotal</span>
                            <span>{{ fmtMoney(subtotal) }}</span>
                        </div>
                         <div v-if="settings.taxPercent > 0" class="flex justify-between py-1">
                            <span class="text-slate-500">Tax ({{ settings.taxPercent }}%)</span>
                            <span>{{ fmtMoney(taxAmount) }}</span>
                        </div>
                        <div class="mt-2 flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold">
                            <span>Total Due</span>
                            <span>{{ fmtMoney(total) }}</span>
                        </div>
                     </div>
                 </div>


            </div>
            <div v-else class="text-center text-slate-500 py-10 text-sm">
                Upload a file and map columns to see a preview.
            </div>
        </div>
    </div>
</template>
