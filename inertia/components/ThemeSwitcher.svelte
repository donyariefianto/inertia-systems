<script>
  import { themeState, toggleDarkMode, setThemeColor } from '~/stores/theme.svelte.ts';
</script>

<div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card p-2 shadow-lg">
  <button 
    onclick={toggleDarkMode}
    class="rounded-full p-2 text-foreground hover:bg-muted transition"
    title="Toggle Dark Mode"
  >
    {#if themeState.mode === 'dark'} 🌙 {:else} ☀️ {/if}
  </button>

  <div class="h-4 w-px bg-border"></div>

  <div class="flex gap-1">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button onclick={() => setThemeColor('default')} class="h-4 w-4 rounded-full bg-blue-600 ring-2 ring-offset-1 ring-offset-card hover:scale-110 transition {themeState.color === 'default' ? 'ring-foreground' : 'ring-transparent'}"></button>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button onclick={() => setThemeColor('theme-forest')} class="h-4 w-4 rounded-full bg-green-700 ring-2 ring-offset-1 ring-offset-card hover:scale-110 transition {themeState.color === 'theme-forest' ? 'ring-foreground' : 'ring-transparent'}"></button>
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button onclick={() => setThemeColor('theme-ocean')} class="h-4 w-4 rounded-full bg-cyan-700 ring-2 ring-offset-1 ring-offset-card hover:scale-110 transition {themeState.color === 'theme-ocean' ? 'ring-foreground' : 'ring-transparent'}"></button>
  </div>
</div>