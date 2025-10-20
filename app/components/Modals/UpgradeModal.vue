<script setup lang="ts">
defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])
</script>


<template>
    <div v-if="show" class="modal-backdrop">
        <div class="w-full max-w-2xl rounded-xl bg-white p-0 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 class="text-lg font-semibold text-ink">Upgrade Your Plan</h2>
                <button @click="$emit('close')"
                    class="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div class="p-5">
                <p class="text-[13px] text-slate-600 mb-4 text-center">Choose a plan that fits your needs. Unlock
                    powerful features and save hours of work.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    
                    <div class="rounded-lg border border-slate-300 p-4 flex flex-col">
                <div class="text-lg font-semibold text-ink">Personal</div>
                <div class="mt-1"><span class="text-3xl font-bold text-ink">$5</span><span class="text-slate-500">/ month</span></div>
                <p class="text-xs text-slate-500 h-10 mt-2">Perfect for freelancers and small businesses with moderate invoicing needs.</p>
                <button class="btn-primary mt-4 w-full justify-center">Choose Personal</button>
                <ul class="mt-4 space-y-2 text-sm text-slate-600">
                    <li class="flex gap-2">✓<span><strong class="font-medium text-ink">25</strong> invoices/month</span></li>
                    <li class="flex gap-2">✓<span>No Watermark</span></li>
                    <li class="flex gap-2">✓<span>All Templates</span></li>
                    <li class="flex gap-2">✓<span>Mapping Templates</span></li>
                    <li class="flex gap-2">✓<span>Multiple Sender Profiles</span></li>
                </ul>
            </div>

                    <div class="rounded-lg border-2 border-indigo-500 p-4 relative flex flex-col">
                <span class="absolute top-0 -translate-y-1/2 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Most Popular</span>
                <div class="text-lg font-semibold text-ink">Pro</div>
                <div class="mt-1"><span class="text-3xl font-bold text-ink">$12</span><span class="text-slate-500">/ month</span></div>
                <p class="text-xs text-slate-500 h-10 mt-2">For growing businesses and agencies that need unlimited scale.</p>
                <button class="btn-pro mt-4 w-full justify-center">Choose Pro</button>
                <ul class="mt-4 space-y-2 text-sm text-slate-600">
                    <li class="flex gap-2">✓<span><strong class="font-medium text-ink">Unlimited</strong> invoices</span></li>
                    <li class="flex gap-2">✓<span>No Watermark</span></li>
                    <li class="flex gap-2">✓<span>All Templates</span></li>
                    <li class="flex gap-2">✓<span>Mapping Templates</span></li>
                    <li class="flex gap-2">✓<span>Multiple Sender Profiles</span></li>
                    <li class="flex gap-2 font-semibold text-indigo-600">✓<span>Priority Support</span></li>
                </ul>
            </div>
                    
                </div>
            </div>
        </div>
    </div>
</template>
