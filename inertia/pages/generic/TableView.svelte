<script>
  let { config, title } = $props()

  // Simulasi state pencarian
  let searchQuery = $state('')
</script>

<div class="animate-fade-in flex flex-col gap-6">
  <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <h1 class="text-2xl font-black tracking-tight text-foreground">{title || 'Data Master'}</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Kelola data {config?.collectionName || 'koleksi'} secara dinamis.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted"
      >
        <i class="fas fa-file-export"></i> Ekspor
      </button>
      {#if config?.operations?.create !== false}
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <i class="fas fa-plus"></i> Tambah Data
        </button>
      {/if}
    </div>
  </div>

  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
  >
    <div class="relative w-full sm:max-w-xs">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari data..."
        class="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
      />
    </div>
    <div class="flex items-center gap-2">
      <button
        class="rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <i class="fas fa-filter mr-1"></i> Filter
      </button>
    </div>
  </div>

  <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
    <div class="overflow-x-auto custom-scrollbar">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            {#each config?.fields || [{ label: 'Field 1' }, { label: 'Field 2' }] as field}
              <th class="px-6 py-4 font-bold">{field.label || field.name}</th>
            {/each}
            <th class="px-6 py-4 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/50">
          <tr>
            <td colspan={(config?.fields?.length || 2) + 1} class="px-6 py-24 text-center">
              <div class="flex flex-col items-center justify-center space-y-3">
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
                >
                  <i class="fas fa-database text-2xl"></i>
                </div>
                <p class="font-bold text-foreground">Menunggu Sinkronisasi Data</p>
                <p class="text-xs text-muted-foreground max-w-xs">
                  Data dari endpoint <code class="bg-muted px-1 py-0.5 rounded text-primary"
                    >{config?.endpoint || '/api/...'}</code
                  > akan dimuat di sini.
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-border bg-card px-6 py-4">
      <span class="text-xs text-muted-foreground">Menampilkan 0 dari 0 data</span>
      <div class="flex gap-1">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          disabled
          class="rounded px-3 py-1 text-sm border border-border text-muted-foreground opacity-50"
          ><i class="fas fa-chevron-left"></i></button
        >
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          disabled
          class="rounded px-3 py-1 text-sm border border-border text-muted-foreground opacity-50"
          ><i class="fas fa-chevron-right"></i></button
        >
      </div>
    </div>
  </div>
</div>
