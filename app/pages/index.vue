<script setup lang="ts">
import { useFileUploader } from '~/composables/useFileUploader';

// Chỉ cần lấy hàm trigger từ composable
const { triggerFileInput } = useFileUploader();
</script>

<template>
  <div class="bg-radial">
    <LpHeader @upload="triggerFileInput" />
    <main>
      <LpHero @upload="triggerFileInput" />
      
      <section id="features" class="mx-auto max-w-5xl px-4 py-16">
        <div class="mb-8 text-center">
            <div
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                Why teams love Excel → Invoice</div>
            <h2 class="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Features built for speed & accuracy
            </h2>
            <p class="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Everything you need to go from
                spreadsheet to polished PDF—fast, private, and reliable.</p>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="nb-card p-6 shadow-nb">
                <div class="flex items-center gap-2 text-lg font-bold"><span>📥</span><span>Drag & Drop +
                        Mapping</span></div>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Smart column detection. Map once and it’s
                    remembered for next time.</p>
            </div>
            <div class="nb-card p-6 shadow-nb">
                <div class="flex items-center gap-2 text-lg font-bold"><span>🧾</span><span>Beautiful
                        Templates</span></div>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Polished, print‑ready layouts with logo,
                    colors, fonts, auto numbering.</p>
            </div>
            <div class="nb-card p-6 shadow-nb">
                <div class="flex items-center gap-2 text-lg font-bold"><span>📦</span><span>Batch Export</span>
                </div>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Export many PDFs at once and download as
                    a single ZIP.</p>
            </div>
            <div class="nb-card p-6 shadow-nb md:col-span-2">
                <div class="flex items-center gap-2 text-lg font-bold"><span>💱</span><span>Taxes &
                        Currencies</span></div>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">VAT/GST support, multi‑currency, and
                    local date/number formatting.</p>
            </div>
            <div class="nb-card p-6 shadow-nb">
                <div class="flex items-center gap-2 text-lg font-bold"><span>🔒</span><span>Data Privacy</span>
                </div>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Client‑side processing by default.
                    Nothing leaves your browser unless you opt‑in.</p>
            </div>
        </div>
    </section>
            <section id="how" class="mx-auto max-w-5xl px-4 pb-12">
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-extrabold tracking-tight">How it works</h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300">3 simple steps to export PDF invoices from your Excel.</p>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="nb-card p-5">
        <div class="nb-badge">Step 1</div>
        <div class="mt-2 text-lg font-bold">Upload Excel</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Drag & drop or choose .xlsx/.csv.</p>
      </div>
      <div class="nb-card p-5">
        <div class="nb-badge">Step 2</div>
        <div class="mt-2 text-lg font-bold">Map Columns</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Select customer name, email, totals, tax, etc.</p>
      </div>
      <div class="nb-card p-5">
        <div class="nb-badge">Step 3</div>
        <div class="mt-2 text-lg font-bold">Export PDF</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Pick a template, preview, and download PDF/ZIP.</p>
      </div>
    </div>
  </section>
            <section id="faq" class="mx-auto max-w-5xl px-4 pb-14">
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-extrabold tracking-tight">FAQ</h2>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="nb-card p-4">
        <div class="font-semibold">Do you upload my data to a server?</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">By default everything runs in your browser. You can opt‑in to sync configs to the cloud for multi‑device use.</p>
      </div>
      <div class="nb-card p-4">
        <div class="font-semibold">Which formats are supported?</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">.xlsx and .csv. Export single PDFs or a ZIP of many files.</p>
      </div>
      <div class="nb-card p-4">
        <div class="font-semibold">Can I add my logo and brand colors?</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Yes. Upload PNG/SVG logo, set a primary color, and choose fonts.</p>
      </div>
      <div class="nb-card p-4">
        <div class="font-semibold">Does it support VAT/GST and multiple currencies?</div>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Absolutely. Configure tax rates, currency symbols, and locale formatting.</p>
      </div>
    </div>
  </section>
      <LpCta @upload="triggerFileInput" />
    </main>
    </div>
</template>
