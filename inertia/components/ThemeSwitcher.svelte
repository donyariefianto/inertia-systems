<script>
  import { themeState, toggleDarkMode, setThemeColor } from '~/stores/theme.svelte.ts';
</script>

<div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card p-2 shadow-lg">
  <button 
    type="button"
    onclick={toggleDarkMode}
    class="rounded-full p-2 text-foreground hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    title="Toggle Dark Mode"
  >
    <i class="fas {themeState.mode === 'dark' ? 'fa-moon text-primary' : 'fa-sun text-warning'} text-lg"></i>
  </button>

  <div class="h-4 w-px bg-border"></div>

  <div class="flex gap-1">
    <button 
      type="button" 
      aria-label="Default Theme"
      onclick={() => setThemeColor('default')} 
      class="h-5 w-5 rounded-full bg-zinc-600 ring-2 ring-offset-1 ring-offset-card hover:scale-110 transition {themeState.colorTheme === 'default' ? 'ring-foreground' : 'ring-transparent'}">
    </button>
    <button 
      type="button" 
      aria-label="Forest Theme"
      onclick={() => setThemeColor('forest')} 
      class="h-5 w-5 rounded-full bg-emerald-700 ring-2 ring-offset-1 ring-offset-card hover:scale-110 transition {themeState.colorTheme === 'forest' ? 'ring-foreground' : 'ring-transparent'}">
    </button>
  </div>
</div>