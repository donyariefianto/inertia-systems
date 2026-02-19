<script>
  import SidebarItem from './SidebarItem.svelte';
  import { themeState, toggleDarkMode } from '~/stores/theme.svelte.ts';
  
  let { menuData, isOpen, onClose } = $props();
</script>

{#if isOpen}
  <div 
    role="button"
    tabindex="0"
    aria-label="Tutup Navigasi"
    class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in" 
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  ></div>
{/if}

<aside 
  class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none
  {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  <div class="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
    <div class="flex items-center gap-2">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
        <i class="fas fa-layer-group text-sm"></i>
      </div>
      <span class="text-lg font-bold tracking-tight text-foreground">Sahabat<span class="text-primary">System</span></span>
    </div>
    <button 
      type="button" 
      aria-label="Tutup Menu" 
      class="lg:hidden text-muted-foreground hover:text-foreground p-1" 
      onclick={onClose}
    >
      <i class="fas fa-times text-xl"></i>
    </button>
  </div>

  <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
    {#if menuData && menuData.sidemenu}
      <div class="space-y-1 animate-fade-in">
        {#each menuData.sidemenu as item (item.id)}
          <SidebarItem {item} />
        {/each}
      </div>
    {:else}
      <div class="space-y-4 animate-pulse px-2">
        <div class="h-4 w-24 rounded bg-muted/60"></div>
        {#each Array(5) as _}
          <div class="h-10 w-full rounded-md bg-muted/40"></div>
        {/each}
      </div>
    {/if}
  </nav>

  <div class="p-4 border-t border-border bg-card/50">
    <button 
      type="button"
      onclick={toggleDarkMode}
      class="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
    >
      <i class="fas {themeState.mode === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'}"></i>
      <span>{themeState.mode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
    </button>
  </div>
</aside>