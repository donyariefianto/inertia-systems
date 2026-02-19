<script>
  import { Link } from '@inertiajs/svelte'; // Import Link untuk navigasi SPA
  import SidebarItem from './SidebarItem.svelte';
  import ThemeSwitcher from './ThemeSwitcher.svelte';
  
  let { menuData, isOpen, onClose } = $props();
</script>

{#if isOpen}
  <div 
    role="presentation"
    class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" 
    onclick={onClose}
  ></div>
{/if}

<aside class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none {isOpen ? 'translate-x-0' : '-translate-x-full'}">
  
  <Link 
    href="/systems" 
    class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6 transition-all hover:bg-muted/50 active:scale-[0.98] group"
  >
    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
      <i class="fas fa-cube text-primary-foreground text-lg"></i>
    </div>
    <div class="flex flex-col">
      <span class="text-sm font-black tracking-tighter text-foreground uppercase">
        Sahabat <span class="text-primary">System</span>
      </span>
      <span class="text-[9px] font-bold text-muted-foreground leading-none tracking-[0.2em] uppercase">
        Enterprise
      </span>
    </div>
  </Link>

  <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
    {#if menuData && menuData.sidemenu}
      <div class="space-y-1">
        {#each menuData.sidemenu as item (item.id)}
          <SidebarItem {item} />
        {/each}
      </div>
    {/if}
  </nav>

  <div class="mt-auto border-t border-border bg-muted/30 p-4">
    <ThemeSwitcher />
    
    <div class="mt-4 flex items-center justify-between px-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
      <span>v2.4.0</span>
      <div class="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
    </div>
  </div>
</aside>

<style>
  /* Menghilangkan underline default dari Link */
  :global(a) {
    text-decoration: none;
  }
</style>