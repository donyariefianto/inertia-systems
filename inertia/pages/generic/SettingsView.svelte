<script>
  import { fade, fly } from 'svelte/transition';
  
  import GeneralTab from '~/pages/generic/settingtabs/GeneralTab.svelte'
  import DashboardTab from '~/pages/generic/settingtabs/DashboardTab.svelte'
  import MenuTab from '~/pages/generic/settingtabs/MenuTab.svelte';
  import RuleTab from '~/pages/generic/settingtabs/RuleTab.svelte';

  let { config, title } = $props();

  let activeTabId = $state(null);
  let isSaving = $state(false);

  const tabs = [
    { id: 'general', label: 'General System', icon: 'fas fa-sliders-h', component: GeneralTab, color: 'text-zinc-500', bg: 'bg-zinc-500/10', desc: 'Identitas, zona waktu, dan parameter global' },
    { id: 'dashboard', label: 'Dashboard Builder', icon: 'fas fa-chart-pie', component: DashboardTab, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Desain layout widget dan analitik visual' },
    { id: 'menu', label: 'Menu Orchestrator', icon: 'fas fa-sitemap', component: MenuTab, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Manajemen hierarki navigasi dan role akses' },
    { id: 'rules', label: 'Dynamic Rule Engine', icon: 'fas fa-project-diagram', component: RuleTab, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Logika otomasi, validasi, dan alur webhook' }
  ];

  const activeTab = $derived(tabs.find(t => t.id === activeTabId));
  const ActiveComponent = $derived(activeTab?.component);

  function openTab(id) { activeTabId = id; }
  function closeTab() { activeTabId = null; }

  function handleSave() {
    isSaving = true;
    setTimeout(() => { isSaving = false; }, 1000);
  }
</script>

<div class="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
  
  {#if !activeTabId}
    <div in:fade={{ duration: 200, delay: 150 }} out:fade={{ duration: 150 }} class="absolute inset-0 flex flex-col overflow-y-auto p-8 lg:p-12 custom-scrollbar">
      <div class="mb-10 max-w-2xl">
        <h1 class="text-3xl font-black tracking-tight text-foreground lg:text-4xl">{title || 'Settings & Config'}</h1>
        <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
          Pusat kendali arsitektur sistem. Pilih modul di bawah ini untuk mengonfigurasi parameter operasional, mendesain tampilan, atau mengatur logika bisnis secara visual.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {#each tabs as tab}
          <button 
            onclick={() => openTab(tab.id)}
            class="group flex h-full flex-col items-start gap-5 rounded-3xl border border-border bg-card p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl {tab.bg} {tab.color} shadow-inner transition-transform duration-300 group-hover:scale-110">
              <i class="{tab.icon} text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{tab.label}</h3>
              <p class="mt-2 text-xs text-muted-foreground leading-relaxed">{tab.desc}</p>
            </div>
            <div class="mt-auto pt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all">
              Buka Modul <i class="fas fa-arrow-right ml-2"></i>
            </div>
          </button>
        {/each}
      </div>
    </div>

  {:else if activeTab}
    <div in:fly={{ x: 30, duration: 300, delay: 150 }} out:fly={{ x: 30, duration: 200 }} class="absolute inset-0 flex flex-col bg-background">
      
      <header class="flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-card px-6 shadow-sm z-10">
        <div class="flex items-center gap-5">
          <button 
            onclick={closeTab}
            class="group flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground transition-all hover:bg-primary hover:text-white active:scale-90"
            title="Kembali ke Menu"
          >
            <i class="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
          </button>
          
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg {activeTab.bg} {activeTab.color}">
              <i class={activeTab.icon}></i>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Workspace</span>
              <h2 class="text-sm font-black uppercase tracking-tight text-foreground mt-1">{activeTab.label}</h2>
            </div>
          </div>
        </div>

        <button 
          onclick={handleSave}
          disabled={isSaving}
          class="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
        >
          <i class="fas {isSaving ? 'fa-spinner fa-spin' : 'fa-save'}"></i>
          {isSaving ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </header>

      <main class="flex-1 overflow-hidden relative bg-muted/10">
        <ActiveComponent {config} {closeTab} />
      </main>
      
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.2); border-radius: 10px; }
</style>