// composables/usePdfGenerator.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Invoice, Settings } from './useInvoiceGenerator'

export function usePdfGenerator() {
  const renderPdf = async (invoice: Invoice, settings: Settings, opts: { watermark?: boolean } = {}) => {
    const pdfDoc = await PDFDocument.create()
    const A4 = { w: 595.28, h: 841.89 }
    const m = { top: 40, right: 40, bottom: 50, left: 40 }

    let page = pdfDoc.addPage([A4.w, A4.h])
    let { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const green = rgb(0.09, 0.64, 0.29)
    const grey = rgb(0.35, 0.35, 0.35)
    const lightGrey = rgb(0.9, 0.9, 0.9)
    const black = rgb(0, 0, 0)

    const tw = width - m.left - m.right
    const cols = { desc: 0.60, qty: 0.10, unit: 0.15, total: 0.15 }
    const x1 = m.left
    const x2 = m.left + tw * cols.desc
    const x3 = x2 + tw * cols.qty
    const x4 = x3 + tw * cols.unit
    const wDesc = tw * cols.desc
    const wQty = tw * cols.qty
    const wUnit = tw * cols.unit
    const wTot = tw * cols.total

    const pad = 10; const lh = 12
    let y = height - m.top

    const draw = (text: string, x: number, y0: number, size = 10, f = font, color: any) => page.drawText(String(text ?? ''), { x, y: y0, size, font: f, color })
    const right = (text: string, xRight: number, y0: number, size = 10, f = font, color: any) => {
      const t = String(text ?? '')
      const w = f.widthOfTextAtSize(t, size)
      page.drawText(t, { x: xRight - w, y: y0, size, font: f, color })
    }
    const wrap = (text: string, maxW: number, f = font, size = 10) => {
      const words = String(text || '').split(/\s+/)
      const lines: string[] = []
      let line = ''
      for (const w of words) {
        const t = line ? `${line} ${w}` : w
        if (f.widthOfTextAtSize(t, size) > maxW && line) {
          lines.push(line)
          line = w
        }
        else {
          line = t
        }
      }
      if (line) lines.push(line)
      return lines.length ? lines : ['']
    }
    const tableHeader = () => {
      page.drawRectangle({ x: m.left, y: y - 4, width: tw, height: 20, color: rgb(0.95, 0.95, 0.95) })
      draw('Description', x1 + pad, y, 10, bold, grey)
      right('Qty', x2 + wQty - pad, y, 10, bold, grey)
      right('Unit Price', x3 + wUnit - pad, y, 10, bold, grey)
      right('Total', x4 + wTot - pad, y, 10, bold, grey)
    }
    const ensure = (need: number, includeHeader = false) => {
      const extra = includeHeader ? 40 : 0
      if (y - (need + extra) < m.bottom) {
        page = pdfDoc.addPage([A4.w, A4.h]);
        ({ width, height } = page.getSize())
        y = height - m.top
        tableHeader()
        y -= 25
      }
    }

    // Header and Meta info (không đổi)
    draw('INVOICE', m.left, y, 18, bold, black)
    right(settings.cName || '', width - m.right, y, 11, bold, undefined)
    y -= 16
    const addr = [settings.cAddr, settings.cTax ? (`TAX: ${settings.cTax}`) : ''].filter(Boolean).join(' • ')
    right(addr, width - m.right, y, 9, font, grey)
    y -= 28
    draw('Billed To', m.left, y, 9, font, grey)
    draw(invoice.customer || '', m.left, y - 14, 11, bold, undefined)
    const metaY = y
    y -= 32
    if (invoice.email) { draw(invoice.email, m.left, y, 10, font, undefined); y -= 14 }
    if (invoice.groupBy) { draw(`Project/Group: ${invoice.groupBy}`, m.left, y, 10, font, undefined); y -= 14 }
    const xRight = width - m.right
    right('Invoice Number', xRight, metaY, 9, font, grey)
    right(invoice.invoiceNo || '', xRight, metaY - 14, 11, bold, undefined)
    right('Date of Issue', xRight, metaY - 32, 9, font, grey)
    right(new Date().toLocaleDateString(), xRight, metaY - 46, 11, bold, undefined)
    const dateBaseline = metaY - 46
    const dateTextH = 12
    const metaBottom = dateBaseline - dateTextH
    const gapBeforeTable = 24
    y = Math.min(y, metaBottom - gapBeforeTable)
    ensure(0)

    // Table header
    tableHeader()
    y -= 25

    let sum = 0
    for (const l of invoice.lines) {
      const descLines = wrap(l.desc, wDesc - pad * 2, font, 10)
      // Thêm padding vào tính toán chiều cao row
      const rowH = Math.max(descLines.length * lh, 14) + 6
      ensure(rowH, true)

      // Vẽ text (căn lề trên cùng của row)
      const topOfRow = y
      let ry = topOfRow
      for (const dl of descLines) {
        draw(dl, x1 + pad, ry, 10, font, undefined)
        ry -= lh
      }
      right(String(l.qty), x2 + wQty - pad, topOfRow, 10, font, undefined)
      right(moneyStr(l.unit, settings.currency), x3 + wUnit - pad, topOfRow, 10, font, undefined)
      right(moneyStr(l.total, settings.currency), x4 + wTot - pad, topOfRow, 10, bold, undefined)

      // Cập nhật tổng tiền
      sum += (l.total || 0)

      // **FIX:** Di chuyển con trỏ y xuống dưới cùng của row vừa vẽ
      y -= rowH

      // **FIX:** Vẽ đường kẻ ở vị trí y hiện tại (đáy của row)
      page.drawLine({
        start: { x: m.left, y },
        end: { x: width - m.right, y },
        thickness: 0.5,
        color: lightGrey,
      })
    }

    // Grand Total (không đổi)
    y -= 20
    ensure(28)
    right('Grand Total', x4 - pad, y, 12, bold, black)
    right(moneyStr(sum, settings.currency), width - m.right, y, 12, bold, black)

    if (opts.watermark) {
      page.drawText('WATERMARK', { x: 120, y: 420, size: 70, font: bold, color: rgb(0, 0, 0), rotate: { type: 'degrees', angle: -30 }, opacity: 0.05 })
    }

    return await pdfDoc.save()

    function moneyStr(n: number, cur: string) {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(Number(n || 0))
      }
      catch { return String(n || 0) }
    }
  }

  return { renderPdf }
}

