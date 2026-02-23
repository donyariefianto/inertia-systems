<script>
  import { themeState, toggleDarkMode, setThemeColor } from '~/stores/theme.svelte.ts'
  let { isCollapsed = false } = $props()

  const colorThemes = [
    { id: 'default', name: 'Zinc', colorClass: 'bg-zinc-500' },
    { id: 'forest', name: 'Forest', colorClass: 'bg-emerald-500' },
    { id: 'ocean', name: 'Ocean', colorClass: 'bg-blue-500' },
  ]
</script>

<div
  class="mx-auto flex {isCollapsed
    ? 'flex-col py-3 w-12'
    : 'flex-row px-3 py-2.5 w-full'} items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/40 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-300"
>
  <button
    type="button"
    onclick={toggleDarkMode}
    class="group relative flex shrink-0 items-center justify-center rounded-full transition-all duration-300 focus:outline-none hover:ring-2 hover:ring-primary/20
           {isCollapsed ? 'h-8 w-8 bg-muted/50' : 'h-7 w-12 bg-muted/60 p-1'}"
    title="Toggle Theme"
  >
    {#if isCollapsed}
      <i
        class="fas {themeState.mode === 'dark'
          ? 'fa-moon text-primary'
          : 'fa-sun text-amber-500'} text-xs transition-transform group-hover:scale-110"
      ></i>
    {:else}
      <div
        class="absolute left-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] {themeState.mode ===
        'dark'
          ? 'translate-x-5'
          : 'translate-x-0'}"
      >
        <i
          class="fas {themeState.mode === 'dark'
            ? 'fa-moon text-[9px] text-primary'
            : 'fa-sun text-[9px] text-amber-500'}"
        ></i>
      </div>
    {/if}
  </button>

  <div
    class="bg-border/60 transition-all duration-300 {isCollapsed ? 'h-px w-6' : 'h-5 w-px'}"
  ></div>

  <div class="flex {isCollapsed ? 'flex-col' : 'flex-row'} items-center gap-2">
    {#each colorThemes as theme}
      <button
        type="button"
        onclick={() => setThemeColor(theme.id)}
        class="relative shrink-0 rounded-full transition-all duration-300 focus:outline-none hover:scale-125
               {isCollapsed ? 'h-4 w-4' : 'h-4 w-4'}
               {theme.colorClass}
               {themeState.colorTheme === theme.id
          ? 'ring-[2.5px] ring-primary ring-offset-2 ring-offset-card scale-110 shadow-sm opacity-100'
          : 'opacity-50 hover:opacity-100'}"
        title={theme.name}
      ></button>
    {/each}
  </div>
</div>
