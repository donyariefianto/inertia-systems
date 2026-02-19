<script>
  // Menangkap props dari MainLayout
  let { config, title } = $props();
</script>

<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center animate-fade-in">
  <div>
    <h1 class="text-2xl font-bold tracking-tight text-foreground">{title || 'Data View'}</h1>
    <p class="text-sm text-muted-foreground mt-1">Endpoint: {config?.endpoint || '-'}</p>
  </div>
  
  {#if config?.operations?.create}
    <button class="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition">
      <i class="fas fa-plus mr-2"></i> Tambah {title}
    </button>
  {/if}
</div>

<div class="rounded-xl border border-border bg-card overflow-hidden shadow-sm animate-fade-in">
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="bg-muted/50 border-b border-border">
        <tr>
          {#each config?.fields || [] as field}
            <th class="px-6 py-4 font-semibold text-foreground whitespace-nowrap">{field.label || field.name}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-border/50 hover:bg-muted/20">
          <td colspan="100%" class="px-6 py-16 text-center text-muted-foreground">
            <i class="fas fa-table text-4xl mb-3 opacity-20"></i>
            <p>Konfigurasi tabel <strong>{config?.collectionName}</strong> berhasil dimuat.</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>