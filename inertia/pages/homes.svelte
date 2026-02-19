<script>
  import { useForm, page } from '@inertiajs/svelte';
  import MainLayout from '~/layouts/MainLayout.svelte';

  // Menangkap props 'stats' dari controller
  let { stats } = $props();

  const form = useForm({});

  function handleLogout() {
    form.delete('/logout');
  }
</script>

<MainLayout>
  <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-fade-in">
    <div>
      <h1 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        Selamat Datang, <span class="text-primary">{$page.props.user?.username || 'User'}</span>
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">Laporan operasional sistem terpusat Anda hari ini.</p>
    </div>
    
    <button 
      type="button"
      onclick={handleLogout} 
      class="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold text-destructive shadow-sm hover:bg-destructive/5 transition-colors focus:ring-2 focus:ring-destructive/20"
    >
      <i class="fas fa-sign-out-alt mr-2"></i> Logout System
    </button>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md group">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Revenue</h3>
          <div class="mt-2 text-2xl font-bold text-foreground">${stats.revenue.toLocaleString()}</div>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110">
          <i class="fas fa-wallet text-xl"></i>
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs font-bold text-emerald-600">
        <i class="fas fa-arrow-up mr-1"></i> 12.5% 
        <span class="ml-2 font-medium text-muted-foreground">vs last month</span>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md group">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Users</h3>
          <div class="mt-2 text-2xl font-bold text-foreground">+{stats.total_users}</div>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110">
          <i class="fas fa-users text-xl"></i>
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs font-bold text-blue-600">
        <i class="fas fa-user-check mr-1"></i> {stats.active_sessions} Online
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md group">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Server Load</h3>
          <div class="mt-2 text-2xl font-bold text-foreground">{stats.server_load}%</div>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110">
          <i class="fas fa-server text-xl"></i>
        </div>
      </div>
      <div class="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div class="bg-amber-500 h-full rounded-full" style="width: {stats.server_load}%"></div>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md group">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Health</h3>
          <div class="mt-2 text-2xl font-bold text-foreground">Optimal</div>
        </div>
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <i class="fas fa-shield-check text-xl"></i>
        </div>
      </div>
      <div class="mt-4 text-xs font-bold text-primary italic">All systems operational</div>
    </div>
  </div>

  <div class="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
    <div class="flex items-center gap-3 mb-6">
      <div class="h-10 w-1 bg-primary rounded-full"></div>
      <h2 class="text-lg font-black tracking-tight text-foreground">Aktivitas Sistem Terbaru</h2>
    </div>
    
    <div class="space-y-4">
      {#each Array(3) as _, i}
        <div class="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors cursor-default">
          <div class="h-10 w-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground">
            <i class="fas fa-history text-sm"></i>
          </div>
          <div>
            <p class="text-sm font-bold">Pembaruan konfigurasi oleh sistem</p>
            <p class="text-xs text-muted-foreground italic">2 jam yang lalu</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</MainLayout>