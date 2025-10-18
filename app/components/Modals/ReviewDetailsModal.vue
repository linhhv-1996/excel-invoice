<script setup lang="ts">
import type { Invoice } from '~/composables/useInvoiceGenerator'

defineProps<{ show: boolean, invoice: Invoice | null }>()
const emit = defineEmits(['close'])

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n || 0))
  }
  catch { return String(n || 0) }
}
</script>
<template>
    <div v-if="show" class="modal-backdrop p-4">
        <div class="w-full max-w-2xl rounded-xl bg-white p-0 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 id="review-details-title" class="text-lg font-semibold text-ink">Details for: {{ invoice?.customer }}</h2>
                <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div v-if="invoice" class="p-4">
                <div class="max-h-[60vh] overflow-y-auto">
                    <table class="w-full text-sm">
                        <thead class="text-left bg-slate-50">
                            <tr>
                                <th class="p-2 font-semibold">Item Name</th>
                                <th class="p-2 font-semibold text-right">Quantity</th>
                                <th class="p-2 font-semibold text-right">Unit Price</th>
                                <th class="p-2 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(line, i) in invoice.lines" :key="i" class="border-b">
                                <td class="p-2">{{ line.desc }}</td>
                                <td class="p-2 text-right">{{ line.qty }}</td>
                                <td class="p-2 text-right">{{ fmtMoney(line.unit) }}</td>
                                <td class="p-2 text-right font-medium">{{ fmtMoney(line.total) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 rounded-b-xl">
                <button @click="$emit('close')" class="btn">Close</button>
            </div>
        </div>
    </div>
</template>
