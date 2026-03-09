<script>
  import { onMount } from 'svelte'
  import { fade, slide, fly } from 'svelte/transition'
  import { WidgetRegistry } from '~/utils/widgetRegistry.ts'
  import { Confirm } from '~/utils/confirm.svelte'
  import { toast } from '~/utils/toast.svelte'
  import { getCsrfToken } from '~/utils/getCrsfToken'
  import { EncryptionService } from '~/stores/encryption'
  import { formatJsonUtility } from '~/utils/MenuSanitize'

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
  let isLoading = $state(true)
  let currentStep = $state('LIBRARY')
  let isPreviewMode = $state(false)
  let isInspectorOpen = $state(false)

  let activeTabConfig = $state('design')
  let activeCategoryFilter = $state(categories[0]?.id)
  let searchComponent = $state('')

  let dashboards = $state([])
  let meta = $state(null)
  let searchQuery = $state('')
  let searchTimer = null

  let activeDashboard = $state(null)
  let activeWidget = $state(null)

  let draggedWidgetIndex = $state(null)

  let shellForm = $state({ name: '' })

  function handleSearch(e) {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      console.log('Searching for:', searchQuery)
    }, 500)
  }

  async function loadDashboards(currentPage = 1, itemsPerPage = 10, searchQuery = null) {
    try {
      isLoading = true
      let params_object = {
        page: String(currentPage),
        limit: String(itemsPerPage),
      }
      if (searchQuery) {
        params_object.search = searchQuery
      }
      const params = new URLSearchParams(params_object)
      const res = await fetch(`/api/collections/dashboard_settings?${params.toString()}`)
      const result = await res.json()

      if (res.ok) {
        const decryptedRaw = EncryptionService.decrypt(result.nonce, result.ciphertext)
        const data = typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
        dashboards = data.data
        meta = {
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        }
      }
    } catch (err) {
      toast.add('Gagal memuat data', 'error')
    } finally {
      isLoading = false
    }
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function backToLibrary() {
    if (
      currentStep === 'CANVAS' &&
      !(await Confirm.show({
        title: 'Kembali ke Library? ',
        message: 'Pastikan konfigurasi Anda telah disimpan.',
        confirmText: 'Ya',
        type: 'warning',
      }))
    )
      return
    currentStep = 'LIBRARY'
    activeDashboard = null
    activeWidget = null
    isInspectorOpen = false
  }

  let isSubmittingShell = $state(false)

  let jsonErrors = $state({
    static: false,
    echarts: false,
    variant: false,
  })

  async function saveShell() {
    if (!shellForm.name.trim()) {
      toast.add('Nama Dashboard wajib diisi.', 'info')
      return
    }

    try {
      isSubmittingShell = true

      const res = await fetch('/api/collections/dashboard_settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          name: shellForm.name,
          widgets: [],
          updated_at: new Date().toISOString(),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || 'Gagal membuat dashboard.')
      }
      activeDashboard = { _id: result.insertedId, widgets: [] }
      loadDashboards()
      toast.add('Dashboard berhasil dibuat.', 'success', 1000)

      currentStep = 'CANVAS'
      shellForm = { name: '' }
    } catch (err) {
      toast.add(err.message, 'error')
    } finally {
      isSubmittingShell = false
    }
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
        variantJson: JSON.stringify(
          [
            {
              id: 'id',
              label: 'label',
              options: [
                {
                  label: 'label',
                  value: 'value',
                },
                {
                  label2: 'label2',
                  value: 'value2',
                },
              ],
              default: 'label',
            },
          ],
          null,
          2
        ),
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
    activeWidget.category = widgetDef.category

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

  async function deleteWidget(widgetId) {
    if (
      !(await Confirm.show({
        title: 'Hapus Widget? ',
        message: 'Hapus widget ini secara permanen?',
        confirmText: 'Ya, Hapus',
        type: 'destructive',
      }))
    )
      return
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

  async function deleteDashboard(dashId) {
    const confirmed = await Confirm.show({
      title: 'Hapus Dashboard?',
      message: 'Hapus dashboard ini secara permanen? Seluruh widget di dalamnya akan hilang.',
      confirmText: 'Ya, Hapus',
      type: 'destructive',
    })

    if (!confirmed) return

    try {
      const res = await fetch(`/api/collections/dashboard_settings/${dashId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus dashboard dari server.')
      }
      if (activeDashboard?._id === dashId) {
        activeDashboard = null
        currentStep = 'SHELL'
      }
      loadDashboards()
      toast.add('Dashboard telah dihapus secara permanen.', 'success', 1000)
    } catch (error) {
      console.error('[Delete Dashboard Error]:', error)
      toast.add(error.message, 'error')
    }
  }

  function BeautifyDataConfig(data) {
    const FormatdataStaticJson = formatJsonUtility(data.staticJson)
    const FormatdatavariantJson = formatJsonUtility(data.variantJson)
    const FormatdataechartsOptions = formatJsonUtility(data.echartsOptions)

    data.staticJson = !FormatdataStaticJson.error
      ? FormatdataStaticJson.data
      : FormatdataStaticJson.msg
    data.variantJson = !FormatdatavariantJson.error
      ? FormatdatavariantJson.data
      : FormatdatavariantJson.msg
    data.echartsOptions = !FormatdataechartsOptions.error
      ? FormatdataechartsOptions.data
      : FormatdataechartsOptions.msg
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
      const config = widget.config
      const jsonFields = ['staticJson', 'variantJson', 'pipelineJson', 'echartsOptions']
      jsonFields.forEach((field) => {
        if (config[field] && typeof config[field] === 'string' && config[field].trim() !== '') {
          try {
            config[field] = JSON.parse(config[field])
          } catch (e) {
            toast.add(
              `Format JSON pada field "${field}" di widget "${widget.title}" tidak valid.`,
              'warning'
            )
            throw new Error(
              `Format JSON pada field "${field}" di widget "${widget.title}" tidak valid.`
            )
          }
        } else if (config[field] === '') {
          config[field] = field === 'echartsOptions' ? {} : []
        }
      })
      return widget
    })
    return finalData
  }

  onMount(() => {
    loadDashboards()
  })
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
    <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10 custom-scrollbar">
      <div class="max-w-[1400px] mx-auto space-y-6">
        <div
          class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-border/40"
        >
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">Dashboards</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Kelola dan analisis dasbor intelijen Anda.
            </p>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative w-full sm:w-72">
              <i
                class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm"
              ></i>
              <input
                type="text"
                bind:value={searchQuery}
                oninput={handleSearch}
                placeholder="Cari dasbor..."
                class="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xs"
              />
            </div>

            <button
              onclick={() => (currentStep = 'SHELL')}
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <i class="fas fa-plus text-sm"></i>
              <span>Dasbor Baru</span>
            </button>
          </div>
        </div>

        {#if isLoading}
          <div class="flex flex-col items-center justify-center py-20">
            <div class="relative">
              <div
                class="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
              ></div>
            </div>
            <p class="text-sm text-muted-foreground mt-4">Memuat dasbor...</p>
          </div>
        {:else if !dashboards || dashboards.length === 0}
          <div
            class="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-border/60 rounded-lg bg-background/50 backdrop-blur-sm"
          >
            <div
              class="w-20 h-20 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            >
              {#if searchQuery}
                <i class="fas fa-search text-3xl"></i>
              {:else}
                <i class="fas fa-chart-pie text-3xl"></i>
              {/if}
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Dasbor'}
            </h3>
            <p class="text-sm text-muted-foreground max-w-md mb-6">
              {searchQuery
                ? `Maaf, kami tidak dapat menemukan dasbor dengan kata kunci "${searchQuery}".`
                : 'Mulai dengan membuat dasbor intelijen pertama Anda.'}
            </p>
            {#if !searchQuery}
              <button
                onclick={() => (currentStep = 'SHELL')}
                class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md transition-all"
              >
                <i class="fas fa-plus"></i>
                <span>Buat Dasbor</span>
              </button>
            {/if}
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {#each dashboards as dash}
              <div
                class="group relative flex flex-col rounded-lg border border-border/50 bg-card p-5 shadow-sm hover:shadow-lg hover:border-border/80 transition-all duration-200"
              >
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-semibold text-foreground text-base truncate" title={dash.name}>
                    {dash.name}
                  </h3>
                  <button
                    aria-label="Hapus dasbor"
                    onclick={() => deleteDashboard(dash._id)}
                    class="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
                    title="Hapus"
                  >
                    <i class="fa-solid fa-eraser text-sm"></i>
                  </button>
                </div>

                <p class="text-xs font-mono text-muted-foreground/70 mt-1">ID: {dash._id}</p>

                <div class="flex-1"></div>

                <div class="mt-5 pt-4 border-t border-border/40 space-y-4">
                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1.5" title="Jumlah Widget">
                      <i class="fas fa-chart-pie text-primary/70 w-4"></i>
                      <span>{dash.widgets?.length || 0} widget</span>
                    </span>
                    <span class="flex items-center gap-1.5" title="Terakhir diperbarui">
                      <i class="fas fa-clock text-primary/70 w-4"></i>
                      <span>{formatDate(dash.updated_at)}</span>
                    </span>
                  </div>

                  <button
                    onclick={() => {
                      activeDashboard = dash
                      currentStep = 'CANVAS'
                    }}
                    class="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:shadow-sm active:scale-[0.98]"
                  >
                    <i class="fas fa-external-link-alt text-xs"></i>
                    <span>Buka Studio</span>
                  </button>
                </div>
              </div>
            {/each}
          </div>

          {#if meta}
            <div class="flex items-center justify-between mt-6 pt-5 border-t border-border/40">
              <span class="text-sm text-muted-foreground">
                Halaman <span class="font-medium text-foreground">{meta.page}</span> dari {meta.totalPages}
              </span>
              <div class="flex gap-2">
                <button
                  aria-label="prev"
                  disabled={meta.page === 1}
                  onclick={() => (meta.page = meta.page - 1)}
                  class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button
                  aria-label="next"
                  disabled={meta.page === meta.totalPages}
                  onclick={() => (meta.page = meta.page + 1)}
                  class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </main>
  {/if}

  {#if currentStep === 'SHELL'}
    <div
      role="button"
      tabindex="0"
      class="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
      onclick={() => (currentStep = 'LIBRARY')}
      onkeydown={() => (currentStep = 'LIBRARY')}
    >
      <div
        role="button"
        tabindex="0"
        class="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col z-[101]"
        in:fly={{ x: 400, duration: 400, opacity: 1 }}
        out:fly={{ x: 400, duration: 300, opacity: 1 }}
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <div class="shrink-0 bg-gradient-to-r from-primary/5 to-transparent px-8 py-10">
          <div
            class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner"
          >
            <i class="fas fa-rocket text-xl"></i>
          </div>
          <h3 class="text-2xl font-black text-foreground tracking-tight uppercase">
            Initialize <span class="text-primary">AION</span> Studio
          </h3>
          <p class="text-[11px] text-muted-foreground font-medium mt-2 leading-relaxed italic">
            Langkah awal membangun pusat kendali data Anda. Berikan identitas unik untuk ruang kerja
            baru ini.
          </p>
        </div>

        <div class="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          <div class="space-y-6">
            <div class="group space-y-2.5">
              <label
                for="dashboard-name"
                class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors"
              >
                Dashboard Name <span class="text-destructive">*</span>
              </label>
              <div class="relative">
                <input
                  id="dashboard-name"
                  bind:value={shellForm.name}
                  type="text"
                  placeholder="e.g. Sales Performance Q3"
                  class="w-full rounded-lg border border-border bg-background px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:font-normal placeholder:text-muted-foreground/40 shadow-sm"
                />
                <div class="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/20">
                  <i class="fas fa-edit text-xs"></i>
                </div>
              </div>
            </div>

            <div
              class="p-4 rounded-lg bg-muted/30 border border-dashed border-border flex items-start gap-3"
            >
              <i class="fas fa-info-circle text-primary mt-0.5 text-xs"></i>
              <p class="text-[10px] text-muted-foreground leading-tight">
                Nama ini akan digunakan sebagai identitas utama di sidebar dan header navigasi. Anda
                dapat mengubahnya kapan saja di pengaturan dashboard.
              </p>
            </div>
          </div>
        </div>

        <div class="shrink-0 p-8 border-t border-border bg-muted/20 flex flex-col gap-3">
          <button
            onclick={saveShell}
            disabled={isSubmittingShell || !shellForm.name.trim()}
            class="w-full flex items-center justify-center gap-3 rounded-lg bg-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {#if isSubmittingShell}
              <i class="fas fa-circle-notch fa-spin"></i> Processing...
            {:else}
              <i class="fas fa-check"></i> Launch Workspace
            {/if}
          </button>

          <button
            onclick={() => (currentStep = 'LIBRARY')}
            class="w-full rounded-lg px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            Discard & Back
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if currentStep === 'CANVAS'}
    <div in:fade class="flex flex-1 overflow-hidden relative bg-muted/10">
      <div
        role="button"
        tabindex="0"
        class="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative transition-all duration-300 w-full"
        onclick={() => {
          if (!isPreviewMode) {
            activeWidget = null
            isInspectorOpen = false
          }
        }}
        onkeydown={() => {
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
          <div class="mb-5 flex items-center justify-between gap-4">
            <h2 class="text-lg font-semibold text-foreground tracking-tight truncate">
              {activeDashboard?.name}
            </h2>
            {#if !isPreviewMode}
              <button
                onclick={(e) => {
                  e.stopPropagation()
                  initNewWidget()
                }}
                class="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <i class="fas fa-plus text-xs"></i>
                <span class="hidden sm:inline">Add Widget</span>
              </button>
            {/if}
          </div>

          {#if activeDashboard?.widgets.length === 0}
            <div
              class="flex flex-col items-center justify-center py-14 border border-dashed border-border/60 rounded-[2rem] bg-card/40 backdrop-blur-md text-center px-8 group transition-all duration-500 hover:border-primary/40 hover:bg-card/60"
            >
              <div class="relative mb-5">
                <div
                  class="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                ></div>

                <div
                  class="relative w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center shadow-inner border border-border/40 group-hover:scale-105 group-hover:bg-primary/5 transition-all duration-500"
                >
                  <i
                    class="fas fa-layer-group text-xl text-muted-foreground/40 group-hover:text-primary/60 transition-colors"
                  ></i>
                </div>
              </div>

              <h3 class="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-2">
                Canvas Empty
              </h3>
              <p
                class="text-[10px] text-muted-foreground max-w-[210px] leading-relaxed font-medium opacity-70"
              >
                Siap untuk berkreasi? Tambahkan widget pertama Anda untuk memulai visualisasi.
              </p>

              <button
                onclick={(e) => {
                  e.stopPropagation()
                  initNewWidget()
                }}
                class="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary-foreground bg-primary px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <i class="fas fa-plus-circle text-[10px]"></i>
                Initialize Widget
              </button>
            </div>
          {/if}

          <div class="grid grid-cols-12 gap-4 md:gap-5">
            {#each activeDashboard?.widgets || [] as widget, index}
              {@const isActive = activeWidget?.id === widget.id}
              {@const gridClass =
                widget.config.width === 'quarter'
                  ? 'col-span-12 md:col-span-6 xl:col-span-3'
                  : widget.config.width === 'half'
                    ? 'col-span-12 xl:col-span-6'
                    : 'col-span-12'}

              <div
                role="button"
                tabindex="0"
                onkeydown={(e) => {}}
                draggable={!isPreviewMode}
                ondragstart={(e) => handleDragStart(e, index)}
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, index)}
                class="{gridClass} group relative flex flex-col rounded-xl border bg-card shadow-sm transition-all overflow-hidden
                  {isPreviewMode
                  ? 'border-border'
                  : isActive
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/30 hover:shadow-md cursor-pointer'}
                  {draggedWidgetIndex === index ? 'opacity-40 scale-[0.98]' : 'opacity-100'}"
                onclick={(e) => {
                  if (!isPreviewMode) {
                    e.stopPropagation()
                    activeWidget = widget
                    isInspectorOpen = true
                    const masterInfo = widgets.find((w) => w.id === widget.type)
                    activeCategoryFilter = masterInfo.category || ''
                  }
                }}
              >
                <div class="p-4 flex flex-col flex-1 min-h-[200px]">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-colors"
                        title={!isPreviewMode ? 'Drag to reorder' : ''}
                      >
                        <i class="{widget.config.icon} text-xs"></i>
                      </div>
                      <span class="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {widget.title}
                      </span>
                    </div>
                  </div>

                  <div
                    class="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 p-4"
                  >
                    {#if !widget.type}
                      <i class="fas fa-chart-area text-2xl text-muted-foreground/40 mb-2"></i>
                      <span
                        class="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider"
                      >
                        Select Visual Type
                      </span>
                    {:else}
                      <i
                        class="{widgets.find((w) => w.id === widget.type)?.icon ||
                          'fas fa-chart-line'} text-2xl text-muted-foreground/40 mb-2"
                      ></i>
                      <span
                        class="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider"
                      >
                        {widget.type}
                      </span>
                    {/if}
                  </div>
                </div>

                {#if widget.intelligence?.narrative?.persona}
                  <div class="bg-muted/20 px-4 py-3 border-t border-border/40">
                    <div class="flex gap-2.5">
                      <div
                        class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                      >
                        <i class="fas fa-robot text-primary text-[9px]"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                          <span
                            class="text-[8px] font-semibold uppercase tracking-wider text-primary/70"
                          >
                            {widget.intelligence.narrative.persona.replace('_', ' ')}
                          </span>
                          <span class="relative flex h-1.5 w-1.5">
                            <span
                              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40"
                            ></span>
                            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                            ></span>
                          </span>
                        </div>
                        <p class="text-[9px] text-foreground/70 leading-relaxed line-clamp-2">
                          {#if widget.intelligence.narrative.persona === 'technical_expert'}
                            Data pada <span class="font-medium text-foreground/90">
                              {widget.config.dataSourceMode === 'database'
                                ? widget.config.collectionName || '[Collection]'
                                : 'Static Pipeline'}
                            </span> stabil.
                          {:else if widget.intelligence.narrative.persona === 'executive'}
                            Performa {widget.title} dalam batas normal.
                          {:else}
                            <span class="text-destructive font-medium">[MONITORING]</span> Anomali terdeteksi.
                          {/if}
                        </p>
                      </div>
                    </div>
                  </div>
                {/if}
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
                  onclick={() => (
                    (activeTabConfig = 'data'),
                    BeautifyDataConfig(activeWidget.config)
                  )}
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

                        <div class="space-y-3 mt-4">
                          <div class="flex items-end justify-between px-1">
                            <div class="space-y-1">
                              <div class="flex items-center gap-2">
                                <h4
                                  class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]"
                                >
                                  Aggregation Pipeline
                                </h4>
                                <span
                                  class="flex h-1.5 w-1.5 rounded-full bg-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                                ></span>
                              </div>
                              <p class="text-[9px] text-muted-foreground italic">
                                Konfigurasi query database
                              </p>
                            </div>

                            <button
                              type="button"
                              onclick={() => {
                                const res = formatJsonUtility(activeWidget.config.pipelineJson)
                                activeWidget.config.pipelineJson = res.data
                                jsonErrors.pipeline = res.error
                              }}
                              class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all {jsonErrors.pipeline
                                ? 'text-red-500 animate-pulse'
                                : 'text-primary hover:text-primary/70 active:scale-95'}"
                            >
                              <i
                                class="fas {jsonErrors.pipeline
                                  ? 'fa-exclamation-triangle'
                                  : 'fa-wand-magic-sparkles'} text-[10px]"
                              ></i>
                              Format
                            </button>
                          </div>

                          <div
                            class="group rounded-lg border bg-[#0b0e14] shadow-2xl overflow-hidden transition-all duration-300 {jsonErrors.pipeline
                              ? 'border-red-500/50 ring-4 ring-red-500/5'
                              : 'border-slate-700/40 focus-within:border-indigo-500/40 focus-within:ring-4 focus-within:ring-indigo-500/5'}"
                          >
                            <div
                              class="h-8 bg-[#161b22] border-b border-slate-800/50 flex items-center justify-between px-4"
                            >
                              <div class="flex items-center gap-2">
                                <div class="flex gap-1.5">
                                  <div
                                    class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-red-500/40 transition-colors"
                                  ></div>
                                  <div
                                    class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-amber-500/40 transition-colors"
                                  ></div>
                                  <div
                                    class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-emerald-500/40 transition-colors"
                                  ></div>
                                </div>
                                <div class="h-3 w-px bg-slate-800 mx-1"></div>
                                <span
                                  class="text-[9px] font-mono text-slate-500 uppercase tracking-tighter"
                                  >pipeline.json</span
                                >
                              </div>
                              <span
                                class="text-[8px] font-mono text-indigo-400/50 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 uppercase"
                                >JSON Array</span
                              >
                            </div>

                            <textarea
                              bind:value={activeWidget.config.pipelineJson}
                              onblur={() => {
                                const res = formatJsonUtility(activeWidget.config.pipelineJson)
                                jsonErrors.pipeline = res.error
                              }}
                              spellcheck="false"
                              rows="8"
                              class="w-full bg-transparent p-5 text-[12px] font-mono outline-none resize-y custom-scrollbar block leading-relaxed placeholder:text-slate-800 selection:bg-indigo-500/20 {jsonErrors.pipeline
                                ? 'text-red-400'
                                : 'text-indigo-300'}"
                              placeholder={'[\n  { "$match": {} }\n]'}
                            ></textarea>
                          </div>
                          <div
                            class="flex items-center gap-1.5 text-[9px] text-slate-400 bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-700/40"
                          >
                            <span class="opacity-70">Support Injection:</span>
                            <code class="text-indigo-300 font-bold px-1 rounded">
                              Cara Kerja Injection: Gunakan ID Variant (cth: YEAR) sebagai
                              placeholder: {JSON.stringify({ $match: { tahun: '{{YEAR}}' } })}.
                              Sistem akan otomatis menggantinya berdasarkan pilihan dropdown user.
                            </code>
                          </div>
                        </div>
                        <div class="space-y-3 mt-6 pt-4 border-t border-border/50">
                          <div class="flex items-center justify-between px-1">
                            <div class="flex items-center gap-3">
                              <label class="relative inline-flex items-center cursor-pointer group">
                                <input
                                  type="checkbox"
                                  bind:checked={activeWidget.config.useVariant}
                                  class="sr-only peer"
                                />
                                <div
                                  class="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-orange-500/90 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 shadow-inner group-hover:ring-4 group-hover:ring-orange-500/10"
                                ></div>
                              </label>

                              <label
                                for="variant-dasboard"
                                class="text-[10px] font-black uppercase tracking-widest transition-colors {activeWidget
                                  .config.useVariant
                                  ? 'text-orange-400'
                                  : 'text-muted-foreground/50'}"
                              >
                                Variant Interface
                              </label>
                            </div>

                            {#if activeWidget.config.useVariant}
                              <button
                                type="button"
                                onclick={() => {
                                  const res = formatJsonUtility(activeWidget.config.variantJson)
                                  activeWidget.config.variantJson = res.data
                                  jsonErrors.variant = res.error
                                }}
                                class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all {jsonErrors.variant
                                  ? 'text-red-500 animate-pulse'
                                  : 'text-primary hover:text-primary/70 active:scale-95'}"
                              >
                                <i
                                  class="fas {jsonErrors.variant
                                    ? 'fa-exclamation-triangle'
                                    : 'fa-wand-magic-sparkles'} text-[10px]"
                                ></i>
                                Format
                              </button>
                            {/if}
                          </div>

                          <div
                            class="rounded-lg border transition-all duration-300 shadow-2xl overflow-hidden
                                {activeWidget.config.useVariant
                              ? jsonErrors.variant
                                ? 'border-red-500/50 bg-[#0b0e14] ring-4 ring-red-500/5'
                                : 'border-slate-700/40 bg-[#0b0e14] focus-within:border-orange-500/40 focus-within:ring-4 focus-within:ring-orange-500/5'
                              : 'border-slate-800/30 bg-[#0f172a]/20 opacity-40 grayscale pointer-events-none'}"
                          >
                            <div
                              class="h-8 border-b flex items-center px-4 justify-between transition-colors {activeWidget
                                .config.useVariant
                                ? 'bg-[#161b22] border-slate-800/50'
                                : 'bg-slate-900/50 border-slate-800/50'}"
                            >
                              <div class="flex items-center gap-2">
                                <div class="flex gap-1.5">
                                  <div
                                    class="w-2.5 h-2.5 rounded-full {activeWidget.config.useVariant
                                      ? 'bg-orange-500/50'
                                      : 'bg-slate-700'}"
                                  ></div>
                                  <div class="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                                </div>
                                <div class="h-3 w-px bg-slate-800 mx-1"></div>
                                <span
                                  class="text-[9px] font-mono text-slate-500 uppercase tracking-tighter"
                                  >variant.json</span
                                >
                              </div>
                              <span
                                class="text-[8px] font-mono text-orange-400/50 bg-orange-400/5 px-1.5 py-0.5 rounded border border-orange-500/10 uppercase transition-opacity {activeWidget
                                  .config.useVariant
                                  ? 'opacity-100'
                                  : 'opacity-0'}">JSON Array</span
                              >
                            </div>

                            <textarea
                              bind:value={activeWidget.config.variantJson}
                              onblur={() => {
                                if (activeWidget.config.useVariant) {
                                  const res = formatJsonUtility(activeWidget.config.variantJson)
                                  jsonErrors.variant = res.error
                                }
                              }}
                              spellcheck="false"
                              rows="6"
                              placeholder={activeWidget.config.useVariant
                                ? '[\n  { "id": "V1", "name": "Variant 1" }\n]'
                                : 'Aktifkan toggle untuk mengisi variant'}
                              class="w-full bg-transparent p-5 text-[12px] font-mono outline-none resize-y custom-scrollbar block leading-relaxed placeholder:text-slate-800 selection:bg-orange-500/20 {jsonErrors.variant
                                ? 'text-red-400'
                                : 'text-orange-300'}"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div in:slide={{ duration: 300 }} class="space-y-2.5">
                        <div class="flex items-center justify-between px-1">
                          <div class="flex items-center gap-2">
                            <label
                              for="static-data-array"
                              class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]"
                            >
                              Static Data Array
                            </label>
                            <span
                              class="flex h-1.5 w-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            ></span>
                          </div>

                          <button
                            type="button"
                            onclick={() => {
                              const res = formatJsonUtility(activeWidget.config.staticJson)
                              activeWidget.config.staticJson = res.data
                              jsonErrors.static = res.error
                            }}
                            class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all
                                  {jsonErrors.static
                              ? 'text-red-500 animate-pulse'
                              : 'text-primary hover:text-primary/70'}"
                          >
                            <i
                              class="fas {jsonErrors.static
                                ? 'fa-exclamation-triangle'
                                : 'fa-wand-magic-sparkles'}"
                            ></i>
                            {jsonErrors.static ? 'Invalid JSON' : 'Format JSON'}
                          </button>
                        </div>

                        <div
                          class="group rounded-lg border border-slate-700/40 bg-[#0b0e14] shadow-2xl overflow-hidden transition-all duration-300 focus-within:border-green-500/40 focus-within:ring-4 focus-within:ring-green-500/5"
                        >
                          <div
                            class="h-8 bg-[#161b22] border-b border-slate-800/50 flex items-center justify-between px-4"
                          >
                            <div class="flex items-center gap-2">
                              <div class="flex gap-1.5">
                                <div
                                  class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-red-500/40 transition-colors"
                                ></div>
                                <div
                                  class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-amber-500/40 transition-colors"
                                ></div>
                                <div
                                  class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-emerald-500/40 transition-colors"
                                ></div>
                              </div>
                              <div class="h-3 w-px bg-slate-800 mx-1"></div>
                              <span
                                class="text-[9px] font-mono text-slate-500 uppercase tracking-tighter"
                                >datasource.json</span
                              >
                            </div>
                            <div class="flex items-center gap-2">
                              <span
                                class="text-[8px] font-mono text-green-500/40 bg-green-500/5 px-1.5 py-0.5 rounded border border-green-500/10 uppercase"
                                >JSON</span
                              >
                            </div>
                          </div>

                          <textarea
                            id="static-data-array"
                            bind:value={activeWidget.config.staticJson}
                            spellcheck="false"
                            rows="10"
                            class="w-full bg-transparent text-green-400 p-5 text-[12px] font-mono outline-none resize-y custom-scrollbar block leading-relaxed placeholder:text-slate-800 selection:bg-green-500/20"
                            placeholder={'[\n  { "id": 1, "label": "Data" }\n]'}
                          ></textarea>

                          <div
                            class="bg-[#161b22]/50 border-t border-slate-800/30 px-4 py-2 flex justify-between items-center"
                          >
                            <div class="flex items-center gap-4">
                              <div class="flex items-center gap-1.5">
                                <i class="fas fa-terminal text-[10px] text-slate-600"></i>
                                <span class="text-[9px] font-mono text-slate-500 uppercase"
                                  >UTF-8</span
                                >
                              </div>
                            </div>
                            <div class="flex items-center gap-2">
                              <i class="fas fa-check-double text-[9px] text-emerald-500/40"></i>
                              <span
                                class="text-[8px] font-black text-slate-600 uppercase tracking-widest"
                                >Ready</span
                              >
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}

                    <div class="space-y-2.5 mt-6">
                      <div class="relative py-2 mb-2">
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

                      <div class="flex items-center justify-between px-1">
                        <div class="flex items-center gap-2">
                          <label
                            for="visual-options"
                            class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]"
                          >
                            Visual Options
                          </label>
                          <span
                            class="flex h-1.5 w-1.5 rounded-full bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                          ></span>
                        </div>

                        <button
                          type="button"
                          onclick={() => {
                            const res = formatJsonUtility(activeWidget.config.echartsOptions)
                            activeWidget.config.echartsOptions = res.data
                            jsonErrors.echarts = res.error
                          }}
                          class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all {jsonErrors.echarts
                            ? 'text-red-500 animate-pulse'
                            : 'text-primary hover:text-primary/70 active:scale-95'}"
                        >
                          <i
                            class="fas {jsonErrors.echarts
                              ? 'fa-exclamation-triangle'
                              : 'fa-wand-magic-sparkles'} text-[10px]"
                          ></i>
                          {jsonErrors.echarts ? 'Invalid JSON' : 'Format JSON'}
                        </button>
                      </div>

                      <div
                        class="group rounded-lg border bg-[#0b0e14] shadow-2xl overflow-hidden transition-all duration-300 {jsonErrors.echarts
                          ? 'border-red-500/50 ring-4 ring-red-500/5'
                          : 'border-slate-700/40 focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5'}"
                      >
                        <div
                          class="h-8 bg-[#161b22] border-b border-slate-800/50 flex items-center justify-between px-4"
                        >
                          <div class="flex items-center gap-2">
                            <div class="flex gap-1.5">
                              <div
                                class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-red-500/40 transition-colors"
                              ></div>
                              <div
                                class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-amber-500/40 transition-colors"
                              ></div>
                              <div
                                class="w-2.5 h-2.5 rounded-full bg-slate-700/50 group-hover:bg-emerald-500/40 transition-colors"
                              ></div>
                            </div>
                            <div class="h-3 w-px bg-slate-800 mx-1"></div>
                            <span
                              class="text-[9px] font-mono text-slate-500 uppercase tracking-tighter"
                              >options.json</span
                            >
                          </div>
                          <div class="flex items-center gap-2">
                            <span
                              class="text-[8px] font-mono text-blue-500/40 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10 uppercase"
                              >JSON Object</span
                            >
                          </div>
                        </div>

                        <textarea
                          id="visual-options"
                          bind:value={activeWidget.config.echartsOptions}
                          onblur={() => {
                            const res = formatJsonUtility(activeWidget.config.echartsOptions)
                            jsonErrors.echarts = res.error
                          }}
                          spellcheck="false"
                          rows="10"
                          class="w-full bg-transparent p-5 text-[12px] font-mono outline-none resize-y custom-scrollbar block leading-relaxed placeholder:text-slate-800 selection:bg-blue-500/20 {jsonErrors.echarts
                            ? 'text-red-400'
                            : 'text-blue-300'}"
                          placeholder={'{ "tooltip": {}, "series": [] }'}
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
