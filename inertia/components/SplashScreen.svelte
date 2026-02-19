<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let visible = $state(true);
  let { onFinish } = $props();

  onMount(() => {
    // Tahan splash screen selama 1.5 detik
    setTimeout(() => {
      visible = false;
      if (onFinish) onFinish();
    }, 1500);
  });
</script>

{#if visible}
  <div 
    out:fade={{ duration: 400 }}
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-colors duration-300"
  >
    <div class="relative mb-6">
      <div class="absolute inset-0 animate-ping rounded-full bg-primary opacity-20"></div>
      <div class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
    </div>
    
    <h1 class="text-3xl font-bold tracking-tight text-foreground">
      ENTERPRISE<span class="text-primary">SYSTEM</span>
    </h1>
    <p class="mt-2 animate-pulse text-sm font-medium text-muted-foreground">
      Initiating Secure Environment...
    </p>
  </div>
{/if}