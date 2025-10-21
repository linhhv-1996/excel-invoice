// app/composables/useFileUploader.ts
import * as XLSX from 'xlsx';
import { useNotification } from '~/composables/useNotification';
import { useDb } from '~/composables/useDb';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useExcelData } from '~/composables/useSharedState';

const fileInput = ref<HTMLInputElement | null>(null);

type Merge = { s: { r: number; c: number }, e: { r: number; c: number } };

function valueOf(cell?: XLSX.CellObject): any {
  if (!cell) return '';
  const shown = (cell as any).w;
  if (shown !== undefined && shown !== null && String(shown) !== '') return shown;
  const raw = cell.v;
  return raw !== undefined && raw !== null ? raw : '';
}

function computeBounds(ws: XLSX.WorkSheet) {
  const keys = Object.keys(ws).filter(k => k[0] !== '!');
  if (keys.length === 0) return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  let minR = Infinity, minC = Infinity, maxR = -1, maxC = -1;
  for (const addr of keys) {
    const p = XLSX.utils.decode_cell(addr);
    if (p.r < minR) minR = p.r;
    if (p.c < minC) minC = p.c;
    if (p.r > maxR) maxR = p.r;
    if (p.c > maxC) maxC = p.c;
  }
  const merges: Merge[] = (ws['!merges'] as any) || [];
  for (const m of merges) {
    if (m.s.r < minR) minR = m.s.r;
    if (m.s.c < minC) minC = m.s.c;
    if (m.e.r > maxR) maxR = m.e.r;
    if (m.e.c > maxC) maxC = m.e.c;
  }
  if (!isFinite(minR) || !isFinite(minC)) return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  return { s: { r: minR, c: minC }, e: { r: maxR, c: maxC } };
}

function buildMergeLookup(merges: Merge[]) {
  return {
    find(r: number, c: number): Merge | null {
      for (const m of merges) {
        if (r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) return m;
      }
      return null;
    }
  };
}

function nonEmptyCount(row: any[]) {
  return (row || []).filter(v => v !== '' && v !== undefined && v !== null).length;
}

function isUniformNonEmpty(row: any[]) {
  const vals = (row || []).filter(v => v !== '' && v !== undefined && v !== null).map(String);
  if (vals.length === 0) return false;
  return new Set(vals).size === 1;
}

function looksNumericOrDate(v: any) {
  if (v === '' || v === undefined || v === null) return false;
  if (typeof v === 'number') return true;
  if (v instanceof Date) return true;
  if (typeof v === 'string' && /^-?\d+([.,]\d+)?$/.test(v.trim())) return true;
  if (typeof v === 'string' && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(v)) return true;
  return false;
}

function rowNumericRatio(row: any[]) {
  const vals = (row || []).filter(v => v !== '' && v !== undefined && v !== null);
  if (vals.length === 0) return 0;
  const nums = vals.filter(looksNumericOrDate);
  return nums.length / vals.length;
}

function trimEmptyEdges(grid: any[][]) {
  let top = 0;
  while (top < grid.length && nonEmptyCount(grid[top]) === 0) top++;
  let bottom = grid.length - 1;
  while (bottom >= top && nonEmptyCount(grid[bottom]) === 0) bottom--;

  let sliced = grid.slice(top, bottom + 1);
  if (sliced.length === 0) return { grid: [[]], rowOffset: top, colOffset: 0 };

  const colLen = Math.max(...sliced.map(r => (r ? r.length : 0)));
  let left = 0, right = colLen - 1;
  const colNonEmpty = (c: number) => sliced.some(r => r && r[c] !== undefined && r[c] !== '' && r[c] !== null);
  while (left <= right && !colNonEmpty(left)) left++;
  while (right >= left && !colNonEmpty(right)) right--;

  const trimmed = sliced.map(r => {
    const arr = r || [];
    const segment = arr.slice(left, right + 1);
    if (segment.length < right - left + 1) {
      const fill = Array.from({ length: (right - left + 1) - segment.length }, () => '');
      return segment.concat(fill);
    }
    return segment;
  });

  return { grid: trimmed, rowOffset: top, colOffset: left };
}

/** Tạo header theo nguyên tắc: lấy NHÃN Ở LỚP SÂU NHẤT (hàng dưới cùng trong khối header) có giá trị. */
function buildHeadersPreferDeepest(headerRows: any[][], maxCols: number) {
  const headers: string[] = [];
  for (let c = 0; c < maxCols; c++) {
    let label = '';
    // đi từ dưới lên trên, gặp non-empty đầu tiên thì lấy luôn
    for (let r = headerRows.length - 1; r >= 0; r--) {
      const raw = headerRows[r]?.[c];
      const s = (raw !== undefined && raw !== null) ? String(raw).trim().replace(/\s+/g, ' ') : '';
      if (s) { label = s; break; }
    }
    headers.push(label || `Column_${c + 1}`);
  }
  // đảm bảo duy nhất
  const seen = new Map<string, number>();
  return headers.map(h => {
    const base = h;
    if (!seen.has(base)) { seen.set(base, 1); return base; }
    const n = (seen.get(base) || 1) + 1;
    seen.set(base, n);
    return `${base}_${n}`;
  });
}

export function useFileUploader() {
  const { showNotification } = useNotification();
  const { saveSession, clearSession } = useDb();
  const router = useRouter();
  const { rawRows, fileName } = useExcelData();

  const triggerFileInput = () => fileInput.value?.click();

  const handleFileChange = async (e: Event) => {
    const inputEl = e.target as HTMLInputElement;
    const file = inputEl?.files?.[0];
    if (!file) return;
    inputEl.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) {
          showNotification('Error: Could not read file buffer.');
          return;
        }

        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames?.[0];
        if (!sheetName) { showNotification('Error: No worksheet found.'); return; }
        const ws = wb.Sheets[sheetName];

        // 1) Build AOA + fill-merge toàn sheet
        const bounds = computeBounds(ws);
        const merges: Merge[] = (ws['!merges'] as any) || [];
        const mergeLookup = buildMergeLookup(merges);
        const rows = bounds.e.r - bounds.s.r + 1;
        const cols = bounds.e.c - bounds.s.c + 1;
        if (rows <= 0 || cols <= 0) { showNotification('Error: Empty sheet.'); return; }

        const grid: any[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const absR = bounds.s.r + r;
            const absC = bounds.s.c + c;
            const addr = XLSX.utils.encode_cell({ r: absR, c: absC });
            const cell = ws[addr];
            let v = valueOf(cell);
            if (v === '' || v === undefined) {
              const m = mergeLookup.find(absR, absC);
              if (m) {
                const tlAddr = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
                v = valueOf(ws[tlAddr]);
              }
            }
            grid[r][c] = v ?? '';
          }
        }

        // 2) Trim mép rỗng
        const { grid: G } = trimEmptyEdges(grid);
        if (!G.length || G.every(r => nonEmptyCount(r) === 0)) {
          showNotification('Error: No data found in the sheet.');
          return;
        }

        // 3) Xác định khối header 1–3 hàng
        const MAX_HEADER_DEPTH = 3;
        let start = 0;
        while (start < Math.min(G.length, 10) && isUniformNonEmpty(G[start])) start++;
        let headerDepth = 1;
        const probe = Math.min(G.length - start, 10);
        if (probe > 1) {
          let best = 1;
          for (let k = 1; k <= Math.min(MAX_HEADER_DEPTH, probe - 1); k++) {
            const nextRow = G[start + k] || [];
            const prevRow = G[start + k - 1] || [];
            if (rowNumericRatio(nextRow) >= rowNumericRatio(prevRow) + 0.2) { best = k; break; }
          }
          headerDepth = best;
        }
        headerDepth = Math.max(1, Math.min(headerDepth, Math.min(MAX_HEADER_DEPTH, G.length)));

        const headerRows = G.slice(start, start + headerDepth);
        const afterHeader = G.slice(start + headerDepth, start + headerDepth + 200);
        const maxCols = Math.max(
          ...[headerRows, afterHeader].flat().map(r => (r ? r.length : 0)),
          headerRows.length ? headerRows[0].length : 0
        ) || (G[0]?.length ?? 1);

        const norm = (r: any[]) => {
          const arr = r || [];
          if (arr.length >= maxCols) return arr.slice(0, maxCols);
          return arr.concat(Array.from({ length: maxCols - arr.length }, () => ''));
        };
        const headerRowsNorm = headerRows.map(norm);

        // >>> Thay đổi chính: chỉ lấy NHÃN Ở LỚP DƯỚI CÙNG
        const headers = buildHeadersPreferDeepest(headerRowsNorm, maxCols);

        const dataRows = G.slice(start + headerDepth).map(norm).filter(r => nonEmptyCount(r) > 0);
        if (!dataRows.length) { showNotification('Error: No data rows found under the header.'); return; }

        const finalJsonData = dataRows.map(row => {
          const obj: Record<string, any> = {};
          for (let i = 0; i < maxCols; i++) {
            obj[headers[i]] = row[i] !== undefined && row[i] !== null ? row[i] : '';
          }
          return obj;
        });

        if (!finalJsonData.length) { showNotification('Error: No data found after processing merges.'); return; }

        await clearSession();
        await saveSession(file.name, finalJsonData);

        rawRows.value = finalJsonData;
        fileName.value = file.name;

        if (router.currentRoute.value.path === '/app') {
          window.location.reload();
        } else {
          await router.push('/app');
        }
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        showNotification(`Error parsing Excel file: ${err?.message || 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      showNotification('Error reading file.');
    };

    reader.readAsArrayBuffer(file);
  };

  return {
    fileInput,
    triggerFileInput,
    handleFileChange,
  };
}
