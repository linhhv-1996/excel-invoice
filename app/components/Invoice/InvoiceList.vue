// app/components/Invoice/InvoiceList.vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Invoice } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  invoices: Invoice[]
  selectedIndices: Set<number>
  areAllSelected: boolean
  isGroupingEnabled: boolean
  activeInvoiceIndex?: number | null | undefined
}>()

const emit = defineEmits([
    'viewDetails',
    'toggleSelect',
    'toggleSelectAll',
    'rowClick'
])

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n || 0))
  }
  catch {
    return String(n || 0)
  }
}

const handleSelectAllChange = (event: Event) => {
  emit('toggleSelectAll', (event.target as HTMLInputElement).checked);
}

const handleRowSelectChange = (invoiceIndex: number | undefined, event: Event) => {
   if (invoiceIndex !== undefined) {
       emit('toggleSelect', invoiceIndex);
   }
}

const isHeaderChecked = computed({
  get: () => props.areAllSelected,
  set: (value) => emit('toggleSelectAll', value)
});

const errorInvoiceCount = computed(() => {
  return props.invoices.filter(inv => inv.errors && inv.errors.length > 0).length;
});

const isHeaderIndeterminate = computed(() =>
    props.selectedIndices.size > 0 && props.selectedIndices.size < props.invoices.length
);

const onRowClick = (invoice: Invoice) => {
    emit('rowClick', invoice);
}

</script>


<template>
    <div class="rounded-xl border border-slate-200">
        <div class="flex select-none items-center justify-between px-3 py-2">
             <h2 class="text-[13px] font-semibold text-ink">2. Review & Select Invoices</h2>
        </div>
        <div class="p-3 pt-0">
             <p class="text-[12px] text-slate-600 mb-2">
                Showing {{ invoices.length }} {{ isGroupingEnabled ? 'grouped' : '' }} invoices.
                <span v-if="invoices.length > 0"> ({{ selectedIndices.size }} selected)</span>
             </p>
             <p v-if="errorInvoiceCount > 0" class="text-[12px] text-red-600 mb-2 font-medium">
                ⚠️ {{ errorInvoiceCount }} invoices are missing required info. Please check the mapping or Excel file.
             </p>
             <div class="max-h-[250px] overflow-y-auto rounded-xl border border-slate-200">

                <table class="w-full text-[13px]">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th class="w-10 px-3 py-2 text-left">
                                <input
                                    name="selectAll"
                                    type="checkbox"
                                    :checked="isHeaderChecked"
                                    :indeterminate="isHeaderIndeterminate"
                                    @change="handleSelectAllChange"
                                    class="h-4 w-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500"
                                    title="Select/Deselect All"
                                />
                            </th>
                            <th class="px-3 py-2 text-left">Client Name {{ isGroupingEnabled ? '(Grouped)' : '' }}</th>
                            <th class="px-3 py-2 text-left"># Items</th>
                            <th class="px-3 py-2 text-right">Total</th>
                            <th class="w-20 px-3 py-2 text-center">Details</th>
                        </tr>
                    </thead>
                    <tbody v-if="invoices.length > 0" class="divide-y divide-slate-200">
                        <tr v-for="(invoice) in invoices"
                            :key="invoice._index"
                            @click="onRowClick(invoice)"
                            class="cursor-pointer"
                            :class="{
                                'hover:bg-slate-50': invoice._index !== activeInvoiceIndex && !invoice.errors, // Chỉ hover thường nếu không lỗi
                                'bg-indigo-50 hover:bg-indigo-100': invoice._index === activeInvoiceIndex && !invoice.errors, // Active không lỗi
                                'bg-red-50 hover:bg-red-100': invoice.errors && invoice.errors.length > 0, // Dòng lỗi
                                'bg-red-100 hover:bg-red-200': invoice.errors && invoice.errors.length > 0 && invoice._index === activeInvoiceIndex // Active và lỗi
                            }">
                            <td class="px-3 py-2">
                                <input
                                    name="selectItem"
                                    type="checkbox"
                                    :checked="selectedIndices.has(invoice._index!)"
                                    @change.stop="handleRowSelectChange(invoice._index, $event)"
                                    class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    :disabled="invoice.errors && invoice.errors.length > 0"  
                                    :title="invoice.errors && invoice.errors.length > 0 ? 'Cannot select: Missing required info' : 'Select this invoice'"
                                />
                            </td>
                            <td class="px-3 py-2 font-medium text-ink flex items-center">
                                 <span v-if="invoice.errors && invoice.errors.length > 0"
                                      class="mr-1.5 text-red-500"
                                      :title="`Missing: ${invoice.errors.join(', ')}`">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                         <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                                     </svg>
                                 </span>
                                 {{ invoice.customer }}
                            </td>
                            <td class="px-3 py-2">{{ invoice.lines.length }}</td>
                            <td class="px-3 py-2 text-right">{{ fmtMoney(invoice.lines.reduce((acc, line) => acc + line.total, 0)) }}</td>
                            <td class="px-3 py-2 text-center">
                                <button class="text-slate-500 hover:text-indigo-600 view-details-btn" @click.stop="$emit('viewDetails', invoice)"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                         <tr>
                              <td colspan="5" class="p-4 text-center text-slate-500 text-sm">No invoices generated yet. Check your mapping settings.</td>
                         </tr>
                    </tbody>
                </table>

             </div>
        </div>
    </div>
</template>

