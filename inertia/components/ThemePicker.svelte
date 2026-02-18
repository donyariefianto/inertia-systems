<script lang="ts">
  import { themeState, setColorTheme, toggleMode } from '~/stores/theme'
</script>

<div class="flex gap-4 p-4">
  <!-- Tombol toggle mode -->
  <button
    on:click={toggleMode}
    class="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
  >
    {$themeState.mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
  </button>

  <!-- Pilih tema warna -->
  <select
    on:change={(e) => setColorTheme(e.currentTarget.value as any)}
    value={$themeState.colorTheme}
    class="px-4 py-2 bg-muted text-foreground rounded border border-primary/20"
  >
    <option value="default">Default</option>
    <option value="forest">Forest</option>
    <option value="ocean">Ocean</option>
  </select>
</div>