<script>
  import MainLayout from '~/layouts/MainLayout.svelte'
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  // 'path' dikirim dari Controller
  let { path } = $props();
  
  // State untuk mengontrol visibilitas agar transisi 'in' berjalan
  let isMounted = $state(false);

  onMount(() => {
    // Memberikan sedikit jeda sebelum memulai animasi masuk
    setTimeout(() => {
      isMounted = true;
    }, 300);
  });
</script>

<MainLayout>
  {#if isMounted}
    <div 
      class="flex h-[60vh] flex-col items-center justify-center"
      in:fade={{ duration: 600 }}
      out:fade={{ duration: 400 }}
    >
      <div 
        class="relative flex h-24 w-24 items-center justify-center"
        in:fly={{ y: 20, duration: 800, delay: 200 }}
      >
        <div class="absolute inset-0 animate-pulse rounded-full bg-primary/5 blur-2xl"></div>
        
        <div class="absolute inset-0 animate-[ping_3s_linear_infinite] rounded-full border border-primary/20 opacity-20"></div>
        
        <div class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/50 shadow-xl shadow-primary/5">
           <i class="fas fa-circle-notch fa-spin text-2xl text-primary"></i>
        </div>
      </div>

      <div 
        class="mt-8 text-center"
        in:fly={{ y: 10, duration: 800, delay: 400 }}
      >
        <p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">
          System Orchestrator
        </p>
        
        <div class="mt-4 flex flex-col items-center gap-1">
          <p class="text-sm font-medium text-foreground">
            Menyiapkan modul <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-primary">/{path?.split('/').pop()}</span>
          </p>
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] italic text-muted-foreground/70">Menyisir dependensi sistem...</span>
            <div class="flex gap-1">
                <span class="h-1 w-1 animate-bounce rounded-full bg-primary/40" style="animation-delay: 0ms"></span>
                <span class="h-1 w-1 animate-bounce rounded-full bg-primary/40" style="animation-delay: 150ms"></span>
                <span class="h-1 w-1 animate-bounce rounded-full bg-primary/40" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</MainLayout>

<style>
  /* Kustomisasi timing spinner agar lebih elegan (tidak terlalu kencang) */
  :global(.fa-spin) {
    animation-duration: 1.5s !important;
  }
</style>