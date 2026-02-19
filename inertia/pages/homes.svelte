<script>
  import { useForm, page, Link } from '@inertiajs/svelte';
  import MainLayout from '~/layouts/MainLayout.svelte';
  import { fade, fly } from 'svelte/transition';

  const form = useForm({});

  function handleLogout() {
    form.delete('/logout');
  }

  const portalModules = [
    { 
      id: 'db', 
      name: 'Dashboard Analitik', 
      icon: 'chart-line', 
      path: '/systems/dashboard', 
      color: 'from-blue-500/20 to-blue-500/5 text-blue-600', 
      desc: 'Pantau metrik performa dan statistik operasional secara real-time.' 
    },
    { 
      id: 'um', 
      name: 'Manajemen User', 
      icon: 'user-shield', 
      path: '/systems/settings/users', 
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600', 
      desc: 'Kelola hak akses, peran, dan keamanan akun dengan kontrol terperinci.' 
    },
    { 
      id: 'cfg', 
      name: 'Konfigurasi Sistem', 
      icon: 'cogs', 
      path: '/systems/settings/config', 
      color: 'from-zinc-500/20 to-zinc-500/5 text-zinc-600', 
      desc: 'Atur parameter inti dan variabel lingkungan aplikasi.' 
    }
  ];

  const buildDate = '2026-02-20';
</script>

<MainLayout>
  <div class="flex h-full flex-col gap-8 animate-fade-in">
    
    <!-- Header -->
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center shrink-0 px-1">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Portal <span class="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Sahabat</span>
        </h1>
        <p class="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          Sesi aktif: <span class="font-medium text-foreground">{$page.props.user?.username || 'Administrator'}</span>
        </p>
      </div>
      
      <button 
        type="button"
        on:click={handleLogout} 
        class="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-destructive shadow-sm transition-all hover:bg-destructive/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98]"
        aria-label="Logout dari sistem"
        disabled={form.processing}
      >
        {#if form.processing}
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent"></span>
          <span>Processing...</span>
        {:else}
          <i class="fas fa-power-off mr-2 transition-transform group-hover:scale-110"></i> Logout
        {/if}
      </button>
    </header>

    <!-- Main content area dengan scroll -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div class="space-y-10 pb-10 px-1">
        
        <!-- Grid Modul Portal -->
        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" class="sr-only">Modul Portal</h2>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each portalModules as card, i}
              <div in:fly={{ y: 20, duration: 400, delay: i * 100 }}>
                <Link 
                  href={card.path}
                  class="group relative flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br {card.color} shadow-inner transition-transform group-hover:scale-110">
                      <i class="fas fa-{card.icon} text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{card.name}</h3>
                  </div>
                  <p class="text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
                  <div class="mt-auto flex items-center gap-2 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
                    <span>Akses Modul</span>
                    <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
                  </div>
                </Link>
              </div>
            {/each}
          </div>
        </section>

        <!-- Panel Informasi (dua kolom) -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          <!-- Informasi Sesi -->
          <article class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md" in:fade={{ delay: 400 }}>
            <header class="mb-5 flex items-center gap-3">
              <div class="h-8 w-1 rounded-full bg-primary"></div>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">Informasi Sesi</h2>
            </header>
            <dl class="space-y-4">
              <div class="flex items-center justify-between border-b border-border/50 pb-3">
                <dt class="text-xs font-medium text-muted-foreground">Tingkat Akses</dt>
                <dd class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{$page.props.user?.role || 'Super Admin'}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs font-medium text-muted-foreground">Status Database</dt>
                <dd class="flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">TERHUBUNG</span>
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs font-medium text-muted-foreground">ID Sesi</dt>
                <dd class="font-mono text-xs text-foreground">••••••••••</dd>
              </div>
            </dl>
          </article>

          <!-- Informasi Rilis -->
          <article class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md" in:fade={{ delay: 500 }}>
            <header class="mb-5 flex items-center gap-3">
              <div class="h-8 w-1 rounded-full bg-muted-foreground/50"></div>
              <h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">Informasi Rilis</h2>
            </header>
            <div class="flex items-center gap-6">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/30 text-muted-foreground">
                <i class="fas fa-code-branch text-2xl"></i>
              </div>
              <dl class="space-y-1.5">
                <div>
                  <dt class="text-xs text-muted-foreground">Versi Core</dt>
                  <dd class="text-base font-semibold text-foreground">v2.4.0</dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">Build Date</dt>
                  <dd class="font-mono text-sm text-foreground">{buildDate}</dd>
                </div>
              </dl>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</MainLayout>

<style>
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.2);
    border-radius: 20px;
    transition: background 0.2s;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.3);
  }
  
  /* Fade-in animation */
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
</style>