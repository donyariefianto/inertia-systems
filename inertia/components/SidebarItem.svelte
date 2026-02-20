<script>
  import { Link, page } from '@inertiajs/svelte'
  import SidebarItem from './SidebarItem.svelte'
  import { slide } from 'svelte/transition'

  let { item, depth = 0, isCollapsed = false } = $props()
  let isOpen = $state(false)

  // 1. NORMALISASI PATH SECARA PRESISI
  const safePath = $derived.by(() => {
    if (!item.path) return null
    const cleanPath = item.path.replace(/^\//, '')
    return cleanPath.startsWith('systems/') ? `/${cleanPath}` : `/systems/${cleanPath}`
  })

  // 2. DETEKSI STATUS AKTIF (SUPPORT PARENT/CHILD)
  const isActive = $derived.by(() => {
    const currentUrl = $page.url.split('?')[0]
    if (safePath === currentUrl) return true

    if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
      return item.sub_sidemenu.some((sub) => {
        const subClean = sub.path?.replace(/^\//, '')
        const subPath = subClean.startsWith('systems/') ? `/${subClean}` : `/systems/${subClean}`
        return currentUrl.startsWith(subPath)
      })
    }
    return false
  })

  // 3. AUTO-EXPAND JIKA CHILD AKTIF
  $effect(() => {
    if (isActive && item.sub_sidemenu) isOpen = true
  })
</script>

<div class="relative w-full">
  {#if item.sub_sidemenu && item.sub_sidemenu.length > 0}
    <button
      type="button"
      onclick={() => !isCollapsed && (isOpen = !isOpen)}
      class="group relative flex h-10 w-full items-center rounded-xl transition-all duration-200 outline-none
             {isActive
        ? 'bg-primary/5 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
      title={isCollapsed ? item.name : ''}
    >
      {#if isActive && !isCollapsed}
        <div class="absolute -left-1.5 h-5 w-1 rounded-r-full bg-primary"></div>
      {/if}

      <div class="flex w-12 shrink-0 items-center justify-center">
        <i
          class="{item.icon ||
            'fas fa-folder'} text-[15px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] {isActive
            ? 'scale-110'
            : 'group-hover:scale-110'}"
        ></i>
      </div>

      <div
        class="flex flex-1 items-center justify-between pr-3 transition-opacity duration-300 {isCollapsed
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'}"
      >
        <span class="truncate text-[13px] font-semibold tracking-tight">{item.name}</span>
        <i
          class="fas fa-chevron-right text-[9px] opacity-40 transition-transform duration-300 {isOpen
            ? 'rotate-90'
            : ''}"
        ></i>
      </div>
    </button>

    {#if isOpen && !isCollapsed}
      <div
        class="mt-1 space-y-0.5 ml-5 pl-2.5 border-l-2 border-border/40 overflow-hidden"
        transition:slide={{ duration: 250, axis: 'y' }}
      >
        {#each item.sub_sidemenu as sub (sub.id)}
          <SidebarItem item={sub} depth={depth + 1} {isCollapsed} />
        {/each}
      </div>
    {/if}
  {:else if safePath}
    <Link
      href={safePath}
      class="group relative flex h-10 w-full items-center rounded-xl transition-all duration-200 outline-none
             {isActive
        ? 'bg-primary/10 text-primary shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
      title={isCollapsed ? item.name : ''}
    >
      {#if isActive && !isCollapsed}
        <div class="absolute -left-1.5 h-6 w-1 rounded-r-full bg-primary"></div>
      {/if}

      <div class="flex w-12 shrink-0 items-center justify-center">
        <i
          class="{item.icon ||
            'fas fa-circle text-[6px]'} text-[15px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] {isActive
            ? 'scale-110'
            : 'group-hover:scale-110'}"
        ></i>
      </div>

      <div
        class="flex flex-1 items-center justify-between pr-3 transition-opacity duration-300 {isCollapsed
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'}"
      >
        <span class="truncate text-[13px] font-semibold tracking-tight">{item.name}</span>
      </div>
    </Link>
  {/if}
</div>