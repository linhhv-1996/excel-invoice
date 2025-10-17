<script setup lang="ts">
import { useInvoiceGenerator } from '~/composables/useInvoiceGenerator'

const {
  state,
  headers,
  invoices,
  firstInvoice,
  isProcessing,
  progress,
  fileInput,
  isFileUploaded,
  handleFileChange,
  triggerFileInput,
  exportZip,
  resetApp,
  downloadTemplate,
  saveSettings,
  isModalOpen,
  openFullscreen,
  closeFullscreen,
} = useInvoiceGenerator()
</script>

<template>
  <div class="h-screen bg-paper text-ink antialiased grid grid-rows-[auto_1fr_auto]">
    <AppHeader
      :file-name="state.fileName"
      :is-preview-ready="invoices.length > 0"
      :free-mode="state.settings.freeMode"
      :is-file-uploaded="isFileUploaded"
      @update:free-mode="value => state.settings.freeMode = value"
      @browse="triggerFileInput"
      @preview="openFullscreen"
      @export="exportZip"
      @reset="resetApp"
      @download-template="downloadTemplate"
    />

    <main class="overflow-y-auto">
      <div class="mx-auto max-w-5xl px-4 py-5 grid grid-cols-10 gap-x-4 w-full">
        <div class="col-span-10 lg:col-span-6 sticky-col pr-2">
          <InvoiceMappingCard
            v-if="headers.length > 0"
            :headers="headers"
            v-model:mapping="state.mapping"
          />
          <InvoiceSettingsCard
            v-model:settings="state.settings"
            @save="() => saveSettings()"
          />
        </div>

        <div class="col-span-10 lg:col-span-4 mt-6 lg:mt-0 sticky-col">
          <InvoicePreview
            :invoice="firstInvoice"
            :settings="state.settings"
            :is-processing="isProcessing"
            :progress="progress"
            @fullscreen="openFullscreen"
          />
        </div>
      </div>
    </main>

    <AppFooter />

    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="handleFileChange"
    >
    <AppModal :show="isModalOpen" @close="closeFullscreen">
      <InvoicePreview
        :invoice="firstInvoice"
        :settings="state.settings"
        :is-fullscreen-view="true"
      />
    </AppModal>
    <AppNotification />
  </div>
</template>
