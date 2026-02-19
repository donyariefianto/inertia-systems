<script>
  import { Link, page } from '@inertiajs/svelte';
  import SidebarItem from './SidebarItem.svelte'; // Pengganti svelte:self untuk Svelte 5

  let { item, depth = 0 } = $props();
  let isOpen = $state(false);

  // 1. PATH NORMALIZATION: Pastikan selalu berawalan /systems/ jika tidak ada
  const safePath = $derived.by(() => {
    if (!item.path) return null;
    const cleanPath = item.path.replace(/^\//, ''); // Hapus slash di depan
    return cleanPath.startsWith('systems/') ? `/${cleanPath}` : `/systems/${cleanPath}`;
  });

  // 2. PRECISION ACTIVE MATCHING
  const isActive = $derived.by(() => {
    const currentUrl = $page.url.split('?')[0]; // Abaikan query parameter
    if (safePath === currentUrl) return true;
    
    if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
      return item.sub_sidemenu.some(sub => {
        const subClean = sub.path?.replace(/^\//, '');
        const subPath = subClean.startsWith('systems/') ? `/${subClean}` : `/systems/${subClean}`;
        return currentUrl.startsWith(subPath);
      });
    }
    return false;
  });

  // 3. ENTERPRISE TYPE BADGES
  const typeBadge = $derived.by(() => {
    if (!item.type) return null;
    switch(item.type.toLowerCase()) {
      case 'chartview': return { label: 'CHART', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'tableview': return { label: 'TABLE', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'settings': return { label: 'CONFIG', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      default: return null;
    }
  });

  // 4. AUTO-EXPAND BEHAVIOR
  $effect(() => {
    if (isActive && item.sub_sidemenu && !isOpen) {
      isOpen = true;
    }
  });

  const indent = $derived(`${1 + depth * 0.75}rem`);
</script>

<div class="w-full mb-0.5">
  {#if item.sub_sidemenu && item.sub_sidemenu.length > 0}
    <button
      type="button"
      aria-expanded={isOpen}
      onclick={() => (isOpen = !isOpen)}
      class="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
             {isActive || isOpen ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      style="padding-left: {indent}"
    >
      <div class="flex items-center gap-3">
        <i class="{item.icon || 'fas fa-folder'} w-5 text-center text-lg transition-transform duration-200 {isActive || isOpen ? 'scale-110' : ''}"></i>
        <span class="tracking-wide">{item.name}</span>
      </div>
      <i class="fas fa-chevron-right text-[10px] transition-transform duration-200 opacity-60 {isOpen ? 'rotate-90' : ''}"></i>
    </button>

    {#if isOpen}
      <div class="mt-1 space-y-0.5 overflow-hidden animate-fade-in relative before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border/50">
        {#each item.sub_sidemenu as sub (sub.id)}
          <SidebarItem item={sub} depth={depth + 1} />
        {/each}
      </div>
    {/if}

  {:else if safePath}
    <Link
      href={safePath}
      class="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
             {isActive ? 'bg-primary text-primary-foreground shadow-md font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      style="padding-left: {indent}"
    >
      <div class="flex items-center gap-3">
        <i class="{item.icon || 'fas fa-circle text-[8px]'} w-5 text-center text-lg transition-transform duration-200 {isActive ? 'scale-110' : ''}"></i>
        <span class="tracking-wide">{item.name}</span>
      </div>
      
      {#if typeBadge}
        <span class="text-[9px] px-1.5 py-0.5 rounded border font-black tracking-tighter transition-colors {typeBadge.class} {isActive ? 'bg-white/20 text-white border-white/40' : ''}">
          {typeBadge.label}
        </span>
      {/if}
    </Link>
  {/if}
</div>