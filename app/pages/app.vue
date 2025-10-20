<script setup lang="ts">
import { useInvoiceGenerator } from '~/composables/useInvoiceGenerator'
import { useDb } from '~/composables/useDb'
import { useExcelData } from '~/composables/useSharedState'
import { useFileUploader } from '~/composables/useFileUploader';
import { useNotification } from '~/composables/useNotification';
import { useUserProfile } from '~/composables/useUserProfile';

const { rawRows, fileName } = useExcelData()
const { loadSession } = useDb()
const { triggerFileInput } = useFileUploader();
const { showNotification } = useNotification();
const { isPro, userProfile } = useUserProfile();

const isLoading = ref(true)

onMounted(async () => {
  const session = await loadSession()
  if (session && session.rawRows.length > 0) {
    rawRows.value = session.rawRows
    fileName.value = session.fileName
  }
  isLoading.value = false
})

const {
  state,
  headers,
  invoices,
  firstInvoice,
  exportZip,
  isProcessing,
} = useInvoiceGenerator()

watch(isPro, (value) => {
  state.settings.freeMode = !value;
}, { immediate: true });

const showUpgradeModal = ref(false)
const showDetailsModal = ref(false)
const showWatermarkConfirmModal = ref(false)
const selectedInvoiceForDetails = ref(null)
const showFullscreenPreview = ref(false)

function openFullscreenPreview() {
  if (firstInvoice.value) {
    showFullscreenPreview.value = true;
  }
}

function viewDetails(invoice: any) {
  if (!invoice) return;
  selectedInvoiceForDetails.value = invoice
  showDetailsModal.value = true
}

function handleFileTrigger() {
  triggerFileInput();
}

async function handleExportClick() {
    const invoicesToExport = invoices.value.length;
    if (invoicesToExport === 0) {
        showNotification('Please upload and map your file before exporting.');
        return;
    }
    if (!userProfile.value || userProfile.value.subscription_tier === 'free') {
        showWatermarkConfirmModal.value = true;
    }
    if (userProfile.value.subscription_tier === 'personal') {
        isProcessing.value = true;
        try {
            const result = await $fetch('/api/usage', {
                method: 'POST',
                body: { invoicesToExport }
            });

            if (result.canExport) {
                await exportZip();
            } else {
                showNotification(result.message || 'You have reached your monthly invoice limit.');
                showUpgradeModal.value = true;
            }
        } catch (error: any) {
            showNotification(error.data?.message || 'Could not verify usage. Please try again.');
        } finally {
            isProcessing.value = false;
        }
        return;
    }
    if (userProfile.value.subscription_tier === 'pro') {
        await exportZip();
    }
}

function handleConfirmExportWithWatermark() {
    exportZip();
    showWatermarkConfirmModal.value = false;
}

function handleTriggerUpgradeFromModal() {
    showWatermarkConfirmModal.value = false;
    showUpgradeModal.value = true;
}
</script>

<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center bg-white">
    <p class="text-slate-500">Loading your workspace...</p>
  </div>

  <div v-else-if="rawRows.length > 0" class="min-h-screen bg-white text-slate-900 flex flex-col">
    <AppHeader
      :is-preview-ready="invoices.length > 0"
      :export-count="invoices.length"
      @change-file="handleFileTrigger"
      @export="handleExportClick"
      @open-upgrade-modal="showUpgradeModal = true"
    />

    <div class="mx-auto max-w-5xl px-3 w-full">
        <div class="flex flex-wrap items-center gap-2 py-2 text-[12px]">
            <span class="chip">📄 <strong class="font-medium">{{ state.fileName }}</strong></span>
            <span class="chip">🔢 Rows: <strong class="font-medium">{{ state.rawRows.length }}</strong></span>
            <span v-if="state.mapping.isGroupingEnabled && state.mapping.groupBy && state.mapping.groupBy !=='-- No Grouping --'" class="chip">🗂️ Grouping: <strong class="font-medium">{{ state.mapping.groupBy }}</strong></span>
        </div>
    </div>

    <main class="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-3 py-5 md:grid-cols-5 md:gap-5 w-full flex-grow">
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
          <div class="sticky top-20 space-y-3 border px-4 py-2 rounded-lg">
              <InvoicePreview 
                :invoice="firstInvoice" 
                :settings="state.settings" 
                @fullscreen="openFullscreenPreview" 
              />
               <div v-if="!isPro" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="flex items-center justify-between"><label for="watermark" class="text-[13px] font-medium text-slate-700">Show Watermark</label><input type="checkbox" id="watermark" checked disabled class="h-4 w-4 rounded border-slate-300 text-slate-400 focus:ring-slate-400" /></div>
                  <p class="mt-1 text-[12px] text-slate-500">Upgrade to remove the "Excel → Invoice" watermark.</p>
              </div>
          </div>
      </aside>
    </main>

    <AppFooter />

    <ModalsUpgradeModal :show="showUpgradeModal" @close="showUpgradeModal = false" />
    <ModalsReviewDetailsModal :show="showDetailsModal" :invoice="selectedInvoiceForDetails" @close="showDetailsModal = false"/>
    <ModalsWatermarkConfirmModal 
        :show="showWatermarkConfirmModal" 
        @close="showWatermarkConfirmModal = false"
        @confirm="handleConfirmExportWithWatermark"
        @upgrade="handleTriggerUpgradeFromModal"
    />
    
    <AppModal 
      :show="showFullscreenPreview" 
      @close="showFullscreenPreview = false"
      title="Fullscreen Preview"
    >
        <InvoicePreview 
            :invoice="firstInvoice" 
            :settings="state.settings" 
            :hide-fullscreen-button="true"
        />
    </AppModal>
    
    <AppNotification />
  </div>
  
  <div v-else class="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        :is-preview-ready="false"
        :export-count="0"
        @change-file="handleFileTrigger"
        @export="() => showNotification('Please upload a file first!')"
        @open-upgrade-modal="showUpgradeModal = true"
      />
      <main class="flex-grow flex items-center justify-center">
        <div class="text-center p-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Your workspace is ready</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by uploading an Excel or CSV file.</p>
            <div class="mt-6">
                <button @click="handleFileTrigger" type="button" class="btn-primary">
                    Upload a file
                </button>
            </div>
        </div>
      </main>
      <AppFooter />
      <ModalsUpgradeModal :show="showUpgradeModal" @close="showUpgradeModal = false" />
  </div>
</template>
