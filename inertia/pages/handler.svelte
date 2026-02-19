<script>
  import MainLayout from '~/layouts/MainLayout.svelte';
  
  // 'path' dikirim dari Controller untuk keperluan debugging/logging jika perlu
  let { path } = $props();
</script>

<MainLayout>
  <div class="flex h-[60vh] flex-col items-center justify-center animate-pulse">
    <div class="relative flex h-20 w-20 items-center justify-center">
      <div class="absolute inset-0 animate-ping rounded-full bg-primary opacity-10"></div>
      <i class="fas fa-circle-notch fa-spin text-3xl text-primary/40"></i>
    </div>
    <div class="mt-6 text-center">
      <p class="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        System Orchestrator
      </p>
      <p class="mt-2 text-sm italic text-muted-foreground">
        Menyiapkan modul <span class="font-bold text-foreground">/{path?.split('/').pop()}</span>...
      </p>
    </div>
  </div>
</MainLayout>