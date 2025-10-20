<script setup lang="ts">
import { computed } from 'vue' // Thêm computed
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
    // Quan trọng: Gán giá trị cho useState refs
    rawRows.value = session.rawRows
    fileName.value = session.fileName
     // Không cần gọi generateAndPreview ở đây nữa, watch(rawRows) trong useInvoiceGenerator sẽ xử lý
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
  progress, // Thêm progress
   // --- Lấy state và hàm xử lý selection ---
  selectedInvoiceIndices,
  toggleInvoiceSelection,
  selectAllInvoices,
  deselectAllInvoices,
  areAllInvoicesSelected,
} = useInvoiceGenerator()

// Tính toán số lượng invoice đã chọn
const selectedInvoiceCount = computed(() => selectedInvoiceIndices.value.size);


watch(isPro, (value) => {
  state.settings.freeMode = !value;
}, { immediate: true });

const showUpgradeModal = ref(false)
const showDetailsModal = ref(false)
const showWatermarkConfirmModal = ref(false)
const selectedInvoiceForDetails = ref(null)
const showFullscreenPreview = ref(false)

function openFullscreenPreview() {
  if (firstInvoice.value) { // Hoặc dùng invoiceForPreview nếu đã implement link preview
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

// --- **CẬP NHẬT LOGIC EXPORT** ---
async function handleExportClick() {
    // const invoicesToExportCount = invoices.value.length; // Số tổng
    const invoicesToExportCount = selectedInvoiceCount.value; // Số đã chọn

    if (invoicesToExportCount === 0) {
        showNotification('Please select at least one invoice to export.');
        return;
    }
    // Logic kiểm tra gói cước giữ nguyên
     if (!isPro.value) { // Đơn giản hóa kiểm tra, nếu không phải Pro thì hiện confirm watermark
        showWatermarkConfirmModal.value = true;
        return; // Dừng lại chờ confirm
    }

    // Logic xử lý gói Personal (nếu có giới hạn)
    if (userProfile.value?.subscription_tier === 'personal') {
        isProcessing.value = true;
        try {
            const result = await $fetch<{ canExport: boolean; message?: string }>('/api/usage', {
                method: 'POST',
                body: { invoicesToExport: invoicesToExportCount } // Gửi số lượng đã chọn
            });

            if (result.canExport) {
                await exportZip(); // Gọi exportZip không cần tham số
            } else {
                showNotification(result.message || 'You have reached your monthly invoice limit.');
                showUpgradeModal.value = true;
            }
        } catch (error: any) {
            showNotification(error.data?.message || 'Could not verify usage. Please try again.');
        } finally {
            isProcessing.value = false;
        }
        return; // Dừng lại sau khi xử lý gói personal
    }

     // Logic gói Pro hoặc các gói không giới hạn khác
    if (isPro.value) { // Gói Pro hoặc gói nào đó mà isPro = true
        await exportZip(); // Gọi exportZip không cần tham số
    }

}

// --- **CẬP NHẬT LOGIC CONFIRM WATERMARK** ---
function handleConfirmExportWithWatermark() {
    state.settings.freeMode = true; // Đảm bảo watermark được bật khi export từ free
    exportZip(); // Gọi exportZip không cần tham số
    showWatermarkConfirmModal.value = false;
}

function handleTriggerUpgradeFromModal() {
    showWatermarkConfirmModal.value = false;
    showUpgradeModal.value = true;
}

// --- **HÀM XỬ LÝ EVENT TỪ InvoiceList** ---
const handleToggleSelect = (index: number) => {
    toggleInvoiceSelection(index);
}

const handleToggleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
        selectAllInvoices();
    } else {
        deselectAllInvoices();
    }
}
</script>

<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center bg-white">
    <p class="text-slate-500">Loading your workspace...</p>
  </div>

  <div v-else-if="rawRows.length > 0" class="min-h-screen bg-white text-slate-900 flex flex-col">
    <AppHeader
      :is-preview-ready="invoices.length > 0"
      :export-count="selectedInvoiceCount"
      :is-export-disabled="isProcessing"
      :is-exporting="isProcessing"
      :export-progress="progress"
      @change-file="handleFileTrigger"
      @export="handleExportClick"
      @open-upgrade-modal="showUpgradeModal = true"
    />

    <div class="mx-auto max-w-5xl px-3 w-full">
        <div class="flex flex-wrap items-center gap-2 py-2 text-[12px]">
            <span class="chip">📄 <strong class="font-medium">{{ state.fileName }}</strong></span>
            <span class="chip">🔢 Rows: <strong class="font-medium">{{ state.rawRows.length }}</strong></span>
            <span v-if="state.mapping.isGroupingEnabled && state.mapping.groupBy && state.mapping.groupBy !=='-- No Grouping --'" class="chip">🗂️ Grouping: <strong class="font-medium">{{ state.mapping.groupBy }}</strong></span>
            <span v-if="invoices.length > 0" class="chip">🧾 Invoices: <strong class="font-medium">{{ invoices.length }}</strong></span>
        </div>
    </div>

    <main class="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-3 py-5 md:grid-cols-5 md:gap-5 w-full flex-grow">
      <section class="space-y-3 md:col-span-3">
        <InvoiceMappingCard
          v-model:mapping="state.mapping"
          :headers="headers"
          @open-upgrade-modal="showUpgradeModal = true"
        />
        <InvoiceList
            :invoices="invoices"
            :selected-indices="selectedInvoiceIndices"
            :are-all-selected="areAllInvoicesSelected"
            :is-grouping-enabled="state.mapping.isGroupingEnabled" @view-details="viewDetails"
            @toggle-select="handleToggleSelect"
            @toggle-select-all="handleToggleSelectAll"
        />
        <InvoiceSettingsCard
          v-model:settings="state.settings"
          @open-upgrade-modal="showUpgradeModal = true"
        />
      </section>

      <aside class="relative md:col-span-2">
           <div class="sticky top-20 space-y-3">
              <InvoicePreview
                :invoice="firstInvoice"
                :settings="state.settings"
                @fullscreen="openFullscreenPreview"
              />
               <div v-if="!isPro" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="flex items-center justify-between">
                      <label class="text-[13px] font-medium text-slate-700">Show Watermark</label>
                      <input type="checkbox" checked disabled class="h-4 w-4 rounded border-slate-300 text-slate-400 focus:ring-slate-400" />
                  </div>
                  <p class="mt-1 text-[12px] text-slate-500">Upgrade to Pro to remove the watermark.</p>
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

    <div v-if="isProcessing" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <svg class="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="mt-3 text-sm text-slate-600 font-medium">{{ progress.text }} ({{ progress.value }}%)</p>
    </div>

  </div>

  <div v-else class="min-h-screen bg-slate-50 flex flex-col">
       <AppHeader
        :is-preview-ready="false"
        :export-count="0"
        :is-export-disabled="true"
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
       <AppNotification />
  </div>
</template>
