<script>
  import { fade } from 'svelte/transition';

  // Menangkap props dari MainLayout.svelte (config JSON dari MongoDB & title)
  let { config, title } = $props();

  // 1. Definisi Tab Modul Pengaturan Enterprise
  const tabs = [
    { id: 'general', label: 'General', icon: 'fas fa-sliders-h', desc: 'Konfigurasi dasar aplikasi' },
    { id: 'dashboard', label: 'Dashboard Builder', icon: 'fas fa-chart-pie', desc: 'Atur widget & layout analitik' },
    { id: 'menu', label: 'Menu Builder', icon: 'fas fa-list-ul', desc: 'Manajemen navigasi & sidebar' },
    { id: 'rules', label: 'Rule Engine', icon: 'fas fa-cogs', desc: 'Logika otomasi & webhook' }
  ];

  // 2. State Management
  let activeTab = $state('general');
  let isSaving = $state(false);

  // Simulasi proses simpan data (Nantinya dihubungkan ke Inertia/API)
  function handleSave() {
    isSaving = true;
    setTimeout(() => (isSaving = false), 1000);
  }
</script>

<div class="animate-fade-in flex h-full flex-col">
  
  <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <h1 class="text-2xl font-black tracking-tight text-foreground">{title || 'System Configuration'}</h1>
      <p class="mt-1 text-sm text-muted-foreground">Kelola pengaturan inti, struktur layout, dan logika aplikasi.</p>
    </div>
    
    <button 
      type="button" 
      onclick={handleSave}
      disabled={isSaving}
      class="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-70"
    >
      {#if isSaving}
        <i class="fas fa-spinner fa-spin"></i> Menyimpan...
      {:else}
        <i class="fas fa-save"></i> Simpan {tabs.find(t => t.id === activeTab)?.label}
      {/if}
    </button>
  </div>

  <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
    
    <div class="lg:w-72 shrink-0">
      <nav class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
        {#each tabs as tab}
          <button
            type="button"
            onclick={() => (activeTab = tab.id)}
            class="group flex min-w-[180px] lg:min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200
                   {activeTab === tab.id 
                     ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background' 
                     : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'}"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-muted group-hover:bg-background'} transition-colors">
              <i class="{tab.icon} text-lg"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold tracking-wide">{tab.label}</span>
              <span class="text-[10px] opacity-70 hidden lg:block line-clamp-1 mt-0.5">{tab.desc}</span>
            </div>
          </button>
        {/each}
      </nav>
    </div>

    <div class="flex-1 rounded-2xl border border-border bg-card p-1 shadow-sm relative min-h-[500px] overflow-hidden">
      {#key activeTab}
        <div in:fade={{ duration: 200, delay: 100 }} out:fade={{ duration: 100 }} class="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
          
          {#if activeTab === 'general'}
            <div class="mb-6">
              <h2 class="text-xl font-bold text-foreground">General Settings</h2>
              <p class="text-sm text-muted-foreground mt-1">Konfigurasi variabel global yang mempengaruhi seluruh sistem.</p>
            </div>
            
            <form class="space-y-6 max-w-2xl" onsubmit={(e) => e.preventDefault()}>
              {#each config?.fields || [] as field}
                <div class="space-y-2">
                  <label for={field.name} class="text-sm font-bold text-foreground">{field.label}</label>
                  
                  {#if field.type === 'select'}
                    <select id={field.name} class="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none shadow-sm">
                      {#each field.options || [] as opt}
                        <option value={opt} selected={opt === field.default}>{opt}</option>
                      {/each}
                    </select>
                  
                  {:else if field.type === 'boolean'}
                    <label class="relative flex items-center gap-3 cursor-pointer group w-max mt-2">
                      <div class="relative">
                        <input type="checkbox" checked={field.default} class="peer sr-only">
                        <div class="block h-6 w-11 rounded-full bg-muted border border-border peer-checked:bg-primary transition-colors"></div>
                        <div class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                      </div>
                      <span class="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Aktifkan {field.label}</span>
                    </label>
                  
                  {:else}
                    <input type="text" id={field.name} value={field.default || ''} class="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none shadow-sm" />
                  {/if}
                </div>
              {/each}
            </form>

          {:else if activeTab === 'dashboard'}
            <div class="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                <i class="fas fa-chart-pie text-5xl"></i>
              </div>
              <h3 class="text-2xl font-black text-foreground">Dashboard Builder</h3>
              <p class="max-w-md text-sm leading-relaxed">Kanvas drag-and-drop untuk menyusun layout ECharts dan Widget metrik operasional.</p>
              <button class="mt-4 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold hover:bg-muted/80 text-foreground transition-colors shadow-sm">Muat Editor Dashboard</button>
            </div>

          {:else if activeTab === 'menu'}
            <div class="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500 shadow-inner">
                <i class="fas fa-sitemap text-5xl"></i>
              </div>
              <h3 class="text-2xl font-black text-foreground">Sidebar & Menu Builder</h3>
              <p class="max-w-md text-sm leading-relaxed">Manajemen hierarki navigasi (*tree-view*) dari JSON MongoDB. Tambah rute baru dan atur izin akses (RBAC).</p>
              <button class="mt-4 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold hover:bg-muted/80 text-foreground transition-colors shadow-sm">Muat Editor Menu</button>
            </div>

          {:else if activeTab === 'rules'}
            <div class="flex h-full flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 shadow-inner">
                <i class="fas fa-project-diagram text-5xl"></i>
              </div>
              <h3 class="text-2xl font-black text-foreground">Dynamic Rule Engine</h3>
              <p class="max-w-md text-sm leading-relaxed">Visual Node Editor untuk menetapkan logika validasi bisnis, trigger otomasi, dan integrasi Webhook.</p>
              <button class="mt-4 rounded-xl border border-border bg-muted px-6 py-3 text-sm font-bold hover:bg-muted/80 text-foreground transition-colors shadow-sm">Buka Canvas Engine</button>
            </div>

          {/if}
        </div>
      {/key}
    </div>
  </div>
</div>

<style>
  /* Styling scrollbar khusus agar elegan di tab menu */
  .custom-scrollbar::-webkit-scrollbar {
    height: 4px;
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: hsl(var(--muted-foreground) / 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: hsl(var(--muted-foreground) / 0.4);
  }
</style>