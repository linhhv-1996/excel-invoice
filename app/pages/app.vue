<script setup lang="ts">
import { useInvoiceGenerator } from '~/composables/useInvoiceGenerator'
import { useDb } from '~/composables/useDb'
import { useExcelData } from '~/composables/useSharedState'
import { useFileUploader } from '~/composables/useFileUploader';

const { rawRows, fileName } = useExcelData()
const { loadSession } = useDb()
const router = useRouter()
const { triggerFileInput } = useFileUploader(); // Lấy hàm trigger

const isLoading = ref(true)

onMounted(async () => {
  const session = await loadSession()
  if (session && session.rawRows.length > 0) {
    rawRows.value = session.rawRows
    fileName.value = session.fileName
  } else {
    await router.push('/')
  }
  isLoading.value = false
})

const {
  state,
  headers,
  invoices,
  firstInvoice,
} = useInvoiceGenerator()

const showUpgradeModal = ref(false)
const showDetailsModal = ref(false)
const selectedInvoiceForDetails = ref(null)

function viewDetails(invoice: any) {
  if (!invoice) return;
  selectedInvoiceForDetails.value = invoice
  showDetailsModal.value = true
}

function changeFile() {
  triggerFileInput();
}
</script>

<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center bg-white">
    <p class="text-slate-500">Loading session...</p>
  </div>

  <div v-else-if="rawRows.length > 0" class="min-h-full bg-white text-slate-900">
    <AppHeader
      :is-preview-ready="invoices.length > 0"
      :export-count="invoices.length"
      @change-file="changeFile"
      @export="() => showUpgradeModal = true"
    />

    <div class="mx-auto max-w-5xl px-3">
        <div class="flex flex-wrap items-center gap-2 py-2 text-[12px]">
            <span class="chip">📄 <strong class="font-medium">{{ state.fileName }}</strong></span>
            <span class="chip">🔢 Rows: <strong class="font-medium">{{ state.rawRows.length }}</strong></span>
            <span v-if="state.mapping.groupBy && state.mapping.groupBy !=='-- No Grouping --'" class="chip">🗂️ Grouping: <strong class="font-medium">{{ state.mapping.groupBy }}</strong></span>
        </div>
    </div>
    <main class="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-3 py-5 md:grid-cols-5 md:gap-5">
      <section class="space-y-3 md:col-span-3">
        <InvoiceMappingCard
          v-model:mapping="state.mapping"
          :headers="headers"
          @open-upgrade-modal="showUpgradeModal = true"
        />
        <InvoiceList :invoices="invoices" @view-details="viewDetails"/>
        <InvoiceSettingsCard
          v-model:settings="state.settings"
          @open-upgrade-modal="showUpgradeModal = true"
        />
      </section>

      <aside class="relative md:col-span-2">
          <div id="preview-sticky-container" class="sticky top-20 space-y-3">
              <InvoicePreview
              class="rounded-xl border border-slate-200 px-3 py-2"
                :invoice="firstInvoice"
                :settings="state.settings"
                @fullscreen="viewDetails(firstInvoice)"
              />
               <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="flex items-center justify-between"><label for="watermark" class="text-[13px] font-medium text-slate-700">Show Watermark</label><input type="checkbox" id="watermark" checked disabled class="h-4 w-4 rounded border-slate-300 text-slate-400 focus:ring-slate-400" /></div>
                  <p class="mt-1 text-[12px] text-slate-500">Upgrade to remove the "Excel → Invoice" watermark.</p>
              </div>
          </div>
      </aside>
    </main>

    <ModalsUpgradeModal :show="showUpgradeModal" @close="showUpgradeModal = false" />
    <ModalsReviewDetailsModal :show="showDetailsModal" :invoice="selectedInvoiceForDetails" @close="showDetailsModal = false"/>
    <AppNotification />
  </div>
</template>
