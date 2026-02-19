<script>
  import { Link, page } from '@inertiajs/svelte';

  let { item, depth = 0 } = $props();
  let isOpen = $state(false);

  // 1. Amankan penulisan path URL
  const safePath = $derived.by(() => {
    if (!item.path) return null;
    return item.path.startsWith('/systems') ? item.path : `/systems/${item.path}`;
  });

  // 2. Deteksi aktif secara Real-time (Pure Derived)
  const isActive = $derived.by(() => {
    const currentUrl = $page.url.split('?')[0];
    if (safePath === currentUrl) return true;
    
    // Aktifkan folder jika halaman anaknya sedang diakses
    if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
      return item.sub_sidemenu.some(sub => {
        const subP = sub.path?.startsWith('/') ? sub.path : `/${sub.path}`;
        return currentUrl.startsWith(subP);
      });
    }
    return false;
  });

  // 3. Lencana Visual berdasarkan Tipe (Enterprise UX)
  const typeBadge = $derived.by(() => {
    if (!item.type) return null;
    switch(item.type.toLowerCase()) {
      case 'chartview': 
        return { label: 'CHART', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'tableview': 
        return { label: 'TABLE', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'settings': 
        return { label: 'CONFIG', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      default: 
        return null;
    }
  });

  // 4. Auto-open folder HANYA jika aktif dan belum terbuka
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
             {isActive || isOpen ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      style="padding-left: {indent}"
    >
      <div class="flex items-center gap-3">
        <i class="{item.icon || 'fas fa-folder'} w-5 text-center transition-colors {isActive ? 'text-primary' : ''}"></i>
        <span>{item.name}</span>
      </div>
      <i class="fas fa-chevron-right text-[10px] transition-transform duration-200 {isOpen ? 'rotate-90' : ''}"></i>
    </button>

    {#if isOpen}
      <div class="mt-1 space-y-0.5 overflow-hidden animate-fade-in">
        {#each item.sub_sidemenu as sub (sub.id)}
          <!-- svelte-ignore svelte_self_deprecated -->
          <svelte:self item={sub} depth={depth + 1} />
        {/each}
      </div>
    {/if}

  {:else if safePath}
    <Link
      href={safePath}
      class="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
             {isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      style="padding-left: {indent}"
    >
      <div class="flex items-center gap-3">
        <i class="{item.icon || 'fas fa-circle'} w-5 text-center transition-colors {isActive ? 'text-primary-foreground' : 'group-hover:text-foreground'}"></i>
        <span>{item.name}</span>
      </div>

      {#if typeBadge}
        <span class="text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-tighter transition-colors {typeBadge.class} {isActive ? 'bg-white/20 text-white border-white/40' : ''}">
          {typeBadge.label}
        </span>
      {/if}
    </Link>
  {/if}
</div>