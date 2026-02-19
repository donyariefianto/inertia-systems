<script>
  let { config, title } = $props();
</script>

<div class="mb-6 animate-fade-in">
  <h1 class="text-2xl font-bold tracking-tight text-foreground">{title || 'Analytics'}</h1>
  <p class="text-sm text-muted-foreground mt-1">Auto-refresh: {config?.refreshInterval ? config.refreshInterval / 1000 + 's' : 'Off'}</p>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
  {#each config?.charts || ['Default Chart'] as chart}
    <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-bold text-foreground capitalize">{chart}</h3>
        <button class="text-muted-foreground hover:text-primary transition" title="Refresh Data">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
      <div class="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <div class="text-center text-muted-foreground">
          <i class="fas fa-chart-line text-4xl mb-3 opacity-30"></i>
          <p class="text-sm">Kanvas ECharts</p>
        </div>
      </div>
    </div>
  {/each}
</div>