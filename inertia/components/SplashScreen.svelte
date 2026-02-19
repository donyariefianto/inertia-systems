<script>
  import { fade } from 'svelte/transition';
  import { splashState } from '~/stores/splash.svelte.ts';
</script>

{#if splashState.visible}
  <div 
    out:fade={{ duration: 400 }}
    class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-colors duration-300"
  >
    <div class="relative mb-6">
      <div class="absolute inset-0 animate-ping rounded-full bg-primary opacity-20"></div>
      <div class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
        <i class="fas fa-cube text-4xl"></i>
      </div>
    </div>
    <h1 class="text-2xl font-bold tracking-tight text-foreground">Sahabat<span class="text-primary">System</span></h1>
    <p class="mt-2 text-sm text-muted-foreground animate-pulse">Memuat modul enterprise...</p>
  </div>
{/if}