<script setup>
defineEmits(['upload'])
</script>
<template>
 <section class="relative overflow-hidden">
    <div class="mx-auto max-w-5xl px-4 py-14 md:py-20">
      <div class="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span class="nb-badge inline-flex items-center gap-2">10× faster than manual entry • No code</span>
          <h1 class="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
            Upload Excel → export <span class="underline decoration-banana decoration-2 underline-offset-8">PDF invoices</span>
          </h1>
          <p class="mt-3 max-w-xl text-slate-600 dark:text-slate-300 text-base md:text-lg">
            Drag & drop your spreadsheet, map columns once, then export. Auto numbering, branding, taxes & currencies.
          </p>
          <div class="mt-5 flex flex-nowrap items-center gap-2 md:gap-3">
            <button @click="$emit('upload')" class="nb-btn nb-btn-primary nb-btn-md inline-flex items-center whitespace-nowrap">Upload Excel</button>
            <a href="/invoice_template.xlsx" download class="nb-btn nb-btn-ghost nb-btn-md">Download sample Excel</a>
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">Client‑side by default · Nothing leaves your browser</div>
        </div>

        <div class="relative">
          <div class="absolute -inset-6 -z-10 rounded-3xl blur-3xl opacity-20" style="background: radial-gradient(600px 300px at 80% 10%, #93C5FD, transparent), radial-gradient(600px 300px at 10% 90%, #A7F3D0, transparent)"></div>
          <div class="mx-auto w-full max-w-sm rotate-0 rounded-2xl bg-white p-4 shadow-nb ring-1 ring-slate-200/60 dark:bg-ink dark:ring-white/10">
            <div class="invoice rounded-xl border border-slate-200 bg-white p-5 text-slate-800 dark:border-white/10 dark:bg-[rgb(17,24,39)] dark:text-slate-100">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2">
                  <div class="grid h-7 w-7 place-items-center rounded-lg bg-ink text-xs font-extrabold text-white dark:bg-white dark:text-ink">EX</div>
                  <div class="text-sm font-bold">Excel → Invoice</div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] uppercase tracking-[0.18em] text-slate-500">INVOICE</div>
                  <div class="text-sm font-semibold">#000237</div>
                  <div class="text-[11px] text-slate-500">Oct 18, 2025</div>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div class="text-[11px] font-semibold text-slate-500">Bill To</div>
                  <div class="font-medium">Acme Co.</div>
                  <div class="text-slate-500">billing@acme.com</div>
                </div>
                <div class="text-right">
                  <div class="text-[11px] font-semibold text-slate-500">From</div>
                  <div class="font-medium">Your Studio LLC</div>
                  <div class="text-slate-500">hello@yourstudio.com</div>
                </div>
              </div>

              <div class="mt-4 overflow-hidden rounded-lg border border-slate-200 text-[12px] dark:border-white/10">
                <div class="grid grid-cols-12 bg-slate-50/70 p-2 font-semibold dark:bg-white/5">
                  <div class="col-span-7">Description</div>
                  <div class="col-span-2 text-right">Qty</div>
                  <div class="col-span-3 text-right">Amount</div>
                </div>
                <div class="divide-y divide-slate-200 dark:divide-white/10">
                  <div class="grid grid-cols-12 p-2">
                    <div class="col-span-7">Design work – October</div>
                    <div class="col-span-2 text-right">1</div>
                    <div class="col-span-3 text-right">$1,200.00</div>
                  </div>
                  <div class="grid grid-cols-12 p-2">
                    <div class="col-span-7">Development sprint</div>
                    <div class="col-span-2 text-right">1</div>
                    <div class="col-span-3 text-right">$2,300.00</div>
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-4 text-[13px]">
                <div class="text-[11px] text-slate-500">Notes: Thank you for your business.</div>
                <div class="space-y-1">
                  <div class="flex justify-between"><span class="text-slate-500">Subtotal</span><span>$3,500.00</span></div>
                  <div class="flex justify-between"><span class="text-slate-500">VAT (10%)</span><span>$350.00</span></div>
                  <div class="flex justify-between border-t border-dashed border-slate-300 pt-2 font-bold dark:border-white/20"><span>Total</span><span>$3,850.00</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
