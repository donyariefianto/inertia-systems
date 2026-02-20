<script>
  import { Link } from '@inertiajs/svelte'
  import SidebarItem from '~/components/SidebarItem.svelte'
  import ThemeSwitcher from '~/components/ThemeSwitcher.svelte'
  import { fade } from 'svelte/transition'

  // Terima props dari MainLayout
  let { isDesktopCollapsed, menuData, isOpen, onClose } = $props()
</script>

{#if isOpen}
  <div
    role="presentation"
    class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity"
    onclick={onClose}
    in:fade
    out:fade
  ></div>
{/if}

<aside
  class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none {isOpen
    ? 'translate-x-0'
    : '-translate-x-full'} {isDesktopCollapsed ? 'w-20' : 'w-64'} overflow-x-hidden"
>
  <Link
    href="/systems"
    class="flex h-16 shrink-0 items-center border-b border-border transition-all hover:bg-muted/50 active:scale-[0.98] group overflow-hidden
           {isDesktopCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}"
  >
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6"
    >
      <i class="fas fa-cube text-primary-foreground text-lg"></i>
    </div>

    {#if !isDesktopCollapsed}
      <div class="flex flex-col min-w-0" in:fade={{ duration: 200, delay: 100 }}>
        <span class="text-sm font-black tracking-tighter text-foreground uppercase truncate">
          Sahabat <span class="text-primary">System</span>
        </span>
        <span
          class="text-[9px] font-bold text-muted-foreground leading-none tracking-[0.2em] uppercase truncate"
        >
          Enterprise
        </span>
      </div>
    {/if}
  </Link>

  <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
    {#if menuData && menuData.sidemenu}
      <div class="space-y-1">
        {#each menuData.sidemenu as item (item.id)}
          <SidebarItem {item} isCollapsed={isDesktopCollapsed} />
        {/each}
      </div>
    {/if}
  </nav>

  <div class="mt-auto border-t border-border bg-muted/30 p-4 transition-all duration-300">
    <ThemeSwitcher isCollapsed={isDesktopCollapsed} />

    {#if !isDesktopCollapsed}
      <div
        class="mt-4 flex items-center justify-between px-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest"
        in:fade={{ duration: 200, delay: 100 }}
      >
        <span>v2.4.0</span>
        <div class="flex items-center gap-2">
          <span class="lowercase tracking-normal">Online</span>
          <div
            class="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
          ></div>
        </div>
      </div>
    {/if}
  </div>
</aside>

<style>
  :global(a) {
    text-decoration: none;
  }

  /* Hilangkan scrollbar horizontal saat mengecil */
  .custom-scrollbar {
    overflow-x: hidden !important;
  }
</style>
