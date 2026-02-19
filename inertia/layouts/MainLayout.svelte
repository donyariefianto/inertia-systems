<script>
  import { onMount } from 'svelte';
  import { page, router } from '@inertiajs/svelte';
  import { EncryptionService } from '~/stores/encryption.ts';
  import { initTheme } from '~/stores/theme.svelte.ts';
  import { initSplash } from '~/stores/splash.svelte.ts';
  
  import Sidebar from '../components/Sidebar.svelte';
  import SplashScreen from '../components/SplashScreen.svelte';
  import ThemeSwitcher from '../components/ThemeSwitcher.svelte';
  import FlashMessage from '../components/FlashMessage.svelte';

  // Import Generic Views
  import TableView from '../pages/generic/TableView.svelte';
  import ChartView from '../pages/generic/ChartView.svelte';
  import SettingsView from '../pages/generic/SettingsView.svelte';

  let { children } = $props();
  let isMobileOpen = $state(false);

  // 🛡️ Dekripsi menggunakan Derived State (Mencegah Loop Svelte)
  const decryptedMenu = $derived.by(() => {
    const sidebarProp = $page.props.sidebar;
    if (!sidebarProp?.nonce || !sidebarProp?.ciphertext) return null;

    try {
      const raw = EncryptionService.decrypt(sidebarProp.nonce, sidebarProp.ciphertext);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("🔒 [Decrypt Error]:", e);
      return null;
    }
  });

  // 🚀 TYPE NAVIGATION HANDLER (Pure Derived)
  // Mencari item menu yang sesuai dengan URL saat ini untuk mengekstrak 'type' dan 'config'
  const activeMenuItem = $derived.by(() => {
    if (!decryptedMenu?.sidemenu) return null;
    
    // Ambil path tanpa query parameters (?page=1 dll)
    const currentUrl = $page.url.split('?')[0]; 

    function findActive(items) {
      for (const item of items) {
        const itemPath = item.path ? (item.path.startsWith('/') ? item.path : `/systems/${item.path}`) : null;
        if (itemPath === currentUrl) return item;
        
        // Cari ke dalam sub-menu secara rekursif
        if (item.sub_sidemenu && item.sub_sidemenu.length > 0) {
          const found = findActive(item.sub_sidemenu);
          if (found) return found;
        }
      }
      return null;
    }

    return findActive(decryptedMenu.sidemenu);
  });

  onMount(() => {
    initTheme();
    initSplash();
    
    if (!$page.props.sidebar) {
      router.reload({ only: ['sidebar'] });
    }
  });

  $effect(() => {
    const _ = $page.url;
    isMobileOpen = false;
  });
</script>

<SplashScreen />
<ThemeSwitcher />
<FlashMessage />

<div class="flex min-h-screen bg-background text-foreground transition-colors duration-300">
  <Sidebar menuData={decryptedMenu} isOpen={isMobileOpen} onClose={() => (isMobileOpen = false)} />

  <div class="flex flex-1 flex-col overflow-hidden relative">
    <header class="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-md lg:px-8">
      <button 
        type="button" 
        class="lg:hidden text-muted-foreground p-2 hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
        onclick={() => (isMobileOpen = true)}
        aria-label="Buka Menu"
      >
        <i class="fas fa-bars text-xl"></i>
      </button>

      <div class="hidden lg:block"></div>

      <div class="flex items-center gap-4">
        <div class="hidden text-right md:block">
          <p class="text-sm font-bold leading-none">{$page.props.auth?.user?.name || 'Administrator'}</p>
          <p class="mt-1 text-xs text-muted-foreground capitalize">{$page.props.auth?.user?.role || 'System Role'}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary font-bold shadow-sm">
          {($page.props.auth?.user?.name || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in custom-scrollbar">
      {#if activeMenuItem?.type === 'tableview'}
        <TableView config={activeMenuItem.config} title={activeMenuItem.name} />
      
      {:else if activeMenuItem?.type === 'chartview'}
        <ChartView config={activeMenuItem.config} title={activeMenuItem.name} />
      
      {:else if activeMenuItem?.type === 'settings'}
        <SettingsView config={activeMenuItem.config} title={activeMenuItem.name} />
      
      {:else if children}
        {@render children()}
      {/if}
    </main>
  </div>
</div>