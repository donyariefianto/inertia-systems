<script lang="ts">
  import { onMount } from 'svelte'
  import { fade, slide, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  let { config, title } = $props()

  // --- STATE DASHBOARD UTAMA ---
  let dashboardId = $state(config?.dashboardId || '69aee47dc968bee804acb6fd')
  let currentDashboard = $state<any>(null)
  let isLoading = $state(true)
  let isError = $state(false)
  let errorMessage = $state('')

  // --- STATE DRAWER SELECTOR ---
  let isSelectorOpen = $state(false)
  let dashboardList = $state<any[]>([])
  let isListLoading = $state(false)
  let searchQuery = $state('')

  let currentPage = $state(1)
  let totalPages = $state(3)

  // --- DUMMY FETCHERS ---
  async function fetchDashboard(id: string) {
    isLoading = true
    isError = false
    currentDashboard = null

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      if (id === 'error-id' || !id) throw new Error('Dashboard tidak ditemukan.')

      currentDashboard = {
        _id: { $oid: id },
        name: title || 'Produksi Pabrik A',
        widgets: [
          {
            id: 'w-1',
            title: 'Smoothed Line',
            type: 'line_smooth',
            config: { width: 'half', icon: 'fas fa-chart-line' },
          },
          {
            id: 'w-2',
            title: 'Bar Race',
            type: 'bar_race',
            config: { width: 'half', icon: 'fas fa-chart-bar' },
          },
          {
            id: 'w-3',
            title: 'Overview',
            type: 'pie',
            config: { width: 'full', icon: 'fas fa-chart-pie' },
          },
          {
            id: 'w-4',
            title: 'Metrik Tambahan',
            type: 'bar',
            config: { width: 'full', icon: 'fas fa-chart-area' },
          },
        ],
        updated_at: { $date: new Date().toISOString() },
      }
    } catch (err: any) {
      isError = true
      errorMessage = err.message
    } finally {
      isLoading = false
    }
  }

  async function fetchDashboardList() {
    isListLoading = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      dashboardList = Array.from({ length: 6 }).map((_, i) => ({
        id: `id-dummy-${currentPage}-${i}`,
        name: `Dashboard ${searchQuery ? `Hasil: ${searchQuery}` : `Analitik ${i + 1}`}`,
        widgetCount: Math.floor(Math.random() * 10) + 2,
        updatedAt: new Date().toLocaleDateString('id-ID'),
      }))
    } catch (error) {
      console.error('Gagal memuat list', error)
    } finally {
      isListLoading = false
    }
  }

  $effect(() => {
    fetchDashboard(dashboardId)
  })

  $effect(() => {
    if (isSelectorOpen) {
      const timer = setTimeout(() => fetchDashboardList(), 300)
      return () => clearTimeout(timer)
    }
  })

  function handleSelectDashboard(id: string) {
    dashboardId = id
    isSelectorOpen = false
    searchQuery = ''
    currentPage = 1
  }
</script>

<div
  class="absolute inset-0 z-40 flex h-full w-full flex-col bg-background overflow-hidden animate-in fade-in duration-300"
>
  <header
    class="shrink-0 px-5 py-4 sm:px-8 sm:py-5 border-b border-border/60 bg-card z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
  >
    <div>
      {#if isLoading}
        <div class="h-7 w-48 bg-muted/40 animate-pulse rounded-md mb-2"></div>
        <div class="h-3 w-32 bg-muted/30 animate-pulse rounded-md"></div>
      {:else if currentDashboard}
        <h1
          class="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-3"
        >
          {currentDashboard.name}
        </h1>
        <p class="text-[11px] font-medium text-muted-foreground mt-1 flex items-center gap-2">
          <i class="fas fa-clock opacity-50"></i>
          Terakhir diperbarui: {new Date(currentDashboard.updated_at.$date).toLocaleString('id-ID')}
        </p>
      {:else}
        <h1 class="text-xl font-bold text-muted-foreground">Dashboard Tidak Tersedia</h1>
      {/if}
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <button
        onclick={() => (isSelectorOpen = true)}
        class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
      >
        <i class="fas fa-list-ul"></i>
        <span>Pilih Dashboard</span>
      </button>

      {#if currentDashboard && !isLoading}
        <button
          onclick={() => fetchDashboard(dashboardId)}
          class="w-9 h-9 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm active:scale-95"
          title="Refresh Data"
        >
          <i class="fas fa-sync-alt text-[11px]"></i>
        </button>
      {/if}
    </div>
  </header>

  <main class="flex-1 overflow-y-auto custom-scrollbar bg-muted/10 p-5 sm:p-8">
    <div class="max-w-[1600px] mx-auto pb-10">
      {#if isLoading}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
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
        <div
          class="flex flex-col items-center justify-center text-center p-10 bg-card border border-dashed border-border/60 rounded-2xl h-[60vh] max-h-[500px]"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-5 border border-border/50"
          >
            <i class="fas fa-search-minus text-3xl text-muted-foreground/50"></i>
          </div>
          <h2 class="text-lg font-bold text-foreground mb-2">Data Tidak Ditemukan</h2>
          <p class="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            {errorMessage || 'Kami tidak dapat menemukan data untuk dashboard ini.'}
          </p>
          <button
            onclick={() => (isSelectorOpen = true)}
            class="px-5 py-2.5 bg-background border border-border text-foreground rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-muted transition-colors shadow-sm"
          >
            Buka Panel Navigasi
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {#each currentDashboard.widgets as widget}
            <div class={widget.config.width === 'full' ? 'md:col-span-2' : 'col-span-1'}>
              <div
                class="bg-card border border-border rounded-xl h-[380px] p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300"
              >
                <div class="flex items-center gap-3 border-b border-border/40 pb-4 mb-4">
                  <div
                    class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"
                  >
                    <i class="{widget.config.icon} text-[13px]"></i>
                  </div>
                  <h3 class="font-bold text-sm text-foreground truncate">{widget.title}</h3>
                </div>
                <div
                  class="flex-1 flex flex-col items-center justify-center bg-muted/5 rounded-lg border border-dashed border-border/50"
                >
                  <i class="fas fa-chart-network text-2xl text-muted-foreground/30 mb-2"></i>
                  <span
                    class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50"
                    >ECharts Render Area</span
                  >
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  {#if isSelectorOpen}
    <div class="absolute inset-0 z-[100] flex justify-end overflow-hidden">
      <div
        class="absolute inset-0 bg-background/60 backdrop-blur-sm"
        transition:fade={{ duration: 200 }}
        onclick={() => (isSelectorOpen = false)}
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
                  onclick={() => handleSelectDashboard(item.id)}
                  class="flex items-center justify-between p-3.5 rounded-xl hover:bg-background border border-transparent hover:border-border hover:shadow-sm transition-all group text-left w-full"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center border border-border/50 transition-colors shrink-0 mt-0.5"
                    >
                      <i class="fas fa-chart-line text-[11px]"></i>
                    </div>
                    <div class="min-w-0 pr-2">
                      <h4
                        class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate"
                      >
                        {item.name}
                      </h4>
                      <p
                        class="text-[10px] text-muted-foreground mt-1 font-mono opacity-60 truncate"
                      >
                        ID: {item.id}
                      </p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span
                      class="inline-block px-2 py-0.5 bg-muted rounded border border-border/50 text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
                      >{item.widgetCount} Widget</span
                    >
                    <p class="text-[9px] text-muted-foreground/60 mt-1.5">{item.updatedAt}</p>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div
          class="shrink-0 p-4 border-t border-border/50 bg-card flex items-center justify-between"
        >
          <button
            disabled={currentPage === 1 || isListLoading}
            onclick={() => currentPage--}
            class="px-3 py-1.5 text-[11px] font-bold rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1.5"
          >
            <i class="fas fa-chevron-left text-[9px]"></i> Prev
          </button>
          <span class="text-[11px] font-medium text-muted-foreground"
            >Hal <strong class="text-foreground">{currentPage}</strong> / {totalPages}</span
          >
          <button
            disabled={currentPage === totalPages || isListLoading}
            onclick={() => currentPage++}
            class="px-3 py-1.5 text-[11px] font-bold rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1.5"
          >
            Next <i class="fas fa-chevron-right text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
