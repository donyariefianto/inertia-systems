<script>
  import { fade, slide, fly } from 'svelte/transition'
  import { WidgetRegistry } from '~/utils/widgetRegistry.ts'

  const categories = Object.entries(WidgetRegistry.categories).map(([id, data]) => ({
    id,
    ...data,
  }))
  const widgets = Object.entries(WidgetRegistry.widgets).map(([id, data]) => ({ id, ...data }))

  const scopeRegistry = [
    {
      id: 'factory_a',
      name: 'Factory Area A',
      desc: 'Main production line monitoring',
      icon: 'fa-industry',
    },
    {
      id: 'cnc_machines',
      name: 'CNC Machinery',
      desc: 'High-precision cutting tools',
      icon: 'fa-robot',
    },
    {
      id: 'energy_center',
      name: 'Energy Center',
      desc: 'Power consumption & HVAC',
      icon: 'fa-bolt',
    },
    {
      id: 'global_view',
      name: 'Global Aggregation',
      desc: 'Cross-entity analytics',
      icon: 'fa-globe',
    },
  ]

  let currentStep = $state('LIBRARY')
  let isPreviewMode = $state(false)
  let isInspectorOpen = $state(false)

  let activeTabConfig = $state('design')
  let activeCategoryFilter = $state(categories[0]?.id || 'simple')
  let searchComponent = $state('')

  let dashboards = $state([
    {
      id: 'dash-demo-1',
      name: 'Executive Operations Overview',
      updated_at: new Date().toISOString(),
      widgets: [],
    },
  ])
  let activeDashboard = $state(null)
  let activeWidget = $state(null)

  let draggedWidgetIndex = $state(null)

  let shellForm = $state({ name: '' })

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function backToLibrary() {
    if (
      currentStep === 'CANVAS' &&
      !confirm('Kembali ke Library? Pastikan konfigurasi Anda telah disimpan.')
    )
      return
    currentStep = 'LIBRARY'
    activeDashboard = null
    activeWidget = null
    isInspectorOpen = false
  }

  function saveShell() {
    if (!shellForm.name.trim()) return alert('Nama Dashboard wajib diisi.')
    activeDashboard = {
      id: `dash-${Date.now()}`,
      name: shellForm.name,
      updated_at: new Date().toISOString(),
      widgets: [],
    }
    dashboards = [...dashboards, activeDashboard]
    currentStep = 'CANVAS'
    shellForm = { name: '' }
  }

  function initNewWidget() {
    const newWidget = {
      id: `w-${Date.now()}`,
      title: 'New Visualisation',
      type: null,
      config: {
        description: '',
        icon: 'fas fa-chart-pie',
        width: 'half',
        refresh: '0',
        dataSourceMode: 'static',
        scopeId: 'factory_a',
        collectionName: '',
        staticJson: '[\n  {\n    "name": "Sample Data",\n    "value": 100\n  }\n]',
        allowVariant: false,
        variantJson:
          '[\n  {\n    "id": "variant1",\n    "label": "Select",\n    "options": []\n  }\n]',
        pipelineJson: '[\n  { "$match": {} }\n]',
        echartsOptions: '{}',
      },
      intelligence: { narrative: { persona: 'technical_expert' } },
    }
    activeDashboard.widgets = [...activeDashboard.widgets, newWidget]
    activeWidget = newWidget
    activeTabConfig = 'design'
    isInspectorOpen = true
  }

  function applyWidgetType(widgetDef) {
    activeWidget.type = widgetDef.id

    if (activeWidget.title === 'New Visualisation') {
      activeWidget.title = widgetDef.name
    }

    if (widgetDef.defaultConfig) {
      if (widgetDef.defaultConfig.echarts_options) {
        activeWidget.config.echartsOptions = JSON.stringify(
          widgetDef.defaultConfig.echarts_options,
          null,
          2
        )
      } else {
        activeWidget.config.echartsOptions = '{}'
      }

      const sampleData = widgetDef.defaultConfig.static_data || widgetDef.defaultConfig.data

      if (sampleData) {
        activeWidget.config.staticJson = JSON.stringify(sampleData, null, 2)
      } else {
        activeWidget.config.staticJson =
          '[\n  {\n    "name": "Kategori A",\n    "value": 100\n  }\n]'
      }
    }

    updateWidgetInDashboard()
  }

  function applyWidgetChanges() {
    if (!activeDashboard || !activeWidget) return

    if (activeWidget.config.dataSourceMode === 'database') {
      activeWidget.config.staticJson = ''
    }

    const idx = activeDashboard.widgets.findIndex((w) => w.id === activeWidget.id)
    if (idx !== -1) {
      activeDashboard.widgets[idx] = $state.snapshot(activeWidget)
      activeDashboard.updated_at = new Date().toISOString()
    }

    isInspectorOpen = false
  }

  function updateWidgetInDashboard() {
    if (!activeDashboard || !activeWidget) return
    const idx = activeDashboard.widgets.findIndex((w) => w.id === activeWidget.id)
    if (idx !== -1) {
      activeDashboard.widgets[idx] = activeWidget
      activeDashboard.updated_at = new Date().toISOString()
    }
  }

  function deleteWidget(widgetId) {
    if (!confirm('Hapus widget ini secara permanen?')) return
    activeDashboard.widgets = activeDashboard.widgets.filter((w) => w.id !== widgetId)
    if (activeWidget?.id === widgetId) {
      activeWidget = null
      isInspectorOpen = false
    }
  }

  function handleDragStart(e, index) {
    if (isPreviewMode) return
    draggedWidgetIndex = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
  }

  function handleDragOver(e) {
    if (isPreviewMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, targetIndex) {
    if (isPreviewMode) return
    e.preventDefault()
    if (draggedWidgetIndex !== null && draggedWidgetIndex !== targetIndex) {
      let widgets = [...activeDashboard.widgets]
      const [movedWidget] = widgets.splice(draggedWidgetIndex, 1)
      widgets.splice(targetIndex, 0, movedWidget)

      activeDashboard.widgets = widgets
      activeDashboard.updated_at = new Date().toISOString()
    }
    draggedWidgetIndex = null
  }

  const filteredWidgets = $derived(
    widgets.filter(
      (w) =>
        w.category === activeCategoryFilter &&
        w.name.toLowerCase().includes(searchComponent.toLowerCase())
    )
  )

  function deleteDashboard(dashId) {
    if (!confirm('Hapus dashboard ini secara permanen? Seluruh widget di dalamnya akan hilang.'))
      return
    dashboards = dashboards.filter((d) => d.id !== dashId)
  }

  export function getDashboardJSON() {
    if (!activeDashboard) return null

    const finalData = $state.snapshot(activeDashboard)

    finalData.widgets = finalData.widgets.map((widget) => {
      if (widget.config.dataSourceMode === 'database') {
        widget.config.staticJson = ''
      } else if (widget.config.dataSourceMode === 'static') {
        widget.config.collectionName = ''
        widget.config.pipelineJson = ''
      }
      return widget
    })

    console.log('🚀 Validated Final Payload for API:', finalData)
    return finalData
  }
</script>

<div class="flex h-full w-full flex-col bg-background text-foreground overflow-hidden font-sans">
  <header
    class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6 z-20 shadow-sm transition-colors"
  >
    <div class="flex items-center gap-2 md:gap-4 overflow-hidden">
      {#if currentStep === 'CANVAS' && !isPreviewMode}
        <button
          aria-label="Back"
          onclick={backToLibrary}
          class="flex shrink-0 h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="hidden md:block h-4 w-px bg-border"></div>
        <div class="flex flex-col min-w-0">
          <h2 class="text-sm font-bold leading-none truncate text-foreground">
            {activeDashboard?.name}
          </h2>
          <span
            class="text-[10px] text-primary font-semibold mt-0.5 uppercase tracking-widest hidden sm:block"
            >AION Studio Editor</span
          >
        </div>
      {:else}
        <div class="flex items-center gap-2 text-primary">
          <i class="fas fa-layer-group"></i>
          <h2 class="text-sm font-black uppercase tracking-widest truncate">Dashboard Library</h2>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2 shrink-0 ml-2">
      {#if currentStep === 'CANVAS'}
        <button
          onclick={() => {
            isPreviewMode = !isPreviewMode
            activeWidget = null
            isInspectorOpen = false
          }}
          class="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold hover:bg-muted transition-colors shadow-sm text-foreground"
        >
          <i class="fas {isPreviewMode ? 'fa-stop text-destructive' : 'fa-play text-emerald-500'}"
          ></i>
          <span class="hidden sm:inline">{isPreviewMode ? 'Exit Preview' : 'Run Preview'}</span>
        </button>
      {/if}
    </div>
  </header>

  {#if currentStep === 'LIBRARY'}
    <main in:fade class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar bg-muted/10">
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl md:text-2xl font-black text-foreground tracking-tight">Overview</h1>
            <p class="text-xs md:text-sm text-muted-foreground font-medium mt-1">
              Manage all your AION intelligence dashboards.
            </p>
          </div>
          <button
            onclick={() => (currentStep = 'SHELL')}
            class="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all"
          >
            <i class="fas fa-plus"></i> Create Dashboard
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {#each dashboards as dash}
            <div
              class="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div>
                <div class="flex items-start justify-between mb-3">
                  <h3 class="font-bold text-foreground text-base line-clamp-1">{dash.name}</h3>
                  <button
                    aria-label="Delete Dashboard"
                    onclick={() => deleteDashboard(dash.id)}
                    class="text-muted-foreground hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ml-2 bg-destructive/10 w-8 h-8 rounded flex items-center justify-center"
                  >
                    <i class="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
                <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
                  <span
                    class="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md border border-border"
                  >
                    <i class="fas fa-chart-pie text-primary"></i>
                    {dash.widgets.length} Widgets
                  </span>
                </div>
              </div>
              <div class="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <span class="text-[10px] text-muted-foreground font-mono"
                  >Edited: {formatDate(dash.updated_at)}</span
                >
                <button
                  onclick={() => {
                    activeDashboard = dash
                    currentStep = 'CANVAS'
                  }}
                  class="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                  >Open Studio &rarr;</button
                >
              </div>
            </div>
          {/each}
        </div>
      </div>
    </main>
  {/if}

  {#if currentStep === 'SHELL'}
    <div
      in:fade
      class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-start justify-center custom-scrollbar bg-muted/10"
    >
      <div
        class="w-full max-w-md my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
      >
        <div class="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
          <h3 class="text-lg font-black text-foreground tracking-tight">Initialize AION Studio</h3>
          <p class="text-[11px] text-muted-foreground font-medium mt-1">
            Berikan nama untuk ruang kerja visualisasi baru Anda.
          </p>
        </div>

        <div class="p-6">
          <div class="space-y-2">
            <label
              for="dashboard-name"
              class="text-xs font-black text-muted-foreground uppercase tracking-widest"
              >Dashboard Name <span class="text-destructive">*</span></label
            >
            <input
              id="dashboard-name"
              bind:value={shellForm.name}
              type="text"
              placeholder="e.g. Sales Performance Q3"
              class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-normal"
            />
          </div>
        </div>

        <div class="shrink-0 border-t border-border bg-muted/30 px-6 py-5 flex justify-end gap-3">
          <button
            onclick={() => (currentStep = 'LIBRARY')}
            class="rounded-xl px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            >Cancel</button
          >
          <button
            onclick={saveShell}
            disabled={!shellForm.name}
            class="rounded-xl bg-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-background shadow-lg hover:opacity-90 disabled:opacity-50 transition-colors"
            >Create Workspace</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if currentStep === 'CANVAS'}
    <div in:fade class="flex flex-1 overflow-hidden relative bg-muted/10">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative transition-all duration-300 w-full"
        onclick={() => {
          if (!isPreviewMode) {
            activeWidget = null
            isInspectorOpen = false
          }
        }}
      >
        <div
          class="absolute inset-0 pointer-events-none opacity-[0.03]"
          style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"
        ></div>

        <div class="max-w-7xl mx-auto relative z-10 pb-20 lg:pb-0">
          <div class="mb-6 flex items-center justify-between gap-4">
            <h2 class="text-xl font-black text-foreground truncate">{activeDashboard?.name}</h2>
            {#if !isPreviewMode}
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  initNewWidget()
                }}
                class="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all"
              >
                <i class="fas fa-plus mr-1"></i> <span class="hidden sm:inline">Add Widget</span>
              </button>
            {/if}
          </div>

          {#if activeDashboard?.widgets.length === 0}
            <div
              class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-2xl bg-card/50 text-center px-4"
            >
              <i class="fas fa-border-all text-4xl text-muted-foreground mb-4"></i>
              <p class="text-sm font-bold text-foreground">Canvas Kosong</p>
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  initNewWidget()
                }}
                class="mt-4 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20"
                >Add First Widget</button
              >
            </div>
          {/if}

          <div class="grid grid-cols-12 gap-4 md:gap-6">
            {#each activeDashboard?.widgets || [] as widget, index}
              {@const isActive = activeWidget?.id === widget.id}
              {@const gridClass =
                widget.config.width === 'quarter'
                  ? 'col-span-12 md:col-span-6 xl:col-span-3'
                  : widget.config.width === 'half'
                    ? 'col-span-12 xl:col-span-6'
                    : 'col-span-12'}

              <div
                draggable={!isPreviewMode}
                ondragstart={(e) => handleDragStart(e, index)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, index)}
                class="{gridClass} flex flex-col rounded-2xl border bg-card shadow-sm transition-all overflow-hidden {isPreviewMode
                  ? 'border-border'
                  : isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-xl'
                    : 'border-border hover:border-primary/50 cursor-pointer'} {draggedWidgetIndex ===
                index
                  ? 'opacity-40 scale-95'
                  : 'opacity-100'}"
                onclick={(e) => {
                  if (!isPreviewMode) {
                    e.stopPropagation()
                    activeWidget = widget
                    isInspectorOpen = true
                  }
                }}
              >
                <div class="p-4 flex flex-col flex-1 min-h-[220px]">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-colors"
                        title={!isPreviewMode ? 'Drag to reorder' : ''}
                      >
                        <i class="{widget.config.icon} text-sm"></i>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-foreground truncate max-w-[200px]"
                          >{widget.title}</span
                        >
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex-1 flex flex-col items-center justify-center opacity-40 mt-2 border-2 border-dashed border-border rounded-xl bg-muted/30 relative"
                  >
                    {#if !widget.type}
                      <i class="fas fa-chart-area text-3xl mb-2 text-muted-foreground"></i>
                      <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                        >Select Visual Type</span
                      >
                    {:else}
                      <i
                        class="{widgets.find((w) => w.id === widget.type)?.icon ||
                          'fas fa-chart-line'} text-3xl mb-2 text-muted-foreground"
                      ></i>
                      <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                        >{widget.type} Rendering</span
                      >
                    {/if}
                  </div>
                </div>

                <div class="bg-muted/40 px-4 py-3 flex gap-3 items-start border-t border-border/50">
                  <div
                    class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20"
                  >
                    <i class="fas fa-robot text-primary text-[10px]"></i>
                  </div>
                  <div class="flex-1 min-w-0 pt-0.5">
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-[9px] font-black uppercase tracking-widest text-primary/70"
                        >AION Insights • {widget.intelligence.narrative.persona.replace(
                          '_',
                          ' '
                        )}</span
                      >
                      <span class="relative flex h-1.5 w-1.5"
                        ><span
                          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75"
                        ></span><span
                          class="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                        ></span></span
                      >
                    </div>
                    <p class="text-[10px] text-foreground/80 leading-relaxed font-medium">
                      {#if widget.intelligence.narrative.persona === 'technical_expert'}
                        Data pada <span class="font-bold"
                          >{widget.config.dataSourceMode === 'database'
                            ? widget.config.collectionName || '[Collection]'
                            : 'Static Pipeline'}</span
                        > menunjukkan stabilitas sistematik. Eksekusi query aggregation terverifikasi.
                      {:else if widget.intelligence.narrative.persona === 'executive'}
                        Rangkuman performa "{widget.title}" dalam operasional. Metrik terpantau
                        dalam standar deviasi wajar.
                      {:else}
                        <span class="text-destructive font-bold">[MONITORING]</span> Memantau
                        anomali pada source
                        <span class="font-bold">{widget.config.dataSourceMode}</span>. Menunggu
                        validasi Rule Engine.
                      {/if}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      {#if !isPreviewMode}
        {#if isInspectorOpen}
          <button
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onclick={() => (isInspectorOpen = false)}
            aria-label="Close Inspector Panel"
          ></button>
        {/if}

        <div
          role="button"
          tabindex="0"
          class="
            fixed inset-y-0 right-0 z-50 w-[90vw] sm:w-[420px] bg-card border-l border-border flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
            {isInspectorOpen ? 'translate-x-0' : 'translate-x-full'}
          "
          onkeydown={(e) => e.stopPropagation()}
          onclick={(e) => e.stopPropagation()}
        >
          <div class="h-full flex flex-col w-full">
            <div
              class="h-14 border-b border-border flex justify-between items-center px-5 bg-muted/30 shrink-0"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner"
                >
                  <i class="fas fa-sliders-h text-xs"></i>
                </div>
                <h3 class="font-bold text-foreground text-[10px] uppercase tracking-widest">
                  Widget Settings
                </h3>
              </div>

              <div class="flex items-center gap-2">
                {#if activeWidget}
                  <button
                    onclick={() => deleteWidget(activeWidget.id)}
                    class="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors shadow-sm"
                    title="Delete Widget"
                  >
                    <i class="fas fa-trash-alt text-xs"></i>
                  </button>
                  <div class="h-6 w-px bg-border mx-1"></div>
                {/if}
                <button
                  onclick={() => (isInspectorOpen = false)}
                  class="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shadow-sm"
                  title="Close Panel"
                >
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>
            </div>

            {#if !activeWidget}
              <div
                class="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-60 bg-card"
              >
                <i class="fas fa-hand-pointer text-3xl mb-4 text-muted-foreground"></i>
                <p class="text-sm font-bold text-foreground">No Widget Selected</p>
              </div>
            {:else}
              <div class="px-5 py-4 border-b border-border bg-card shrink-0">
                <input
                  bind:value={activeWidget.title}
                  class="w-full text-lg font-black text-foreground bg-transparent border-b border-dashed border-border focus:border-primary outline-none pb-1 transition-colors"
                  placeholder="Widget Title..."
                />
                <span class="text-[9px] font-mono text-muted-foreground mt-1 block"
                  >ID: {activeWidget.id}</span
                >
              </div>

              <div class="flex p-2 bg-muted/20 border-b border-border shrink-0">
                <button
                  onclick={() => (activeTabConfig = 'design')}
                  class="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all {activeTabConfig ===
                  'design'
                    ? 'bg-background shadow-sm text-primary border border-border'
                    : 'text-muted-foreground'}">Design</button
                >
                <button
                  onclick={() => (activeTabConfig = 'data')}
                  class="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all {activeTabConfig ===
                  'data'
                    ? 'bg-background shadow-sm text-emerald-600 dark:text-emerald-400 border border-border'
                    : 'text-muted-foreground'}">Data</button
                >
                <button
                  onclick={() => (activeTabConfig = 'ai')}
                  class="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all {activeTabConfig ===
                  'ai'
                    ? 'bg-background shadow-sm text-purple-600 dark:text-purple-400 border border-border'
                    : 'text-muted-foreground'}">AI Rules</button
                >
              </div>

              <div class="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-card">
                {#if activeTabConfig === 'design'}
                  <div in:fade={{ duration: 150 }} class="space-y-6">
                    <div class="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                      <label
                        for="Component Type"
                        class="text-[10px] font-black text-muted-foreground uppercase tracking-widest block"
                        >Component Type</label
                      >
                      <div class="flex flex-wrap gap-1.5 mb-3">
                        {#each categories as cat}
                          <button
                            onclick={() => {
                              activeCategoryFilter = cat.id
                              searchComponent = ''
                            }}
                            class="px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all border {activeCategoryFilter ===
                            cat.id
                              ? `border-transparent bg-primary/10 text-primary`
                              : 'border-border text-muted-foreground bg-background'}"
                            >{cat.name}</button
                          >
                        {/each}
                      </div>
                      <div
                        class="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1"
                      >
                        {#each filteredWidgets as visual}
                          <button
                            onclick={() => applyWidgetType(visual)}
                            class="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all {activeWidget.type ===
                            visual.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:border-primary/50'}"
                          >
                            <i
                              class="fas {visual.icon} text-lg text-muted-foreground {activeWidget.type ===
                              visual.id
                                ? 'text-primary'
                                : ''}"
                            ></i>
                            <span class="text-[9px] font-bold leading-tight text-foreground"
                              >{visual.name}</span
                            >
                          </button>
                        {/each}
                      </div>
                    </div>

                    <div class="space-y-4">
                      <label
                        for="layout-meta"
                        class="text-[10px] font-black text-muted-foreground uppercase tracking-widest block border-b border-border pb-2"
                        >Layout & Meta</label
                      >

                      <div class="space-y-1.5">
                        <label for="icon-class" class="text-[10px] font-bold text-muted-foreground"
                          >Icon Class</label
                        >
                        <input
                          type="text"
                          id="icon-class"
                          bind:value={activeWidget.config.icon}
                          class="w-full p-2.5 bg-background border border-border rounded-lg text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                          <label
                            for="width-layout"
                            class="text-[10px] font-bold text-muted-foreground">Width Layout</label
                          >
                          <select
                            id="width-layout"
                            bind:value={activeWidget.config.width}
                            class="w-full p-2.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-primary"
                          >
                            <option value="quarter">Quarter (1/4)</option>
                            <option value="half">Half (1/2)</option>
                            <option value="full">Full (1/1)</option>
                          </select>
                        </div>
                        <div class="space-y-1.5">
                          <label
                            for="auto-refresh"
                            class="text-[10px] font-bold text-muted-foreground">Auto Refresh</label
                          >
                          <select
                            id="auto-refresh"
                            bind:value={activeWidget.config.refresh}
                            class="w-full p-2.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground outline-none focus:border-primary"
                          >
                            <option value="0">Off (0s)</option>
                            <option value="10">10 Sec</option>
                            <option value="30">30 Sec</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}

                {#if activeTabConfig === 'data'}
                  <div in:fade={{ duration: 150 }} class="space-y-6">
                    <div class="flex p-1 bg-muted/40 rounded-xl border border-border/50">
                      <button
                        onclick={() => (activeWidget.config.dataSourceMode = 'static')}
                        class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 {activeWidget
                          .config.dataSourceMode === 'static'
                          ? 'bg-background shadow-sm text-blue-500 ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground'}"
                      >
                        <i class="fas fa-code mr-1.5 opacity-70"></i> Static JSON
                      </button>
                      <button
                        onclick={() => (activeWidget.config.dataSourceMode = 'database')}
                        class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 {activeWidget
                          .config.dataSourceMode === 'database'
                          ? 'bg-background shadow-sm text-emerald-500 ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground'}"
                      >
                        <i class="fas fa-database mr-1.5 opacity-70"></i> Database
                      </button>
                    </div>

                    {#if activeWidget.config.dataSourceMode === 'database'}
                      <div in:slide class="space-y-5">
                        <div
                          class="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex flex-col gap-2 relative overflow-hidden"
                        >
                          <div
                            class="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full -z-10"
                          ></div>

                          <label
                            for="Collection Target"
                            class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"
                          >
                            <i class="fas fa-server"></i> Collection Target
                          </label>
                          <input
                            type="text"
                            bind:value={activeWidget.config.collectionName}
                            placeholder="e.g. factory_sensors"
                            class="w-full p-2.5 bg-background/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg text-xs font-mono font-bold text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                          <p class="text-[9px] text-muted-foreground font-medium">
                            Pastikan nama koleksi sesuai dengan skema database.
                          </p>
                        </div>

                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <label
                              for="aggregation-pipeline"
                              class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                              >Aggregation Pipeline</label
                            >
                            <span
                              class="text-[8px] font-mono text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20"
                              >Array</span
                            >
                          </div>
                          <div
                            class="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0f172a] shadow-inner focus-within:border-orange-500/50 transition-colors"
                          >
                            <div
                              class="h-6 bg-[#1e293b] border-b border-slate-700/50 flex items-center px-3 gap-1.5"
                            >
                              <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                              <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                            </div>
                            <textarea
                              bind:value={activeWidget.config.pipelineJson}
                              rows="5"
                              class="w-full bg-transparent text-orange-300 p-3.5 text-[11px] md:text-xs font-mono outline-none resize-y custom-scrollbar block leading-relaxed"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div in:slide class="space-y-1.5">
                        <div class="flex items-center justify-between">
                          <label
                            for="static-data-array"
                            class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                            >Static Data Array</label
                          >
                          <span
                            class="text-[8px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20"
                            >JSON</span
                          >
                        </div>
                        <div
                          class="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0f172a] shadow-inner focus-within:border-green-500/50 transition-colors"
                        >
                          <div
                            class="h-6 bg-[#1e293b] border-b border-slate-700/50 flex items-center px-3 gap-1.5"
                          >
                            <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                            <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                          </div>
                          <textarea
                            bind:value={activeWidget.config.staticJson}
                            rows="8"
                            class="w-full bg-transparent text-green-400 p-3.5 text-[11px] md:text-xs font-mono outline-none resize-y custom-scrollbar block leading-relaxed"
                          ></textarea>
                        </div>
                      </div>
                    {/if}

                    <div class="relative py-2">
                      <div class="absolute inset-0 flex items-center" aria-hidden="true">
                        <div class="w-full border-t border-border border-dashed"></div>
                      </div>
                      <div class="relative flex justify-center">
                        <span
                          class="bg-card px-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"
                          >ECharts Core</span
                        >
                      </div>
                    </div>

                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between">
                        <label
                          for="visual-options"
                          class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                          >Visual Options</label
                        >
                        <span
                          class="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20"
                          >Object</span
                        >
                      </div>
                      <div
                        class="rounded-xl overflow-hidden border border-slate-700/50 bg-[#0f172a] shadow-inner focus-within:border-blue-500/50 transition-colors"
                      >
                        <div
                          class="h-6 bg-[#1e293b] border-b border-slate-700/50 flex items-center px-3 gap-1.5"
                        >
                          <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                          <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                        </div>
                        <textarea
                          bind:value={activeWidget.config.echartsOptions}
                          rows="8"
                          class="w-full bg-transparent text-blue-300 p-3.5 text-[11px] md:text-xs font-mono outline-none resize-y custom-scrollbar block leading-relaxed"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                {/if}

                {#if activeTabConfig === 'ai'}
                  <div in:fade={{ duration: 150 }} class="space-y-5">
                    <div
                      class="rounded-xl border border-purple-500/20 p-4 bg-purple-500/5 shadow-sm"
                    >
                      <div class="flex items-center justify-between mb-3">
                        <span
                          class="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest"
                          ><i class="fas fa-robot mr-1"></i> Semantic AI (P11)</span
                        >
                      </div>
                      <label
                        for="ai-narrative-persona"
                        class="text-[10px] font-bold text-muted-foreground mb-1.5 block"
                        >AI Narrative Persona</label
                      >
                      <select
                        id="ai-narrative-persona"
                        bind:value={activeWidget.intelligence.narrative.persona}
                        class="w-full text-xs font-bold rounded-lg border border-border bg-background px-3 py-2.5 focus:outline-none focus:border-purple-500 text-foreground"
                      >
                        <option value="technical_expert">Technical Expert</option>
                        <option value="executive">Executive Summary</option>
                        <option value="anomaly">Anomaly Detector</option>
                      </select>
                      <p class="text-[9px] text-muted-foreground mt-2 font-medium leading-relaxed">
                        Persona ini akan mendikte gaya bahasa AI pada kotak narasi permanen di bawah
                        grafik.
                      </p>
                    </div>
                  </div>
                {/if}
              </div>

              <div class="p-5 border-t border-border bg-card shrink-0">
                <button
                  onclick={applyWidgetChanges}
                  class="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <i class="fas fa-check-circle"></i> Apply Changes
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
