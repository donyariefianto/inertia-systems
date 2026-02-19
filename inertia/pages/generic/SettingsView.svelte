<script>
  let { config, title } = $props();
</script>

<div class="mb-6 animate-fade-in">
  <h1 class="text-2xl font-bold tracking-tight text-foreground">{title || 'App Configuration'}</h1>
</div>

<div class="rounded-xl border border-border bg-card p-6 shadow-sm max-w-2xl animate-fade-in">
  <form class="space-y-6" onsubmit={(e) => e.preventDefault()}>
    {#each config?.fields || [] as field}
      <div class="space-y-2">
        <label for={field.name} class="text-sm font-medium text-foreground">{field.label}</label>
        
        {#if field.type === 'select'}
          <select id={field.name} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
            {#each field.options || [] as opt}
              <option value={opt} selected={opt === field.default}>{opt}</option>
            {/each}
          </select>
        
        {:else if field.type === 'boolean'}
          <label class="flex items-center gap-3 cursor-pointer mt-1">
            <input type="checkbox" checked={field.default} class="h-4 w-4 rounded border-border text-primary focus:ring-primary">
            <span class="text-sm text-muted-foreground">Aktifkan {field.label}</span>
          </label>
        
        {:else}
          <input type="text" id={field.name} value={field.default || ''} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
        {/if}
      </div>
    {/each}
    
    <div class="pt-4 border-t border-border flex justify-end">
      <button type="submit" class="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold shadow-sm hover:opacity-90">
        Simpan Perubahan
      </button>
    </div>
  </form>
</div>