<script>
  import { useForm } from '@inertiajs/svelte';
  import MainLayout from '~/layouts/MainLayout.svelte';

  const form = useForm({});

  function logout() {
    $form.delete('/logout');
  }
</script>

<MainLayout>
  <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard Operasional</h1>
      <p class="mt-2 text-sm text-muted-foreground">Pantau metrik utama dan kinerja sistem.</p>
    </div>
    <button 
      type="button"
      onclick={logout} 
      class="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <i class="fas fa-sign-out-alt mr-2"></i> Keluar
    </button>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {#each [
      { label: 'Total Revenue', value: '$45,231.89', icon: 'fa-wallet', color: 'text-success' },
      { label: 'Active Users', value: '+2,350', icon: 'fa-users', color: 'text-primary' },
      { label: 'Server Load', value: '34%', icon: 'fa-server', color: 'text-warning' }
    ] as item}
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">{item.label}</h3>
            <div class="mt-2 text-3xl font-bold text-foreground">{item.value}</div>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 {item.color}">
            <i class="fas {item.icon} text-xl"></i>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-4 text-lg font-semibold text-foreground">Aktivitas Terkini</h2>
    <div class="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
      <div class="text-center">
        <i class="fas fa-chart-area mb-3 text-5xl opacity-40"></i>
        <p class="text-sm">Modul ECharts siap diintegrasikan di sini.</p>
      </div>
    </div>
  </div>
</MainLayout>