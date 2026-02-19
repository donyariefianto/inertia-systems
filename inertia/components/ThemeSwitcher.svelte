<script>
  import { themeState, toggleDarkMode, setThemeColor } from '~/stores/theme.svelte.ts';
  import { fade, scale } from 'svelte/transition';

  const colorThemes = [
    { id: 'default', name: 'Zinc', colorClass: 'bg-zinc-500' },
    { id: 'forest', name: 'Forest', colorClass: 'bg-emerald-500' },
    { id: 'ocean', name: 'Ocean', colorClass: 'bg-blue-500' }
  ];
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center gap-2 px-1">
    <i class="fas fa-palette text-[10px] text-muted-foreground"></i>
    <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interface Theme</span>
  </div>

  <div class="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 p-2.5 shadow-sm backdrop-blur-sm">
    
    <button 
      type="button"
      onclick={toggleDarkMode}
      class="group relative flex h-8 w-16 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50
             {themeState.mode === 'dark' ? 'bg-primary/20' : 'bg-muted'}"
      aria-label="Toggle Dark Mode"
    >
      <span class="absolute left-2 text-[10px] text-amber-500 transition-opacity duration-300 {themeState.mode === 'dark' ? 'opacity-50' : 'opacity-100'}">
        <i class="fas fa-sun"></i>
      </span>
      <span class="absolute right-2 text-[10px] text-primary transition-opacity duration-300 {themeState.mode === 'dark' ? 'opacity-100' : 'opacity-50'}">
        <i class="fas fa-moon"></i>
      </span>

      <div 
        class="relative h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-300 flex items-center justify-center
               {themeState.mode === 'dark' ? 'translate-x-8' : 'translate-x-0'}"
      >
        {#key themeState.mode}
          <div in:scale={{duration:200, start:0.8}} class="absolute inset-0 flex items-center justify-center">
            {#if themeState.mode === 'dark'}
               <i class="fas fa-moon text-[10px] text-primary"></i>
            {:else}
               <i class="fas fa-sun text-[10px] text-amber-500"></i>
            {/if}
          </div>
        {/key}
      </div>
    </button>

    <div class="h-6 w-px bg-border/60"></div>

    <div class="flex items-center gap-2">
      {#each colorThemes as theme}
        <button 
          type="button"
          onclick={() => setThemeColor(theme.id)}
          class="group relative h-7 w-7 rounded-full transition-all duration-300 active:scale-90 hover:scale-110 focus:outline-none
                 {theme.colorClass}
                 {themeState.colorTheme === theme.id 
                   ? 'ring-[3px] ring-primary ring-offset-2 ring-offset-background scale-105 shadow-md' 
                   : 'ring-1 ring-border/20 hover:ring-border/50 opacity-80 hover:opacity-100'}"
          title={theme.name}
        >
          {#if themeState.colorTheme === theme.id}
            <span in:scale class="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white shadow-sm"></span>
          {/if}

          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[9px] font-bold text-background opacity-0 transition-all group-hover:-top-10 group-hover:opacity-100">
            {theme.name}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>