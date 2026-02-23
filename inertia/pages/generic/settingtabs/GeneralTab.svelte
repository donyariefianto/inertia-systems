<script>
  let { config } = $props()
</script>

<div class="h-full overflow-y-auto p-8 custom-scrollbar">
  <div class="mx-auto max-w-3xl space-y-8 pb-12">
    <div>
      <h2 class="text-2xl font-black text-foreground">General Configuration</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Sesuaikan variabel lingkungan dan identitas global aplikasi Anda.
      </p>
    </div>

    <div class="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      {#each config?.fields || [] as field, i}
        <div
          class="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between {i !==
          (config?.fields?.length || 0) - 1
            ? 'border-b border-border/50'
            : ''}"
        >
          <div class="flex-1 pr-4">
            <label class="text-sm font-bold text-foreground" for={field.name}>{field.label}</label>
            <p class="text-xs text-muted-foreground mt-1">
              Konfigurasi parameter {field.label.toLowerCase()} untuk operasional.
            </p>
          </div>

          <div class="w-full sm:w-72 shrink-0">
            {#if field.type === 'boolean'}
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  id={field.name}
                  checked={field.default}
                  class="peer sr-only"
                />
                <div
                  class="h-7 w-12 rounded-full border border-border bg-muted peer-checked:bg-primary transition-colors after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/30 shadow-inner"
                ></div>
              </label>
            {:else if field.type === 'select'}
              <select
                id={field.name}
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm"
              >
                {#each field.options || [] as opt}
                  <option value={opt} selected={opt === field.default}>{opt}</option>
                {/each}
              </select>
            {:else}
              <input
                type="text"
                id={field.name}
                value={field.default || ''}
                class="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm"
                placeholder="Masukkan nilai..."
              />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
