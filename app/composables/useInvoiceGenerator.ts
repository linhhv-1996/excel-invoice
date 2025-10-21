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
  // Thêm index để định danh duy nhất cho việc chọn
  _index?: number,
  errors?: string[]
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
    settings: {
      cName: 'Your Company',
      cEmail: 'you@example.com',
      cAddr: '123 Your Street, City',
      cTax: '', // Thêm dòng này nếu chưa có
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

  // --- **THÊM STATE CHO VIỆC CHỌN INVOICE** ---
  // Sử dụng Set để lưu index của các invoice được chọn
  const selectedInvoiceIndices = ref(new Set<number>())

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
     // Thêm kiểm tra groupBy nếu isGroupingEnabled = true
     && (!state.mapping.isGroupingEnabled || (state.mapping.isGroupingEnabled && state.mapping.groupBy && state.mapping.groupBy !== '-- No Grouping --'));
  }

 const groupInvoices = (rows: any[], mapping: Mapping): Invoice[] => {
    let generatedInvoices: Invoice[] = [];

    // --- Các trường bắt buộc cơ bản ---
    const requiredFields: (keyof Mapping)[] = ['customer', 'desc', 'qty', 'unit'];

    if (!mapping.isGroupingEnabled) {
        generatedInvoices = rows.map((r, index) => {
            const invoice: Partial<Invoice> = {}; // Sử dụng Partial để xây dựng từ từ
            const errors: string[] = [];

            // Kiểm tra các trường cơ bản
            requiredFields.forEach(field => {
                const mappedField = mapping[field];
                if (!mappedField || !r[mappedField] || String(r[mappedField]).trim() === '') {
                    errors.push(field.charAt(0).toUpperCase() + field.slice(1)); // Ví dụ: 'Customer', 'Desc'
                }
            });

            // Lấy dữ liệu (vẫn lấy dù có lỗi để hiển thị phần còn lại)
            const customer = String(r[mapping.customer] ?? '').trim();
            const qty = Number(r[mapping.qty]) || 0;
            const unit = Number(r[mapping.unit]) || 0;
            const desc = String(r[mapping.desc] || '').trim();

            // Bỏ qua dòng hoàn toàn trống (có thể điều chỉnh logic này)
            if (!customer && !desc && qty === 0 && unit === 0) return null;

            return {
                customer: customer || 'N/A',
                email: r[mapping.email] || '',
                groupBy: '',
                invoiceNo: r[mapping.invoiceNo] || `INV-${index + 1}`,
                lines: [{
                    desc: desc || 'N/A',
                    qty,
                    unit,
                    total: qty * unit
                }],
                errors: errors.length > 0 ? errors : undefined // Gán mảng lỗi nếu có
            };
        }).filter(Boolean) as Invoice[];

    } else {
        const groupColumn = mapping.groupBy;
        // --- Kiểm tra thêm groupBy nếu bật grouping ---
        if (!groupColumn || groupColumn === '-- No Grouping --') {
             // Có thể thêm lỗi chung ở đây nếu muốn, hoặc báo lỗi ở MappingCard
             // Ví dụ: showNotification('Please select a valid "Group by" column.');
             return []; // Không tạo invoice nào nếu groupBy không hợp lệ
        }

        const groups = new Map<string, Invoice>();

        for (const r of rows) {
            const key = String(r[groupColumn] ?? '').trim();
            const customer = String(r[mapping.customer] ?? '').trim();
            const desc = String(r[mapping.desc] || '').trim();
            const qty = Number(r[mapping.qty]) || 0;
            const unit = Number(r[mapping.unit]) || 0;

             // Bỏ qua dòng gần như trống
             if (!key && !customer && !desc && qty === 0 && unit === 0) continue;

            const groupKey = key || `__empty_group_${customer}`;

            if (!groups.has(groupKey)) {
                 // Kiểm tra customer chỉ khi tạo group mới
                 const initialErrors: string[] = [];
                 if (!customer) {
                     initialErrors.push('Customer');
                 }
                  // Kiểm tra groupBy key bị trống khi tạo group
                 if (!key) {
                    initialErrors.push('Group By Field'); // Thêm lỗi nếu group key trống
                 }

                groups.set(groupKey, {
                    customer: customer || 'N/A',
                    email: r[mapping.email] || '',
                    groupBy: key,
                    invoiceNo: '', // Sẽ đánh số sau
                    lines: [],
                    errors: initialErrors.length > 0 ? initialErrors : undefined // Gán lỗi ban đầu nếu có
                });
            }

            const g = groups.get(groupKey)!;
            const lineErrors: string[] = [];

            // Kiểm tra các trường bắt buộc cho từng dòng line
             if (!desc) lineErrors.push('Item Name (desc)');
             if (isNaN(qty) || qty === 0) lineErrors.push('Quantity (qty)'); // Coi qty=0 là lỗi nếu cần
             if (isNaN(unit)) lineErrors.push('Unit price (unit)'); // Chỉ check NaN, giá 0 có thể hợp lệ

             // Thêm lỗi của dòng vào lỗi chung của group (nếu chưa có)
             if (lineErrors.length > 0) {
                 g.errors = g.errors || [];
                 lineErrors.forEach(err => {
                     if (!g.errors!.includes(err)) {
                         g.errors!.push(err);
                     }
                 });
             }


            g.lines.push({ desc: desc || 'N/A', qty, unit, total: qty * unit });
        }
        generatedInvoices = Array.from(groups.values());
    }

    // Gán _index cho mỗi invoice
    return generatedInvoices.map((inv, index) => ({ ...inv, _index: index }));
}



  const generateAndPreview = () => {
    if (!validateMapping()) {
      invoices.value = []
      selectedInvoiceIndices.value.clear() // Xóa lựa chọn cũ
      return
    }
    invoices.value = groupInvoices(state.rawRows, state.mapping)
    // --- **MẶC ĐỊNH CHỌN TẤT CẢ KHI CÓ INVOICE MỚI** ---
    selectAllInvoices();
  }

  // --- **CÁC HÀM XỬ LÝ CHỌN/BỎ CHỌN** ---
  const toggleInvoiceSelection = (index: number) => {
    if (selectedInvoiceIndices.value.has(index)) {
      selectedInvoiceIndices.value.delete(index);
    } else {
      selectedInvoiceIndices.value.add(index);
    }
  }

  const selectAllInvoices = () => {
    selectedInvoiceIndices.value = new Set(invoices.value.map(inv => inv._index!));
  }

  const deselectAllInvoices = () => {
    selectedInvoiceIndices.value.clear();
  }

  // --- Computed property để kiểm tra có phải tất cả đều được chọn không ---
  const areAllInvoicesSelected = computed(() =>
      invoices.value.length > 0 && selectedInvoiceIndices.value.size === invoices.value.length
  );

  const autoGuessMappings = () => {
    const h = headers.value
    const guess = (needle: string) => h.find(h => h.toLowerCase().includes(needle)) || ''
    state.mapping.customer = guess('name') || guess('customer') || guess('client') || ''
    state.mapping.email = guess('email') || ''
    state.mapping.invoiceNo = guess('invoice') || guess('inv') || ''
    state.mapping.desc = guess('desc') || guess('item') || guess('service') || ''
    state.mapping.qty = guess('qty') || guess('quantity') || ''
    state.mapping.unit = guess('price') || guess('unit') || guess('rate') || ''
    // Ưu tiên cột group nếu có, nếu không thì để trống (hoặc '-- No Grouping --')
    state.mapping.groupBy = guess('group') || guess('project') || guess('client') || '';
     // Mặc định bật grouping nếu tìm thấy cột group hợp lệ
    state.mapping.isGroupingEnabled = !!state.mapping.groupBy && headers.value.includes(state.mapping.groupBy);
  }

   const applySavedMapping = () => {
    const m = loadMapping()
    if (!m) return
    const setIfExists = (key: keyof Mapping) => {
      const savedValue = m[key]
      // Chỉ cập nhật nếu giá trị lưu tồn tại và cột đó có trong headers hiện tại
       if (savedValue !== undefined && (key === 'isGroupingEnabled' || headers.value.includes(savedValue) || savedValue === '')) {
        (state.mapping as any)[key] = savedValue;
      }
    }
    Object.keys(state.mapping).forEach(key => setIfExists(key as keyof Mapping))
     // Gán cả isGroupingEnabled nếu có lưu
    if (m.isGroupingEnabled !== undefined) {
        state.mapping.isGroupingEnabled = m.isGroupingEnabled;
    }
  }

  const sanitizeFile = (s: string) => {
    return String(s || '').replace(/[^a-z0-9_\-.]+/gi, '_').slice(0, 80) || 'invoice'
  }

const exportZip = async () => {
    // --- Lấy ra các invoice ĐƯỢC CHỌN ---
    const selectedInvoices = invoices.value.filter(inv => selectedInvoiceIndices.value.has(inv._index!));

    // --- Lọc bỏ những invoice bị lỗi khỏi danh sách được chọn ---
    const invoicesToExport = selectedInvoices.filter(inv => !inv.errors || inv.errors.length === 0);
    const erroredInvoicesSkipped = selectedInvoices.length - invoicesToExport.length; // Số lượng hóa đơn lỗi bị bỏ qua

    if (!validateMapping() || invoicesToExport.length === 0) {
      if (erroredInvoicesSkipped > 0 && selectedInvoices.length > 0) {
         // Trường hợp chỉ chọn phải hóa đơn lỗi
         showNotification(`Cannot export: All ${erroredInvoicesSkipped} selected invoice(s) have missing required information. Please fix them or select valid invoices.`);
      } else if (!validateMapping()) {
          showNotification('Please check mappings before exporting.');
      }
      else {
          showNotification('Please select at least one valid invoice to export.');
      }
      return;
    }

    // Thông báo nếu có hóa đơn lỗi bị bỏ qua
    if (erroredInvoicesSkipped > 0) {
        showNotification(`Skipped ${erroredInvoicesSkipped} invoice(s) with missing information.`);
    }


    isProcessing.value = true
    const limit = invoicesToExport.length; // Số lượng cần export (chỉ những cái hợp lệ)
    progress.value = { value: 0, text: `Generating ${limit} PDFs…` }

    try {
      const zip = new JSZip()
      for (let i = 0; i < limit; i++) {
        const inv = invoicesToExport[i] // Chỉ lấy invoice hợp lệ đã chọn
        const pdfBytes = await renderPdf(inv, state.settings, { watermark: state.settings.freeMode })
        // Tạo tên file (có thể cần cập nhật logic này dựa trên settings.fileNamePattern)
        const fname = `${sanitizeFile(inv.invoiceNo || `INV-${inv._index! + 1}`)}.pdf`
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
        progress.value = { value: 0, text: '' }; // Reset progress
      }, 2000)
    }
  }
  

  // --- Lifecycle & Watchers ---
  onMounted(() => {
    // Không tự động load/generate ở đây nữa, đợi file được load từ app.vue
    loadSettings() // Load settings trước
    if (state.rawRows.length > 0) {
      // Chỉ chạy auto guess nếu mapping chưa được load từ local storage
       const loadedMapping = loadMapping();
       if (Object.keys(loadedMapping).length === 0) {
          autoGuessMappings()
       } else {
         applySavedMapping()
       }
      generateAndPreview()
    }
  })


  watch(() => state.mapping, saveMapping, { deep: true })
  watch(() => state.settings, () => saveSettings(false), { deep: true })

  // Chạy lại generate khi mapping thay đổi
  watch(() => state.mapping, generateAndPreview, { deep: true });

  // --- **THÊM WATCH CHO rawRows ĐỂ AUTO GUESS VÀ GENERATE KHI FILE MỚI ĐƯỢC LOAD** ---
  watch(rawRows, (newRows) => {
      if (newRows.length > 0) {
          // Chỉ chạy auto guess nếu mapping chưa được load từ local storage hoặc không còn hợp lệ
          const loadedMapping = loadMapping();
          const currentHeaders = Object.keys(newRows[0] || {});
          const isLoadedMappingValid = Object.values(loadedMapping).every(val =>
              typeof val === 'boolean' || val === '' || currentHeaders.includes(val as string)
          );

          if (Object.keys(loadedMapping).length === 0 || !isLoadedMappingValid) {
              console.log("Auto guessing mappings...");
              autoGuessMappings();
          } else {
              console.log("Applying saved mapping...");
              applySavedMapping(); // Áp dụng mapping đã lưu nếu hợp lệ
          }
          generateAndPreview(); // Chạy generate sau khi có mapping
      } else {
          invoices.value = []; // Xóa invoices nếu không có dữ liệu
          selectedInvoiceIndices.value.clear();
      }
  }, { deep: true });


  return {
    state,
    headers,
    invoices,
    firstInvoice,
    isProcessing,
    progress,
    exportZip,
    // --- **EXPOSE STATE VÀ HÀM MỚI** ---
    selectedInvoiceIndices,
    toggleInvoiceSelection,
    selectAllInvoices,
    deselectAllInvoices,
    areAllInvoicesSelected,
  }
}
