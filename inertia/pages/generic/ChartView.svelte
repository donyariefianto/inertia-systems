<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { EncryptionService } from '~/stores/encryption'
  import EChartsRenderer from '~/components/EChartsRenderer.svelte'
  import { DataTransformer } from '~/utils/DataTransformer'
  import { themeState } from '~/stores/theme.svelte'

  let { config } = $props()
  const themeTrigger = $derived(`${themeState.mode}-${themeState.colorTheme}`)
  let fullscreenWidgetId = $state<string | null>(null)
  let dashboardId = $state<string | null>(null)
  let currentDashboard = $state<any>(null)
  let isLoading = $state(true)
  let isError = $state(false)
  let errorMessage = $state('')

  let isSelectorOpen = $state(false)
  let dashboardList = $state<any[]>([])
  let isListLoading = $state(false)
  let searchQuery = $state('')

  let currentPage = $state(1)
  let totalPages = $state(1)

  let dashboardController = $state<AbortController | null>(null)
  let listController = $state<AbortController | null>(null)

  async function fetchDashboardList() {
    if (listController) listController.abort()
    if (typeof AbortController !== 'undefined') {
      listController = new AbortController()
    }
    isListLoading = true
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchQuery || '',
      })

      const signal = listController ? listController.signal : undefined
      const response = await fetch(`/api/collections/dashboard_settings?${params.toString()}`, {
        signal,
      })
      if (!response.ok) throw new Error('Gagal memuat daftar dashboard.')
      const result = await response.json()
      if (result?.ciphertext && result?.nonce) {
        const decryptedRaw = EncryptionService.decrypt(result.nonce, result.ciphertext)
        const parsedData =
          typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
        dashboardList = parsedData.data || []
        totalPages = parsedData.totalPages || 1
      } else {
        dashboardList = result.data || []
        totalPages = result.totalPages || 1
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('[ChartView] Fetch List Error:', err)
      dashboardList = []
    } finally {
      isListLoading = false
    }
  }

  async function fetchDashboard(id: string) {
    if (!id) return

    if (dashboardController) dashboardController.abort()
    if (typeof AbortController !== 'undefined') {
      dashboardController = new AbortController()
    }

    isLoading = true
    isError = false
    errorMessage = ''
    currentDashboard = null

    try {
      const signal = dashboardController ? dashboardController.signal : undefined
      const response = await fetch(`/api/collections/dashboard_settings/${id}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) throw new Error('Dashboard tidak ditemukan di server.')
        throw new Error('Gagal mengambil data dari server.')
      }

      const result = await response.json()

      if (result?.ciphertext && result?.nonce) {
        const decryptedRaw = EncryptionService.decrypt(result.nonce, result.ciphertext)
        const parsedData =
          typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
        currentDashboard = parsedData || null
      } else {
        currentDashboard = result.data || result || null
      }
      if (!currentDashboard) throw new Error('Format data tidak sesuai.')
    } catch (err: any) {
      if (err.name === 'AbortError') return
      isError = true
      errorMessage = err.message || 'Terjadi kesalahan sistem.'
      console.error('[ChartView] Fetch Dashboard Error:', err)
    } finally {
      isLoading = false
    }
  }

  const getWidgetSpan = (width: string) => {
    const map: Record<string, string> = {
      quarter: 'col-span-1',
      half: 'col-span-1 lg:col-span-2',
      full: 'col-span-1 sm:col-span-2 lg:col-span-4',
    }

    return map[width] || 'col-span-1 lg:col-span-2'
  }

  onMount(() => {
    if (typeof window === 'undefined') return

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const idFromUrl = urlParams.get('id')
      const initialId = idFromUrl || config?.dashboardId

      if (initialId && typeof initialId === 'string') {
        dashboardId = initialId
        fetchDashboard(initialId)
      } else {
        isLoading = false
        isError = true
        errorMessage = 'Tidak ada konfigurasi ID Dashboard yang valid.'
      }
    } catch (e) {
      console.error('[ChartView] Error parsing initial URL:', e)
    }

    const handlePopState = () => {
      try {
        const currentParams = new URLSearchParams(window.location.search)
        const currentId = currentParams.get('id')

        if (currentId && currentId !== dashboardId) {
          dashboardId = currentId
          fetchDashboard(currentId)
        }
      } catch (e) {
        console.error('[ChartView] Error parsing popstate URL:', e)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (dashboardController) dashboardController.abort()
      if (listController) listController.abort()
    }
  })

  $effect(() => {
    if (isSelectorOpen) {
      const timer = setTimeout(() => {
        fetchDashboardList()
      }, 300)
      return () => clearTimeout(timer)
    }
  })

  async function handleSelectDashboard(id: string) {
    searchQuery = ''
    currentPage = 1
    isError = false
    errorMessage = ''
    currentDashboard = null

    dashboardId = id

    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('id', id)
        window.history.pushState({ dashboardId: id }, '', url)
      } catch (e) {
        console.warn('[ChartView] Gagal sinkronisasi URL State.', e)
      }
    }

    await fetchDashboard(id)

    isSelectorOpen = false

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        try {
          const scrollContainers = document.querySelectorAll('.custom-scrollbar')
          scrollContainers.forEach((container) => {
            if (container && !container.closest('.z-\\[100\\]')) {
              container.scrollTo({ top: 0, behavior: 'smooth' })
            }
          })
        } catch (e) {
          console.warn('[ChartView] Gagal reset posisi scroll.', e)
        }
      })
    }
  }

  function getWidgetOptions(widget: any, _theme: string) {
    const rawData =
      widget.config?.dataSourceMode === 'static'
        ? widget.config?.staticJson || []
        : widget.dynamicData || []

    const visualConfig = widget.config?.echartsOptions || {}

    return DataTransformer.transform(
      widget.category || null,
      widget.type || null,
      rawData,
      visualConfig
    )
  }

  function handleDownloadImage(id: string) {
    const chartInstance = id
    if (!chartInstance) return
    console.log('download')
  }

  function handleCopyUrl(id: string) {
    const url = `${id}`
    navigator.clipboard.writeText(url)
  }
</script>

<div
  class="flex-1 min-h-0 w-full bg-background border border-border/80 rounded-lg flex flex-col animate-in fade-in duration-500 overflow-hidden shadow-2xl"
>
  <div
    class="flex justify-between gap-3 sm:flex-row sm:items-end p-2 md:p-4 lg:px-8 shrink-0 border-b border-border/40"
  >
    <div class="space-y-1.5 min-w-0">
      {#if isLoading}
        <div class="h-8 w-48 bg-muted/40 animate-pulse rounded-md mb-2"></div>
        <div class="h-4 w-32 bg-muted/30 animate-pulse rounded-md"></div>
      {:else if currentDashboard}
        <h1
          class="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-3 truncate"
        >
          {currentDashboard.name}
        </h1>
        <p class="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-2">
          <i class="fas fa-clock opacity-50"></i>
          Terakhir diperbarui: {currentDashboard.updated_at
            ? new Date(currentDashboard.updated_at).toLocaleString('id-ID')
            : new Date().toLocaleString('id-ID')}
        </p>
      {:else}
        <h1 class="text-xl font-bold text-muted-foreground">Dashboard Tidak Tersedia</h1>
      {/if}
    </div>

    <div class="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
      {#if isLoading}
        <div class="h-9 w-32 bg-muted/40 animate-pulse rounded-lg"></div>
        <div class="h-9 w-9 bg-muted/40 animate-pulse rounded-lg"></div>
      {:else}
        <div class="relative group w-full sm:w-auto">
          <div class="relative">
            <button
              onclick={() => (isSelectorOpen = true)}
              class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
            >
              <i class="fas fa-list-ul"></i>
              <span>Pilih Dashboard</span>
            </button>
          </div>
        </div>

        {#if currentDashboard && dashboardId}
          <div class="relative group w-full sm:w-auto">
            <div class="relative">
              <button
                onclick={() => dashboardId && fetchDashboard(dashboardId)}
                class="w-9 h-9 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm active:scale-95"
                title="Refresh Data"
              >
                <i class="fas fa-sync-alt text-[11px]"></i>
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <div
    class="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 md:px-6 lg:px-8 relative bg-muted/5"
  >
    <div class="max-w-[1600px] mx-auto py-5 pb-5">
      {#if isLoading}
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-[1600px] mx-auto pb-5"
        >
          {#each Array(4) as _}
            <div
              class="bg-card border border-border/50 rounded-xl h-[380px] p-5 flex flex-col gap-4 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-muted/30 animate-pulse"></div>
                <div class="h-4 w-32 bg-muted/30 animate-pulse rounded"></div>
              </div>
              <div class="flex-1 bg-muted/20 animate-pulse rounded-lg mt-2"></div>
            </div>
          {/each}
        </div>
      {:else if isError || !currentDashboard}
        <div class="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
          <div
            class="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-5 border border-border/50"
          >
            <i class="fas fa-search-minus text-3xl text-muted-foreground/50"></i>
          </div>
          <h2 class="text-lg font-bold text-foreground mb-2">Data Tidak Ditemukan</h2>
          <p class="text-xs text-muted-foreground max-w-sm mb-6">
            {errorMessage || 'Data dashboard kosong atau tidak tersedia.'}
          </p>
          <button
            onclick={() => (isSelectorOpen = true)}
            class="px-5 py-2.5 bg-background border border-border text-foreground rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-muted transition-colors shadow-sm active:scale-95"
          >
            Buka Panel Navigasi
          </button>
        </div>
      {:else}
        <div
          class="w-full mx-auto transition-all duration-1000 ease-in-out pb-8
          {fullscreenWidgetId
            ? 'max-w-none px-0 items-stretch'
            : 'max-w-[1600px] px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'}"
        >
          {#each currentDashboard.widgets || [] as widget}
            {#if !fullscreenWidgetId || fullscreenWidgetId === widget.id}
              <div class={getWidgetSpan(widget.config?.width)}>
                <div
                  class="bg-card border border-border rounded-xl h-[380px] p-5 shadow-sm flex flex-col hover:shadow-md transition-all group"
                >
                  <div
                    class="flex items-center justify-between border-b border-border/40 pb-4 mb-4 shrink-0"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <i class="{widget.config?.icon || 'fas fa-chart-bar'} text-xs"></i>
                      </div>
                      <h3 class="font-bold text-sm text-foreground truncate">
                        {widget.title || 'Widget'}
                      </h3>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        onclick={() => handleDownloadImage(widget.id)}
                        title="Download Image"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                      >
                        <i class="fas fa-download text-[10px]"></i>
                      </button>

                      <button
                        onclick={() => handleCopyUrl(widget.id)}
                        title="Copy Link"
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                      >
                        <i class="fas fa-link text-[10px]"></i>
                      </button>

                      <button
                        onclick={() =>
                          (fullscreenWidgetId =
                            fullscreenWidgetId === widget.id ? null : widget.id)}
                        title={fullscreenWidgetId === widget.id ? 'Exit Fullscreen' : 'Fullscreen'}
                        class="w-8 h-8 flex items-center justify-center rounded-lg {fullscreenWidgetId ===
                        widget.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'} transition-all active:scale-95"
                      >
                        <i
                          class="fas {fullscreenWidgetId === widget.id
                            ? 'fa-compress-arrows-alt'
                            : 'fa-expand-alt'} text-[10px]"
                        ></i>
                      </button>
                    </div>
                  </div>

                  <div class="flex-1 min-h-0 relative w-full rounded-lg">
                    {#if widget.type === 'simple_table'}
                      <div
                        class="w-full h-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/5"
                      >
                        <i class="fas fa-table text-2xl text-muted-foreground/30 mb-2"></i>
                        <span
                          class="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest"
                          >Table View Logic</span
                        >
                      </div>
                    {:else if widget.type === 'label'}
                      <div
                        class="w-full h-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/5"
                      >
                        <i class="fas fa-tag text-2xl text-muted-foreground/30 mb-2"></i>
                        <span
                          class="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest"
                          >Label View Logic</span
                        >
                      </div>
                    {:else}
                      <EChartsRenderer options={getWidgetOptions(widget, themeTrigger)} />
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

{#if isSelectorOpen}
  <div class="absolute inset-0 z-[100] flex justify-end overflow-hidden">
    <div
      tabindex="0"
      role="button"
      class="absolute inset-0 bg-background/60 backdrop-blur-sm"
      transition:fade={{ duration: 200 }}
      onclick={() => (isSelectorOpen = false)}
      onkeydown={(e) => e.key === 'Escape' && (isSelectorOpen = false)}
      aria-label="Tutup Overlay"
    ></div>

    <div
      class="relative w-full sm:w-[400px] h-full bg-card border-l border-border shadow-2xl flex flex-col"
      transition:fly={{ x: '100%', duration: 300, easing: expoOut, opacity: 1 }}
    >
      <div class="shrink-0 p-5 border-b border-border/50 bg-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xs font-black tracking-widest uppercase text-foreground">
            Navigasi Dashboard
          </h2>
          <button
            aria-label="Tutup Navigasi"
            onclick={() => (isSelectorOpen = false)}
            class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="relative">
          <i
            class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[11px]"
          ></i>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari dashboard..."
            class="w-full bg-muted/20 border border-border/80 rounded-lg py-2.5 pl-9 pr-4 text-xs font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 bg-muted/5">
        {#if isListLoading}
          <div class="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <div
              class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin"
            ></div>
            <span class="text-[10px] font-bold tracking-widest uppercase text-primary"
              >Memuat...</span
            >
          </div>
        {:else if dashboardList.length === 0}
          <div
            class="flex flex-col items-center justify-center h-full text-muted-foreground/60 gap-3"
          >
            <i class="fas fa-folder-open text-2xl"></i>
            <p class="text-[11px] font-medium">Dashboard tidak ditemukan</p>
          </div>
        {:else}
          <div class="flex flex-col gap-1.5">
            {#each dashboardList as item}
              <button
                onclick={() => handleSelectDashboard(item._id || item.id)}
                class="flex items-center justify-between p-3.5 rounded-xl hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all group text-left w-full {(item._id ||
                  item.id) === dashboardId
                  ? 'bg-background border-border shadow-sm ring-1 ring-primary/20'
                  : ''}"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center border border-border/50 transition-colors shrink-0 mt-0.5 {(item._id ||
                      item.id) === dashboardId
                      ? 'text-primary bg-primary/10'
                      : ''}"
                  >
                    <i class="fas fa-chart-line text-[11px]"></i>
                  </div>
                  <div class="min-w-0 pr-2">
                    <h4
                      class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate"
                    >
                      {item.name}
                    </h4>
                    <p class="text-[10px] text-muted-foreground mt-1 font-mono opacity-60 truncate">
                      ID: {item._id || item.id}
                    </p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span
                    class="inline-block px-2 py-0.5 bg-muted rounded border border-border/50 text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    {item.widgets.length || 0} Widget
                  </span>
                  {#if item.updatedAt}
                    <p class="text-[9px] text-muted-foreground/60 mt-1.5">{item.updatedAt}</p>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="shrink-0 p-4 border-t border-border/50 bg-card flex items-center justify-between">
        <button
          disabled={currentPage <= 1 || isListLoading}
          onclick={() => {
            if (currentPage > 1) currentPage--
          }}
          class="px-3 py-1.5 text-[11px] font-bold rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1.5"
        >
          <i class="fas fa-chevron-left text-[9px]"></i> Prev
        </button>
        <span class="text-[11px] font-medium text-muted-foreground">
          Hal <strong class="text-foreground">{currentPage}</strong> / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages || isListLoading}
          onclick={() => {
            if (currentPage < totalPages) currentPage++
          }}
          class="px-3 py-1.5 text-[11px] font-bold rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1.5"
        >
          Next <i class="fas fa-chevron-right text-[9px]"></i>
        </button>
      </div>
    </div>
  </div>
{/if}
