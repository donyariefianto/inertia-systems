<script>
  import ThemeSwitcher from '~/components/ThemeSwitcher.svelte';
  import SidebarItem from './SidebarItem.svelte';
  let { menuData, isOpen, onClose } = $props();
</script>

{#if isOpen}
  <div 
    role="button"
    tabindex="0"
    aria-label="Tutup Navigasi"
    class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden animate-fade-in" 
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  ></div>
{/if}

<aside 
  class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none
  {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  <div class="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
    <div class="flex items-center gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-inner shadow-primary-foreground/20">
        TB
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-black tracking-tight text-foreground leading-none">Sahabat<span class="text-primary">System</span></span>
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Enterprise</span>
      </div>
    </div>
    
    <button 
      type="button" 
      aria-label="Tutup Menu" 
      class="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" 
      onclick={onClose}
    >
      <i class="fas fa-times text-lg"></i>
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
      <div class="space-y-4 animate-pulse px-2 pt-2">
        <div class="h-3 w-20 rounded bg-muted/80"></div>
        {#each Array(6) as _}
          <div class="flex items-center gap-3 h-10 w-full rounded-lg bg-muted/40 px-3">
             <div class="h-5 w-5 rounded-md bg-muted/60 shrink-0"></div>
             <div class="h-3 w-3/4 rounded bg-muted/60"></div>
          </div>
        {/each}
      </div>
    {/if}
  </nav>
  <div class="mt-auto border-t border-border bg-muted/30 p-4">
    <ThemeSwitcher />
    
    <div class="mt-4 flex items-center justify-between px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
      <span>v2.4.0-Stable</span>
      <i class="fas fa-check-circle text-primary/50"></i>
    </div>
  </div>
</aside>