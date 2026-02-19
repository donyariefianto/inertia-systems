<script>
  import { onMount } from 'svelte';
  import { page, router } from '@inertiajs/svelte';
  import { EncryptionService } from '~/stores/encryption.ts';
  import { initTheme } from '~/stores/theme.svelte.ts';
  import { initSplash } from '~/stores/splash.svelte.ts';
  
  import Sidebar from '~/components/Sidebar.svelte';
  import SplashScreen from '~/components/SplashScreen.svelte';

  // 🚀 IMPORT GENERIC VIEWS (Pastikan path ini sesuai dengan struktur folder Anda)
  import TableView from '~/pages/generic/TableView.svelte';
  import ChartView from '~/pages/generic/ChartView.svelte';
  import SettingsView from '~/pages/generic/SettingsView.svelte';

  let { children } = $props();
  let isMobileOpen = $state(false);

  // 🛡️ DEKRIPSI PURE DERIVED
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

  // 🚀 DYNAMIC ROUTE MATCHING
  const activeMenuItem = $derived.by(() => {
    if (!decryptedMenu?.sidemenu) return null;
    
    // 1. Normalisasi URL Browser
    const rawUrl = $page.url.split('?')[0].replace(/^\//, ''); 
    const currentUrl = rawUrl.startsWith('systems/') ? rawUrl : `systems/${rawUrl}`;

    // 2. Fungsi Pencarian Rekursif yang Diperbaiki
    function findActive(items) {
      for (const item of items) {
        // Cek kecocokan rute JIKA item memiliki path
        if (item.path) {
          const cleanPath = item.path.replace(/^\//, '');
          const itemPath = cleanPath.startsWith('systems/') ? cleanPath : `systems/${cleanPath}`;
          
          if (itemPath === currentUrl) return item;
        }
        
        // TETAP periksa sub_sidemenu meskipun item saat ini tidak memiliki path (seperti folder)
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
    if (!$page.props.sidebar) router.reload({ only: ['sidebar'] });
  });

  $effect(() => {
    const _ = $page.url;
    isMobileOpen = false;
  });
</script>

<SplashScreen />

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
          <p class="text-sm font-bold leading-none">{$page.props.user?.username || 'Administrator'}</p>
          <p class="mt-1 text-xs text-muted-foreground capitalize">{$page.props.user?.role || 'System Role'}</p>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary font-bold shadow-sm">
          {($page.props.user?.username || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in custom-scrollbar">
      
      {#if activeMenuItem?.type}
        
        {#if activeMenuItem.type === 'tableview'}
          <TableView config={activeMenuItem.config} title={activeMenuItem.name} />
          
        {:else if activeMenuItem.type === 'chartview'}
          <ChartView config={activeMenuItem.config} title={activeMenuItem.name} />
          
        {:else if activeMenuItem.type === 'settings'}
          <SettingsView config={activeMenuItem.config} title={activeMenuItem.name} />
          
        {:else}
          <div class="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-8 text-center">
             <i class="fas fa-hammer text-4xl text-primary mb-4"></i>
             <h3 class="text-lg font-bold">Modul: {activeMenuItem.name} ({activeMenuItem.type})</h3>
             <p class="text-sm text-muted-foreground mt-2">Tipe modul ini belum memiliki komponen view.</p>
          </div>
        {/if}

      {:else if children}
        <div class="max-w-full overflow-hidden">
          {@render children()}
        </div>
      {/if}
      
    </main>
  </div>
</div>