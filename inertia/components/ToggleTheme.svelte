<script lang="ts">
  import { theme, toggleTheme } from '../stores/theme'
</script>

<button
  on:click={toggleTheme}
  class="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded"
>
  {$theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
</button>