<script>
  let { config } = $props()
</script>

<div class="flex h-full w-full">
  <div
    class="w-80 shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col custom-scrollbar"
  >
    <div
      class="sticky top-0 bg-card/90 backdrop-blur p-4 border-b border-border z-10 flex justify-between items-center"
    >
      <h3 class="text-xs font-black uppercase tracking-widest text-foreground">Menu Structure</h3>
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button
        class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
        ><i class="fas fa-plus text-xs"></i></button
      >
    </div>

    <div class="p-4 space-y-2">
      <div
        class="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-primary cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <i class="fas fa-grip-vertical text-primary/40 text-xs"></i>
          <i class="fas fa-chart-line text-sm"></i>
          <span class="text-sm font-bold">Dashboard</span>
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
      >
        <div class="flex items-center gap-3">
          <i class="fas fa-grip-vertical opacity-30 text-xs"></i>
          <i class="fas fa-users-cog text-sm"></i>
          <span class="text-sm font-medium">User Management</span>
        </div>
      </div>
    </div>
  </div>

  <div class="flex-1 bg-background overflow-y-auto p-8 custom-scrollbar">
    <div class="max-w-2xl">
      <div class="mb-8">
        <h2 class="text-2xl font-black text-foreground">Item Properties</h2>
        <p class="text-sm text-muted-foreground">Konfigurasi detail untuk menu yang dipilih.</p>
      </div>

      <div class="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div class="space-y-2">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="text-xs font-bold uppercase text-muted-foreground">Label Menu</label>
          <input
            type="text"
            value="Dashboard"
            class="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div class="space-y-2">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="text-xs font-bold uppercase text-muted-foreground">Routing Path</label>
          <div
            class="flex items-center rounded-xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-primary/20"
          >
            <span class="text-sm text-muted-foreground border-r border-border pr-3 py-3"
              >systems/</span
            >
            <input
              type="text"
              value="dashboard"
              class="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div class="space-y-2">
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="text-xs font-bold uppercase text-muted-foreground">Role Access (RBAC)</label
          >
          <div class="flex flex-wrap gap-2">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <span
              class="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary border border-primary/20"
              >Admin <button><i class="fas fa-times"></i></button></span
            >
            <span
              class="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground border border-border hover:bg-muted/80 cursor-pointer"
              ><i class="fas fa-plus"></i> Add Role</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
