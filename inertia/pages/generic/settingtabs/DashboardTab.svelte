<script>
  let { config } = $props()
</script>

<div class="relative h-full w-full bg-background overflow-hidden flex flex-col">
  <div
    class="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
    style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 24px 24px;"
  ></div>

  <div
    class="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-lg backdrop-blur-md z-10"
  >
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md"
      ><i class="fas fa-mouse-pointer"></i></button
    >
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
      ><i class="fas fa-chart-bar"></i></button
    >
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      class="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
      ><i class="fas fa-table"></i></button
    >
    <div class="h-6 w-px bg-border mx-1"></div>
    <button
      class="flex h-10 px-4 items-center justify-center rounded-xl text-xs font-bold text-foreground hover:bg-muted"
      ><i class="fas fa-eye mr-2"></i> Preview</button
    >
  </div>

  <div class="flex-1 p-12 overflow-auto flex items-center justify-center custom-scrollbar">
    <div class="grid w-full max-w-4xl grid-cols-12 gap-6 relative z-0">
      <div
        class="col-span-8 h-64 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center group hover:border-primary transition-colors cursor-move"
      >
        <div class="text-center opacity-50 group-hover:opacity-100 transition-opacity">
          <i class="fas fa-chart-area text-3xl text-primary mb-2"></i>
          <p class="text-xs font-bold text-primary uppercase">Main Chart Widget</p>
        </div>
      </div>

      <div
        class="col-span-4 h-64 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center hover:border-muted-foreground transition-colors cursor-move"
      >
        <span class="text-xs font-bold text-muted-foreground uppercase">Stats Card</span>
      </div>
    </div>
  </div>
</div>
