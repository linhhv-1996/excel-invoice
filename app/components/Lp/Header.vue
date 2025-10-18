<script setup>
defineEmits(['upload'])
</script>
<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/60 glass dark:border-white/10">
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
      <a href="/" class="flex items-center gap-2 font-extrabold tracking-tight">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs text-white dark:bg-white dark:text-ink">EX</span>
        <span>Excel → Invoice</span>
      </a>
      <nav class="items-center gap-6 text-sm md:flex">
        <a href="#features" class="hover:opacity-80">Features</a>
        <a href="#how" class="hover:opacity-80">How it works</a>
        <a href="#faq" class="hover:opacity-80">FAQ</a>
      </nav>
      <div class="flex items-center gap-2">
        <a href="/invoice_template.xlsx" download class="nb-btn nb-btn-ghost nb-btn-sm md:inline-flex">Download sample</a>
        <button @click="$emit('upload')" class="nb-btn nb-btn-primary nb-btn-sm">Upload Excel</button>
      </div>
    </div>
  </header>
</template>
