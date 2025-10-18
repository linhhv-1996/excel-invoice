<script setup lang="ts">
import type { Invoice } from '~/composables/useInvoiceGenerator'
defineProps<{ invoices: Invoice[] }>()
defineEmits(['viewDetails'])

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n || 0))
  }
  catch {
    return String(n || 0)
  }
}
</script>
<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2"><h2 class="text-[13px] font-semibold text-ink">2. Review & Select Invoices</h2></div>
        <div class="p-3 pt-0">
            <p class="text-[12px] text-slate-600 mb-2">Showing {{ invoices.length }} grouped invoices.</p>
            <div class="overflow-hidden rounded-xl border border-slate-200">
                <table class="w-full text-[13px]">
                    <thead class="bg-slate-50 text-slate-600"><tr><th class="w-10 px-3 py-2 text-left"><input type="checkbox" checked /></th><th class="px-3 py-2 text-left">Client Name (Grouped)</th><th class="px-3 py-2 text-left"># Items</th><th class="px-3 py-2 text-right">Total</th><th class="w-20 px-3 py-2 text-center">Details</th></tr></thead>
                    <tbody class="divide-y divide-slate-200">
                        <tr v-for="(invoice, index) in invoices.slice(0, 5)" :key="index" :class="{'bg-slate-100': index === 0, 'hover:bg-slate-50': index > 0}">
                            <td class="px-3 py-2"><input type="checkbox" checked class="h-4 w-4 rounded border-slate-300 text-indigo-600"/></td>
                            <td class="px-3 py-2 font-medium text-ink cursor-pointer">{{ invoice.customer }}</td>
                            <td class="px-3 py-2 cursor-pointer">{{ invoice.lines.length }}</td>
                            <td class="px-3 py-2 text-right cursor-pointer">{{ fmtMoney(invoice.lines.reduce((acc, line) => acc + line.total, 0)) }}</td>
                            <td class="px-3 py-2 text-center"><button class="text-slate-500 hover:text-indigo-600 view-details-btn" @click="$emit('viewDetails', invoice)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg></button></td>
                        </tr>
                    </tbody>
                </table>
                 <div v-if="invoices.length > 5" class="p-2 text-xs text-center text-slate-500">... and {{ invoices.length - 5 }} more</div>
            </div>
        </div>
    </div>
</template>
