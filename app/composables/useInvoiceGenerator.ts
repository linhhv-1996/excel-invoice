// app/composables/useInvoiceGenerator.ts
import { ref, reactive, computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useNotification } from './useNotification'
import { usePdfGenerator } from './usePdfGenerator'
import { useExcelData } from './useSharedState'

// --- Types (Export để các file khác có thể dùng) ---
export interface InvoiceLine {
  desc: string
  qty: number
  unit: number
  total: number
}

export interface Invoice {
  customer: string
  email: string
  groupBy: string
  invoiceNo: string
  lines: InvoiceLine[]
}

export interface Mapping {
  isGroupingEnabled: boolean
  customer: string
  email: string
  invoiceNo: string
  desc: string
  qty: string
  unit: string
  groupBy: string
}

// **** UPDATED ****
export interface Settings {
  cTax: any
  cName: string
  cEmail: string
  cAddr: string
  logo: string | null
  template: 'modern' | 'classic' | 'technical' | 'elegant' // Added new templates
  fileNamePattern: string
  startInvoiceNumber: string
  currency: 'USD' | 'EUR' | 'VND'
  locale: 'en-US' | 'en-GB' | 'vi-VN'
  taxPercent: number
  freeMode: boolean
}


const LS_KEYS = {
  SETTINGS: 'EIP_settings_v2',
  MAPPING: 'EIP_mapping_v2',
}

export function useInvoiceGenerator() {
  const { showNotification } = useNotification()
  const { renderPdf } = usePdfGenerator()
  const { rawRows, fileName } = useExcelData()

  const isProcessing = ref(false)
  const progress = ref({ value: 0, text: '' })

  const state = reactive({
    rawRows: rawRows,
    fileName: fileName,
    isGroupingEnabled: true,
    mapping: {
      customer: '', email: '', invoiceNo: '', desc: '', qty: '', unit: '', groupBy: '',
    } as Mapping,
    // **** UPDATED: Default template changed to 'modern' ****
    settings: {
      cName: 'Your Company',
      cEmail: 'you@example.com',
      cAddr: '123 Your Street, City',
      logo: null,
      template: 'modern', // Default template
      fileNamePattern: 'invoice_{client}_{date}',
      startInvoiceNumber: 'INV-001',
      currency: 'USD',
      locale: 'en-US',
      taxPercent: 10,
      freeMode: true,
    } as Settings,
  })

  const headers = computed(() => state.rawRows.length > 0 ? Object.keys(state.rawRows[0]) : [])
  const invoices = ref<Invoice[]>([])
  const firstInvoice = computed(() => invoices.value[0] || null)

  // --- Local Storage cho Settings & Mapping ---
  const saveSettings = (showToast = true) => {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(state.settings))
    if (showToast)
      showNotification('Settings saved!')
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(LS_KEYS.SETTINGS)
      if (saved) {
         Object.assign(state.settings, JSON.parse(saved))
      }
    }
    catch { /* ignore */ }
  }

  const saveMapping = () => {
    localStorage.setItem(LS_KEYS.MAPPING, JSON.stringify(state.mapping))
  }

  const loadMapping = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS.MAPPING) || '{}')
    }
    catch {
      return {}
    }
  }

  // --- Logic xử lý chính ---
  const validateMapping = () => {
     return [state.mapping.customer, state.mapping.desc, state.mapping.qty, state.mapping.unit].every(s => !!s)
  }

  // Trong file: app/composables/useInvoiceGenerator.ts

const groupInvoices = (rows: any[], mapping: Mapping): Invoice[] => {
  // Logic mới sẽ dựa vào checkbox isGroupingEnabled
  if (!mapping.isGroupingEnabled) {
    // TRƯỜNG HỢP 1: KHÔNG GOM NHÓM
    // Tạo một hóa đơn cho mỗi dòng
    return rows.map((r, index) => {
      const customer = String(r[mapping.customer] ?? '').trim()
      if (!customer) return null // Bỏ qua dòng trống

      const qty = Number(r[mapping.qty]) || 0
      const unit = Number(r[mapping.unit]) || 0

      return {
        customer,
        email: r[mapping.email] || '',
        groupBy: '',
        invoiceNo: r[mapping.invoiceNo] || `INV-${index + 1}`,
        lines: [{
          desc: String(r[mapping.desc] || '').trim(),
          qty,
          unit,
          total: qty * unit
        }]
      }
    }).filter(Boolean) as Invoice[]
  }

  // TRƯỜG HỢP 2: CÓ GOM NHÓM (Logic cũ của bạn, đã được tối ưu)
  const groupColumn = mapping.groupBy
  if (!groupColumn || groupColumn === '-- No Grouping --') {
    // Nếu bật group nhưng chưa chọn cột, trả về mảng rỗng
    return []
  }

  const groups = new Map<string, Invoice>()
  for (const r of rows) {
    const key = String(r[groupColumn] ?? '').trim()
    if (!key) continue

    if (!groups.has(key)) {
      groups.set(key, {
        customer: String(r[mapping.customer] ?? '').trim(),
        email: r[mapping.email] || '',
        groupBy: key,
        invoiceNo: '', // Sẽ đánh số sau
        lines: []
      })
    }

    const g = groups.get(key)!
    const qty = Number(r[mapping.qty]) || 0
    const unit = Number(r[mapping.unit]) || 0
    g.lines.push({ desc: String(r[mapping.desc] || '').trim(), qty, unit, total: qty * unit })
  }

  let i = 1
  for (const g of groups.values()) {
    if (!g.invoiceNo) {
      // Logic tạo số hóa đơn của bạn
      g.invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(3, '0')}`
    }
    i++
  }
  return Array.from(groups.values())
}



  const generateAndPreview = () => {
    if (!validateMapping()) {
      invoices.value = []
      return
    }
    invoices.value = groupInvoices(state.rawRows, state.mapping)
  }

  const autoGuessMappings = () => {
    const h = headers.value
    const guess = (needle: string) => h.find(h => h.toLowerCase().includes(needle)) || ''
    state.mapping.customer = guess('name') || guess('customer') || guess('client') || ''
    state.mapping.email = guess('email') || ''
    state.mapping.invoiceNo = guess('invoice') || guess('inv') || ''
    state.mapping.desc = guess('desc') || guess('item') || guess('service') || ''
    state.mapping.qty = guess('qty') || guess('quantity') || ''
    state.mapping.unit = guess('price') || guess('unit') || guess('rate') || ''
    state.mapping.groupBy = h.includes('client_name') ? 'client_name' : (h.includes('project_id') ? 'project_id' : '')
  }

   const applySavedMapping = () => {
    const m = loadMapping()
    if (!m) return
    const setIfExists = (key: keyof Mapping) => {
      const savedValue = m[key]
      if (savedValue && headers.value.includes(savedValue)) {
        state.mapping[key] = savedValue
      }
    }
    Object.keys(state.mapping).forEach(key => setIfExists(key as keyof Mapping))
  }

  const sanitizeFile = (s: string) => {
    return String(s || '').replace(/[^a-z0-9_\-.]+/gi, '_').slice(0, 80) || 'invoice'
  }

  const exportZip = async () => {
    if (!validateMapping() || invoices.value.length === 0) {
      return showNotification('Please check your file and mappings first.')
    }
    const limit = state.settings.freeMode ? Math.min(invoices.value.length, 10) : invoices.value.length
    isProcessing.value = true
    progress.value = { value: 0, text: `Generating ${limit} PDFs…` }
    try {
      const zip = new JSZip()
      for (let i = 0; i < limit; i++) {
        const inv = invoices.value[i]
        const pdfBytes = await renderPdf(inv, state.settings, { watermark: state.settings.freeMode })
        const fname = `${sanitizeFile(inv.invoiceNo || `INV-${i + 1}`)}.pdf`
        zip.file(fname, pdfBytes)
        progress.value.value = Math.round(((i + 1) / limit) * 100)
      }
      progress.value.text = 'Zipping…'
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `invoices_${new Date().toISOString().slice(0, 10)}.zip`)
      progress.value.text = 'Done!'
    }
    catch (err: any) {
      showNotification(`Export error: ${err.message}`)
    }
    finally {
      setTimeout(() => {
        isProcessing.value = false
      }, 2000)
    }
  }

  // --- Lifecycle & Watchers ---
  onMounted(() => {
    if (state.rawRows.length > 0) {
      loadSettings()
      autoGuessMappings()
      applySavedMapping()
      generateAndPreview()
    }
  })

  watch(() => state.mapping, saveMapping, { deep: true })
  watch(() => state.settings, () => saveSettings(false), { deep: true })

  watch(() => state.mapping, generateAndPreview, { deep: true });

  return {
    state,
    headers,
    invoices,
    firstInvoice,
    isProcessing,
    progress,
    exportZip,
  }
}
