// composables/useInvoiceGenerator.ts
import { ref, reactive, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useNotification } from './useNotification'
import { usePdfGenerator } from './usePdfGenerator'

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
  customer: string
  email: string
  invoiceNo: string
  desc: string
  qty: string
  unit: string
  groupBy: string
}
export interface Settings {
  cName: string
  cAddr: string
  cTax: string
  currency: 'USD' | 'EUR' | 'VND'
  template: 'modern' | 'classic'
  freeMode: boolean
}

const LS_KEYS = {
  SETTINGS: 'EIP_settings_v1',
  MAPPING: 'EIP_mapping_v2',
}

export function useInvoiceGenerator() {
  const { showNotification } = useNotification()
  const { renderPdf } = usePdfGenerator()

  const fileInput = ref<HTMLInputElement | null>(null)
  const isProcessing = ref(false)
  const progress = ref({ value: 0, text: '' })

  const isFileUploaded = ref(false)

  const state = reactive({
    rawRows: [] as any[],
    fileName: 'No file selected',
    mapping: {
      customer: '', email: '', invoiceNo: '', desc: '', qty: '', unit: '', groupBy: '',
    } as Mapping,
    settings: {
      cName: '', cAddr: '', cTax: '', currency: 'USD' as 'USD' | 'EUR' | 'VND', template: 'modern' as 'modern' | 'classic', freeMode: true,
    } as Settings,
  })

  const headers = computed(() => state.rawRows.length > 0 ? Object.keys(state.rawRows[0]) : [])
  const invoices = ref<Invoice[]>([])
  const firstInvoice = computed(() => invoices.value[0] || null)

  // --- Local Storage ---
  const saveSettings = (showToast = true) => {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(state.settings))
    if (showToast)
      showNotification('Settings saved!')
  }

  const loadSettings = () => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEYS.SETTINGS) || '{}')
      if (s.cName) state.settings.cName = s.cName
      if (s.cAddr) state.settings.cAddr = s.cAddr
      if (s.cTax) state.settings.cTax = s.cTax
      if (s.currency) state.settings.currency = s.currency
      if (s.template) state.settings.template = s.template
      if (typeof s.freeMode === 'boolean') state.settings.freeMode = s.freeMode
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

  // --- Core Logic ---
  const handleFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    state.fileName = file.name
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          state.rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' })
          if (!state.rawRows.length) {
            showNotification('No data detected in the first sheet.')
            isFileUploaded.value = false
            return
          }

          isFileUploaded.value = true
          autoGuessMappings()
          applySavedMapping()

          // Generate preview in next tick
          setTimeout(() => {
            generateAndPreview()
            if (validateMapping())
              showNotification('File loaded and preview generated!')
            else
              showNotification('File loaded. Please map required columns (*).')
          }, 0)
        }
        catch (err: any) {
          showNotification(`Excel error: ${err.message}`)
          isFileUploaded.value = false;
        }
      }
    reader.onerror = () => { 
        showNotification('Could not read file.');
        isFileUploaded.value = false;
    }

    reader.readAsArrayBuffer(file)
    }

    catch (err: any) {
      showNotification('No valid invoice data found based on your mapping.')
    }
  }

  const validateMapping = () => {
    return [state.mapping.customer, state.mapping.desc, state.mapping.qty, state.mapping.unit].every(s => !!s)
  }

  const groupInvoices = (rows: any[], mapping: Mapping): Invoice[] => {
    const groups = new Map<string, Invoice>()
    for (const r of rows) {
      const customer = String(r[mapping.customer] ?? '').trim()
      if (!customer)
        continue
      const grpVal = mapping.groupBy ? String(r[mapping.groupBy] ?? '').trim() : ''
      const key = mapping.groupBy ? `${customer}__SEP__${grpVal}` : customer
      if (!groups.has(key))
        groups.set(key, { customer, email: r[mapping.email] || '', groupBy: grpVal, invoiceNo: '', lines: [] })

      const g = groups.get(key)!
      const qty = Number(r[mapping.qty]) || 0
      const unit = Number(r[mapping.unit]) || 0
      g.lines.push({ desc: String(r[mapping.desc] || '').trim(), qty, unit, total: qty * unit })
      if (!g.invoiceNo && mapping.invoiceNo && r[mapping.invoiceNo])
        g.invoiceNo = String(r[mapping.invoiceNo])
    }

    let i = 1
    for (const g of groups.values()) {
      if (!g.invoiceNo)
        g.invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(3, '0')}`
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

    if (!invoices.value.length)
      toast.warning('No valid invoice data found based on your mapping.')
  }

  const autoGuessMappings = () => {
    const h = headers.value
    const guess = (needle: string) => h.find(h => h.toLowerCase().includes(needle)) || ''
    state.mapping.customer = guess('name') || guess('customer') || ''
    state.mapping.email = guess('email') || ''
    state.mapping.invoiceNo = guess('invoice') || guess('inv') || ''
    state.mapping.desc = guess('desc') || guess('item') || guess('service') || ''
    state.mapping.qty = guess('qty') || guess('quantity') || ''
    state.mapping.unit = guess('price') || guess('unit') || guess('rate') || ''
    state.mapping.groupBy = ''
  }

  const applySavedMapping = () => {
    const m = loadMapping()
    if (!m)
      return
    const setIfExists = (key: keyof Mapping) => {
      const savedValue = m[key]
      if (savedValue && headers.value.includes(savedValue))
        state.mapping[key] = savedValue
    }
    setIfExists('customer'); setIfExists('email'); setIfExists('invoiceNo')
    setIfExists('desc'); setIfExists('qty'); setIfExists('unit'); setIfExists('groupBy')
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

  const resetApp = () => {
    if (confirm('Clear all saved settings & mappings? This will reload the page.')) {
      localStorage.removeItem(LS_KEYS.SETTINGS)
      localStorage.removeItem(LS_KEYS.MAPPING)
      location.reload();
      isFileUploaded.value = false
    }
  }

  const downloadTemplate = () => {
    const sampleData = [
      { customer_name: 'Client A', customer_email: 'client.a@email.com', invoice_no: 'INV-001', item_description: 'Web Design Service', quantity: 1, unit_price: 1500 },
      { customer_name: 'Client B', customer_email: 'client.b@email.com', invoice_no: 'INV-002', item_description: 'Logo Design', quantity: 1, unit_price: 500 },
      { customer_name: 'Client B', customer_email: 'client.b@email.com', invoice_no: 'INV-002', item_description: 'Business Cards (x250)', quantity: 1, unit_price: 150 },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices')
    XLSX.writeFile(workbook, 'invoice_template.xlsx')
  }

  // --- Fullscreen Modal ---
  const isModalOpen = ref(false)
  const openFullscreen = () => {
    if (invoices.value.length > 0)
      isModalOpen.value = true
    else
      showNotification('Upload a file and map columns to see a preview.')
  }
  const closeFullscreen = () => isModalOpen.value = false

  // --- Lifecycle ---
  onMounted(() => {
    loadSettings()
  })

  // Auto-save mappings and settings on change
  watch(() => state.mapping, saveMapping, { deep: true })
  watch(() => state.settings, () => saveSettings(false), { deep: true })
  
  // Re-generate preview when mappings change
  watch(() => state.mapping, () => {
     if (state.rawRows.length > 0) {
        generateAndPreview()
     }
  }, { deep: true });

  return {
    state,
    headers,
    invoices,
    firstInvoice,
    isProcessing,
    progress,
    fileInput,
    isFileUploaded,
    handleFileChange,
    triggerFileInput: () => fileInput.value?.click(),
    exportZip,
    resetApp,
    downloadTemplate,
    saveSettings,
    isModalOpen,
    openFullscreen,
    closeFullscreen,
  }
}
