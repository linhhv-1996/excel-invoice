<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Invoice, Settings } from '~/composables/useInvoiceGenerator'

const props = defineProps<{
  invoice: Invoice | null
  settings: Settings
  isProcessing?: boolean
  isFullscreenView?: boolean
  progress?: { value: number; text: string }
}>()

const emit = defineEmits(['fullscreen'])

const previewScroller = ref<HTMLElement | null>(null)

const fmtMoney = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: props.settings.currency || 'USD' }).format(Number(n || 0))
  }
  catch {
    return String(n || 0)
  }
}

const escapeHtml = (s: string) => {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string))
}

const previewHtml = computed(() => {
  if (!props.invoice)
    return ''
  const s = props.settings
  const i = props.invoice
  const watermark = s.freeMode
  const sum = i.lines.reduce((a, b) => a + b.total, 0)
  const rowsHtml = i.lines.slice(0, 20).map(l => `
    <tr class="border-b border-slate-200 align-top">
      <td class="p-2 td-desc">${escapeHtml(l.desc)}</td>
      <td class="p-2 text-right">${l.qty}</td>
      <td class="p-2 text-right">${fmtMoney(l.unit)}</td>
      <td class="p-2 text-right font-semibold">${fmtMoney(l.total)}</td>
    </tr>`).join('')
  const more = i.lines.length > 20 ? `<div class="p-2 text-xs text-slate-500">… and ${i.lines.length - 20} more lines</div>` : ''
  const groupBadge = i.groupBy ? ` <span class="ml-2 rounded px-1.5 py-0.5 text-[10px] border border-slate-200">Group: ${escapeHtml(i.groupBy)}</span>` : ''
  const mark = watermark ? `<div class="pointer-events-none absolute inset-0 grid place-items-center text-5xl font-extrabold text-slate-200/40 rotate-[-20deg]">WATERMARK</div>` : ''

  if (s.template === 'classic') {
    return `
      <div class="relative overflow-hidden page font-serif p-4">
        ${mark}
        <div class="text-3xl font-bold mb-4">INVOICE</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-bold">${escapeHtml(s.cName || '[Your Company Name]')}</div>
            <div class="text-xs text-slate-500">${escapeHtml(s.cAddr || 'Your Address & Notes')}</div>
            <div class="text-xs text-slate-500">${(s.cTax ? (`TAX ID: ${escapeHtml(s.cTax)}`) : '')}</div>
          </div>
          <div class="text-right">
            <div class="text-xs">Invoice #: <span class="font-semibold">${escapeHtml(i.invoiceNo)}</span></div>
            <div class="text-xs">Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div class="mt-6 p-3 bg-slate-50 rounded-lg">
          <div class="text-xs text-slate-500">Billed to</div>
          <div class="font-bold">${escapeHtml(i.customer)}${groupBadge}</div>
        </div>
        <table class="w-full text-sm mt-4 table-fixed">
          <colgroup><col style="width:60%"/><col style="width:10%"/><col style="width:15%"/><col style="width:15%"/></colgroup>
          <thead class="bg-slate-100 text-slate-600"><tr><th class="p-2 text-left">Description</th><th class="p-2 text-right">Qty</th><th class="p-2 text-right">Unit</th><th class="p-2 text-right">Total</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${more}
        <div class="text-right mt-4"><div class="text-sm">Grand total</div><div class="text-2xl font-extrabold">${fmtMoney(sum)}</div></div>
      </div>`
  }
  else { // Modern template
    const headerRight = `${escapeHtml(s.cName || '[Your Company Name]')}<br><span class="text-xs text-slate-500">${escapeHtml(s.cAddr || 'Your Address & Notes')} ${(s.cTax ? (` • TAX: ${escapeHtml(s.cTax)}`) : '')}</span>`
    return `
      <div class="relative overflow-hidden page p-4">
        ${mark}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-slate-500">Billed to</div>
            <div class="text-base font-bold">${escapeHtml(i.customer)}${groupBadge}</div>
            <div class="text-xs text-slate-500">${escapeHtml(i.email || '')}</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold">${headerRight}</div>
            <div class="mt-1 text-xs text-slate-500">Invoice #: <span class="font-semibold text-ink">${escapeHtml(i.invoiceNo)}</span></div>
            <div class="text-xs">Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <table class="w-full text-sm mt-4 table-fixed">
          <colgroup><col style="width:60%"/><col style="width:10%"/><col style="width:15%"/><col style="width:15%"/></colgroup>
          <thead class="text-slate-600"><tr><th class="p-2 text-left">Description</th><th class="p-2 text-right">Qty</th><th class="p-2 text-right">Unit</th><th class="p-2 text-right">Total</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${more}
        <div class="flex items-center justify-end gap-6 mt-4"><div class="text-sm">Grand total</div><div class="text-lg font-extrabold">${fmtMoney(sum)}</div></div>
      </div>`
  }
})

const fitPreview = () => {
  // Bỏ qua nếu là modal fullscreen hoặc không có DOM element
  if (props.isFullscreenView || !previewScroller.value) return;

  const scroller = previewScroller.value
  const pageEl = scroller.querySelector('.page') as HTMLElement
  if (!pageEl) return

  const container = scroller.parentElement
  if (!container) return;
  
  // Tính toán tỷ lệ scale
  const availableWidth = container.getBoundingClientRect().width
  if (!availableWidth) return
  const baseWidth = 794
  const scale = availableWidth / baseWidth

  // Lấy chiều cao thực tế của nội dung bên trong .page
  const contentHeight = pageEl.offsetHeight;

  // Áp dụng transform để co nhỏ preview
  pageEl.style.transform = `scale(${scale})`
  pageEl.style.transformOrigin = 'top left'

  // **Đây là phần sửa lỗi quan trọng**
  // Set chiều cao của khung chứa BẰNG ĐÚNG chiều cao nội dung đã được scale
  scroller.style.height = `${contentHeight * scale}px`
}

onMounted(() => {
  window.addEventListener('resize', fitPreview)
  fitPreview()
})

onUnmounted(() => {
  window.removeEventListener('resize', fitPreview)
})

watch(() => [props.invoice, props.settings], () => {
  nextTick(fitPreview)
}, { deep: true, flush: 'post' })
</script>

<template>
  <div class="card p-4 mt-3">
    <div v-if="!isFullscreenView" class="flex items-center justify-between gap-2 flex-nowrap">
      <h3 class="text-sm font-bold whitespace-nowrap">
        Live Preview
      </h3>
      <div v-if="invoice" class="shrink-0">
        <button class="btn btn-outline" @click="$emit('fullscreen')">
          Fullscreen
        </button>
      </div>
    </div>

    <div v-if="invoice" class="mt-3">
      <div ref="previewScroller" class="overflow-visible" v-html="previewHtml" />
      <p v-if="settings.freeMode && !isFullscreenView" class="mt-2 text-xs text-slate-600">
        Free mode: up to 10 invoices and a watermark will be exported.
      </p>
    </div>

    <div v-if="!invoice && !isProcessing" class="grid place-items-center text-center text-slate-500 py-10">
      <div>
        <div class="mx-auto mb-2 h-8 w-8 grid place-items-center border border-slate-200 rounded-md bg-white">
          📄
        </div>
        <div class="text-sm">
          Use the <span class="font-semibold">Browse .xlsx</span> button above to select a file.
        </div>
      </div>
    </div>

    <div v-if="isProcessing && progress" class="mt-3">
      <div class="h-2 w-full rounded-full bg-slate-100">
        <div class="h-2 rounded-full bg-emerald-500 transition-all duration-300" :style="{ width: `${progress.value}%` }" />
      </div>
      <p class="mt-1 text-xs text-slate-600">
        {{ progress.text }}
      </p>
    </div>
  </div>
</template>
