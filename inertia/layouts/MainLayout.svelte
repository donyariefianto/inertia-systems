<script>
  import { onMount } from 'svelte';
  import { initTheme } from '~/stores/theme.svelte.ts';
  import SplashScreen from '~/components/SplashScreen.svelte';
  import ThemeSwitcher from '~/components/ThemeSwitcher.svelte';

  let { children } = $props();
  let appReady = $state(false);

  onMount(() => {
    initTheme();
  });
</script>

<SplashScreen onFinish={() => appReady = true} />

<ThemeSwitcher />

<main class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
  {#if appReady}
    {@render children()}
  {/if}
</main>