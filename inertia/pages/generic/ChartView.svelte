<script>
  let { config, title } = $props()
</script>

<div class="animate-fade-in flex flex-col gap-6">
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-2">
    <div>
      <h1 class="text-2xl font-black tracking-tight text-foreground">
        {title || 'Analytics View'}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Visualisasi data dari sumber: {config?.endpoint || 'Tidak diketahui'}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <select
        class="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-medium shadow-sm focus:border-primary focus:ring-1 focus:outline-none"
      >
        <option>7 Hari Terakhir</option>
        <option>30 Hari Terakhir</option>
        <option>Tahun Ini</option>
      </select>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
      >
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {#each config?.charts || ['overview', 'conversion'] as chartKey}
      <div
        class="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm min-h-[350px]"
      >
        <h3 class="font-bold text-foreground capitalize mb-6">
          {chartKey.replace('_', ' ')} Chart
        </h3>

        <div
          class="flex-1 rounded-xl border border-dashed border-border/60 bg-muted/20 flex items-center justify-center"
        >
          <div class="text-center">
            <i class="fas fa-chart-line text-4xl text-muted-foreground/30 mb-3"></i>
            <p class="text-sm font-medium text-muted-foreground">Canvas ECharts ({chartKey})</p>
            <p class="text-[10px] text-muted-foreground/70 mt-1">
              Siap dirender saat data JSON masuk.
            </p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
