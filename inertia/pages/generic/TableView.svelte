<script lang="ts">
  import { slide, fade, fly } from 'svelte/transition'
  import type { MenuConfig, FieldConfig } from '~/types/menu'
  import { EncryptionService } from '~/stores/encryption'
  import { getCsrfToken } from '~/utils/getCrsfToken'
  let { config = {} as MenuConfig, title = 'Data Master' } = $props<{
    config: MenuConfig
    title?: string
  }>()

  let searchTimeout: any
  let searchQuery = $state('')
  let isLoading = $state(false)
  let dataList = $state<Record<string, any>[]>([])
  let isEditMode = $state(false)
  let selectedId = $state<string | number | null>(null)
  let currentPage = $state(1)
  let totalItems = $state(0)
  const itemsPerPage = 10

  let isColumnManagerOpen = $state(false)

  let isAddFormOpen = $state(false)
  let formData = $state<Record<string, any>>({})
  let lastPage = $state(1)
  let isSaving = $state(false)
  let visiblePasswordFields = $state<Record<string, boolean>>({})
  const allFields = $derived<FieldConfig[]>(config.fields || [])

  let activeColumnNames = $state<string[]>([])

  $effect(() => {
    if (config.fields) {
      activeColumnNames = config.fields
        .filter((f: FieldConfig) => f.show_up !== false)
        .map((f: FieldConfig) => f.name)
    }
  })

  $effect(() => {
    if (searchQuery !== undefined || currentPage) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        fetchData()
      }, 500)
    }
  })

  const visibleFields = $derived(
    allFields.filter((f: FieldConfig) => activeColumnNames.includes(f.name))
  )

  function formatValue(value: any, field: FieldConfig) {
    // 1. Guarding: Jika data kosong, tampilkan placeholder profesional
    if (value === null || value === undefined || value === '') return '-'

    const type = field.type
    // Ambil locale dari config, fallback ke id-ID jika belum diatur
    const locale = field.locale || 'id-ID'
    // Ambil format, atau tentukan default berdasarkan tipe
    const format = field.format || (type === 'currency' ? 'IDR' : 'decimal')
    const precision = field.precision ?? 0

    try {
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: format, // 'IDR', 'USD', dll
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(value)

        case 'number':
          // Jika format adalah persentase
          if (format === 'percent') {
            return new Intl.NumberFormat(locale, {
              style: 'percent',
              minimumFractionDigits: precision,
            }).format(value / 100) // Asumsi 100 diinput sebagai 100%
          }

          // Jika format ringkas (1.2M, 10K)
          if (format === 'compact') {
            return new Intl.NumberFormat(locale, {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }

          // Standar Desimal
          return new Intl.NumberFormat(locale, {
            style: 'decimal',
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(value)

        case 'boolean':
          return value ? 'Ya' : 'Tidak'

        case 'datetime':
          return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(value))

        default:
          return String(value)
      }
    } catch (e) {
      // Fallback jika ada error formatting (misal locale tidak valid)
      return String(value)
    }
  }

  function toggleColumn(name: string) {
    if (activeColumnNames.includes(name)) {
      if (activeColumnNames.length > 1) {
        activeColumnNames = activeColumnNames.filter((n) => n !== name)
      }
    } else {
      activeColumnNames = [...activeColumnNames, name]
    }
  }

  function openAddForm() {
    formData = {}
    isAddFormOpen = true
  }

  async function handleSaveData() {
    if (!config.endpoint) return
    const missingFields = config.fields?.filter((f: FieldConfig) => f.required && !formData[f.name])
    if (missingFields?.length) {
      alert(`Mohon isi: ${missingFields.map((f: FieldConfig) => f.label).join(', ')}`)
      return
    }

    isSaving = true
    try {
      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode
        ? `/api/collections/${config.endpoint}/${selectedId}`
        : `/api/collections/${config.endpoint}`

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Gagal menyimpan data')

      isAddFormOpen = false
      formData = {}
      fetchData()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      isSaving = false
    }
  }

  async function handleDelete(id: string | number) {
    if (
      !confirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.')
    )
      return

    isLoading = true
    try {
      const response = await fetch(`/api/collections/${config.endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
      })

      if (!response.ok) throw new Error('Gagal menghapus data.')

      await fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      isLoading = false
    }
  }

  async function fetchData() {
    if (!config.endpoint) return
    isLoading = true

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        search: searchQuery,
      })
      const response = await fetch(`/api/collections/${config.endpoint}?${params.toString()}`)
      if (!response.ok) throw new Error('Network response was not ok')

      const result = await response.json()
      if (result?.ciphertext && result?.nonce) {
        const decryptedRaw = EncryptionService.decrypt(result.nonce, result.ciphertext)
        const parsedData =
          typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
        dataList = parsedData.data || []
        totalItems = parsedData.total || 0
        lastPage = parsedData.totalPages || 1
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      isLoading = false
    }
  }

  function openEditForm(item: any) {
    formData = { ...item }
    selectedId = item.id || item._id
    isEditMode = true
    isAddFormOpen = true
  }

  // Fungsi untuk memetakan lebar ke sistem grid 12 kolom
  const getGridWidth = (width: string | number | undefined): string => {
    const w = String(width)
    switch (w) {
      case '33':
        return 'md:col-span-3' // 1/4 baris
      case '50':
        return 'md:col-span-4' // 1/3 baris
      case '66':
        return 'md:col-span-6' // 1/2 baris
      case '100':
      default:
        return 'md:col-span-12' // baris penuh
    }
  }

  function toggleVisibility(fieldName: string) {
    visiblePasswordFields[fieldName] = !visiblePasswordFields[fieldName]
  }
</script>

<div
  class="absolute inset-0 flex flex-col bg-background animate-in fade-in duration-500 overflow-hidden"
>
  <div
    class="flex flex-col gap-5 sm:flex-row sm:items-end justify-between p-4 md:p-6 lg:px-8 shrink-0"
  >
    <div class="space-y-1.5 min-w-0">
      <h1
        class="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-3 truncate"
      >
        {title}
      </h1>
      <p class="text-xs md:text-sm text-muted-foreground max-w-lg leading-relaxed truncate">
        Kelola basis data <span class="font-bold text-foreground/70 uppercase tracking-wider"
          >{config?.collectionName || 'Koleksi'}</span
        >
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 md:gap-3">
      <div class="relative group w-full sm:w-auto">
        <i
          class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground group-focus-within:text-primary transition-colors"
        ></i>
        <input
          type="text"
          bind:value={searchQuery}
          oninput={() => (currentPage = 1)}
          placeholder="Cari referensi..."
          class="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-card border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-sm"
        />
      </div>

      <div class="relative">
        <button
          onclick={() => (isColumnManagerOpen = !isColumnManagerOpen)}
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-xs font-bold text-foreground shadow-sm transition-all hover:bg-muted touch-manipulation active:scale-95"
        >
          <i class="fas fa-columns text-muted-foreground"></i>
          <span class="hidden md:inline">Kolom</span>
        </button>

        {#if isColumnManagerOpen}
          <div
            class="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
            transition:slide={{ duration: 200 }}
          >
            <div class="px-4 py-3 border-b border-border/50 bg-muted/30">
              <h4 class="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Tampilan Kolom
              </h4>
            </div>
            <div class="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
              {#each allFields as field}
                <label
                  class="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div class="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={activeColumnNames.includes(field.name)}
                      onchange={() => toggleColumn(field.name)}
                      class="w-4 h-4 rounded-md border-border text-primary focus:ring-primary/30 appearance-none bg-background checked:bg-primary transition-all cursor-pointer shadow-sm"
                    />
                    <i
                      class="fas fa-check absolute text-[9px] text-primary-foreground opacity-0 group-has-[:checked]:opacity-100 pointer-events-none transition-opacity"
                    ></i>
                  </div>
                  <span class="text-xs font-semibold text-foreground truncate select-none"
                    >{field.label}</span
                  >
                </label>
              {/each}
            </div>
          </div>
          <div
            role="button"
            tabindex="0"
            class="fixed inset-0 z-40"
            onkeydown={() => (isColumnManagerOpen = false)}
            onclick={() => (isColumnManagerOpen = false)}
          ></div>
        {/if}
      </div>

      <button
        class="hidden md:inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
      >
        <i class="fas fa-file-export opacity-70"></i> Ekspor
      </button>

      {#if config?.operations?.create !== false}
        <button
          onclick={openAddForm}
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 touch-manipulation"
        >
          <i class="fas fa-plus"></i> Tambah
        </button>
      {/if}
    </div>
  </div>

  <div class="flex-1 min-h-0 flex flex-col px-4 md:px-6 lg:px-8 pb-4 relative z-0">
    <div
      class="flex-1 bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden flex flex-col relative"
    >
      {#if isLoading}
        <div
          class="absolute inset-0 z-20 bg-background/40 backdrop-blur-sm flex items-center justify-center"
          in:fade
        >
          <div
            class="bg-card px-6 py-4 rounded-2xl shadow-xl border border-border/50 flex items-center gap-4"
          >
            <i class="fas fa-circle-notch fa-spin text-primary text-2xl"></i>
            <div>
              <p class="text-sm font-black text-foreground">Menyinkronkan...</p>
              <p
                class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5"
              >
                Menarik Data Server
              </p>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex-1 overflow-auto custom-scrollbar relative">
        {#if !config.endpoint}
          <div
            class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-60"
          >
            <div
              class="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-5 border border-border shadow-inner"
            >
              <i class="fas fa-link text-3xl text-muted-foreground/50"></i>
            </div>
            <h3 class="text-base font-black text-foreground">Endpoint Terputus</h3>
            <p class="text-xs font-medium text-muted-foreground mt-2 max-w-sm">
              Tautkan tabel ini ke endpoint API melalui Schema Builder.
            </p>
          </div>
        {:else if dataList.length === 0 && !isLoading}
          <div
            class="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            in:fade
          >
            <div
              class="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-5 border border-border shadow-inner"
            >
              <i class="fas fa-inbox text-3xl text-muted-foreground/50"></i>
            </div>
            <h3 class="text-base font-black text-foreground">Koleksi Kosong</h3>
            <p class="text-xs font-medium text-muted-foreground mt-2 max-w-sm">
              Tidak ada entri data yang ditemukan.
            </p>
          </div>
        {:else}
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead class="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th
                  class="px-5 py-4 border-b border-border/80 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12 text-center"
                  >No</th
                >
                {#each visibleFields as field}
                  <th
                    class="px-5 py-4 border-b border-border/80 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                  >
                    {field.label}
                  </th>
                {/each}
                <th
                  class="px-5 py-4 border-b border-border/80 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right sticky right-0 bg-muted/90 backdrop-blur-md w-28 border-l border-border/50"
                  >Aksi</th
                >
              </tr>
            </thead>

            <tbody class="divide-y divide-border/60">
              {#each dataList as row, idx (row.id || idx)}
                <tr class="hover:bg-muted/10 transition-colors group">
                  <td class="px-5 py-4 text-[11px] font-bold text-muted-foreground/60 text-center">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>

                  {#each visibleFields as field}
                    <td class="px-5 py-4 text-xs text-foreground whitespace-nowrap">
                      {#if field.type === 'boolean'}
                        <span
                          class="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest {row[
                            field.name
                          ]
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'}"
                        >
                          {formatValue(row[field.name], field)}
                        </span>
                      {:else if field.type === 'select'}
                        <span
                          class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-muted/50 border border-border/80 text-foreground"
                        >
                          {formatValue(row[field.name], field)}
                        </span>
                      {:else}
                        <span
                          class={field.type === 'number' || field.type === 'currency'
                            ? 'font-mono font-semibold tracking-tight'
                            : 'font-medium'}
                        >
                          {formatValue(row[field.name], field)}
                        </span>
                      {/if}
                    </td>
                  {/each}

                  <td
                    class="px-5 py-3 text-right sticky right-0 bg-card group-hover:bg-muted/5 transition-colors border-l border-border/50"
                  >
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        class="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-all touch-manipulation"
                        title="Edit Data"
                        onclick={() => openEditForm(row)}
                      >
                        <i class="fas fa-pen text-[10px]"></i>
                      </button>
                      <button
                        onclick={() => handleDelete(row.id || row._id)}
                        class="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-all touch-manipulation"
                        title="Hapus Data"
                      >
                        <i class="fas fa-trash-alt text-[10px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <div
        class="shrink-0 border-t border-border/80 bg-muted/20 px-5 md:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 z-10"
      >
        <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Menampilkan <span class="text-foreground"
            >{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span
          >
          - <span class="text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
          dari <span class="text-primary">{totalItems}</span>
        </span>

        <div class="flex gap-1.5">
          <button
            aria-label="prev"
            disabled={currentPage === 1 || isLoading}
            onclick={() => currentPage--}
            class="w-9 h-9 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-card transition-all shadow-sm active:scale-95 touch-manipulation"
          >
            <i class="fas fa-chevron-left text-[10px]"></i>
          </button>

          <div
            class="flex items-center justify-center min-w-[36px] px-2 text-xs font-black text-foreground bg-card border border-border/80 rounded-xl shadow-sm"
          >
            {currentPage}
          </div>

          <button
            aria-label="next"
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || isLoading}
            onclick={() => currentPage++}
            class="w-9 h-9 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-card transition-all shadow-sm active:scale-95 touch-manipulation"
          >
            <i class="fas fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  {#if isAddFormOpen}
    <div class="absolute inset-0 z-50 flex justify-end overflow-hidden">
      <div
        role="button"
        tabindex="0"
        class="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        in:fade={{ duration: 300 }}
        out:fade={{ duration: 200 }}
        onclick={() => (isAddFormOpen = false)}
        onkeydown={() => (isAddFormOpen = false)}
      ></div>

      <div
        class="relative h-full w-full sm:w-[420px] md:w-[500px] bg-card border-l border-border/80 shadow-2xl flex flex-col"
        in:fly={{ x: 500, duration: 300, opacity: 1 }}
        out:fly={{ x: 500, duration: 250, opacity: 1 }}
      >
        <div
          class="px-6 py-5 border-b border-border/50 bg-muted/10 shrink-0 flex items-center justify-between"
        >
          <div>
            <h3 class="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
              <i class="fas fa-file-medical text-primary"></i> Data Baru
            </h3>
            <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
              Koleksi: {config?.collectionName}
            </p>
          </div>
          <button
            aria-label="FormClose"
            onclick={() => (isAddFormOpen = false)}
            class="w-8 h-8 rounded-full bg-background border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90 touch-manipulation shadow-sm"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {#each config.fields || [] as field}
            {#if field.name !== 'id'}
              <div
                class="space-y-2 group animate-in fade-in slide-in-from-right-4 duration-300 {getGridWidth(
                  field.width
                )}"
              >
                <label
                  for="field-{field.name}"
                  class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between group-focus-within:text-primary transition-colors cursor-pointer"
                >
                  <span>
                    {field.label}
                    {#if field.required}<span class="text-destructive ml-1">*</span>{/if}
                  </span>

                  {#if field.type === 'currency' || field.type === 'number'}
                    <div class="flex gap-1.5">
                      {#if field.locale}
                        <span
                          class="text-[8px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase"
                        >
                          {field.locale}
                        </span>
                      {/if}
                      <span
                        class="text-[8px] bg-primary/10 px-1.5 py-0.5 rounded text-primary font-bold uppercase"
                      >
                        {field.format || (field.type === 'currency' ? 'IDR' : 'DEC')}
                      </span>
                    </div>
                  {/if}
                </label>

                {#if field.type === 'textarea'}
                  <textarea
                    id="field-{field.name}"
                    bind:value={formData[field.name]}
                    placeholder="Masukkan {field.label.toLowerCase()}..."
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner min-h-[120px] custom-scrollbar resize-none"
                  ></textarea>
                {:else if field.type === 'boolean'}
                  <label
                    class="flex items-center justify-between p-3.5 border border-border/80 rounded-xl bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                  >
                    <span class="text-xs font-bold text-foreground/80">Aktifkan {field.label}</span>
                    <div class="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        bind:checked={formData[field.name]}
                        class="sr-only peer"
                      />
                      <div
                        class="w-9 h-5 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"
                      ></div>
                    </div>
                  </label>
                {:else if field.type === 'select'}
                  <div class="relative">
                    <select
                      id="field-{field.name}"
                      bind:value={formData[field.name]}
                      class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner cursor-pointer appearance-none"
                    >
                      <option value="" disabled selected>Pilih {field.label}...</option>
                      {#each field.options || [] as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                    <div
                      class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50"
                    >
                      <i class="fas fa-chevron-down text-[10px]"></i>
                    </div>
                  </div>
                {:else if field.type === 'relation'}
                  <div class="relative">
                    <input
                      id="field-{field.name}"
                      type="text"
                      readonly
                      placeholder="Cari {field.label}..."
                      class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all shadow-inner cursor-pointer"
                      onclick={() => alert(`Buka Lookup untuk: ${field.relation_collection}`)}
                    />
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                      <i class="fas fa-search text-[10px]"></i>
                    </div>
                  </div>
                {:else if field.type === 'repeater'}
                  <div class="p-1 rounded-2xl bg-gradient-to-b from-border/50 to-transparent">
                    <div
                      class="p-4 md:p-5 border border-border/80 rounded-[15px] bg-card/50 backdrop-blur-sm space-y-4"
                    >
                      <div class="flex items-center justify-between border-b border-border/60 pb-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner"
                          >
                            <i class="fas fa-layer-group text-[11px]"></i>
                          </div>
                          <div>
                            <span
                              class="text-[11px] font-black text-foreground uppercase tracking-widest block"
                            >
                              {field.label}
                            </span>
                            <span
                              class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 block"
                            >
                              Total: {formData[field.name]?.length || 0} Baris
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onclick={() => {
                            if (!formData[field.name]) formData[field.name] = []
                            formData[field.name] = [...formData[field.name], {}]
                          }}
                          class="text-[10px] font-bold bg-primary text-primary-foreground px-3.5 py-2 rounded-xl hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <i class="fas fa-plus"></i>
                          <span class="hidden sm:inline">Tambah Baris</span>
                        </button>
                      </div>

                      {#if !formData[field.name] || formData[field.name].length === 0}
                        <div
                          class="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/10"
                        >
                          <div
                            class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3"
                          >
                            <i class="fas fa-stream text-muted-foreground/50 text-lg"></i>
                          </div>
                          <p class="text-[11px] font-bold text-foreground">Belum ada baris data</p>
                          <p class="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                            Klik tombol tambah di atas untuk menyisipkan data baru.
                          </p>
                        </div>
                      {:else}
                        <div class="space-y-4">
                          {#each formData[field.name] as row, rowIndex}
                            <div
                              class="relative p-4 md:p-5 bg-background border border-border/80 rounded-xl shadow-sm hover:shadow-md hover:border-border transition-all group/row"
                              transition:slide={{ duration: 250 }}
                            >
                              <div
                                class="flex items-center justify-between mb-4 pb-3 border-b border-border/40"
                              >
                                <span
                                  class="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-2"
                                >
                                  <i class="fas fa-hashtag text-[8px]"></i> Baris {rowIndex + 1}
                                </span>
                                <button
                                  aria-label="Hapus Baris"
                                  type="button"
                                  onclick={() => {
                                    formData[field.name] = formData[field.name].filter(
                                      (_: any, i: number) => i !== rowIndex
                                    )
                                  }}
                                  class="text-destructive/70 hover:text-destructive hover:bg-destructive/10 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                                >
                                  <i class="fas fa-trash-alt text-[10px]"></i>
                                </button>
                              </div>

                              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                {#each field.sub_fields || [] as sf}
                                  <div class="space-y-1.5 {getGridWidth(sf.width)}">
                                    <label
                                      for="field-{field.name}-{rowIndex}-{sf.name}"
                                      class="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider flex items-center justify-between cursor-pointer"
                                    >
                                      <span
                                        >{sf.label}
                                        {#if sf.required}<span class="text-destructive">*</span
                                          >{/if}</span
                                      >

                                      {#if sf.type === 'currency' || sf.type === 'number'}
                                        <div class="flex gap-1">
                                          {#if sf.locale}
                                            <span
                                              class="text-[7px] bg-muted px-1 py-0.5 rounded text-muted-foreground font-black uppercase"
                                              >{sf.locale}</span
                                            >
                                          {/if}
                                          <span
                                            class="text-[7px] bg-primary/10 px-1 py-0.5 rounded text-primary font-black uppercase"
                                          >
                                            {sf.format || (sf.type === 'currency' ? 'IDR' : 'DEC')}
                                          </span>
                                        </div>
                                      {/if}
                                    </label>

                                    {#if sf.type === 'textarea'}
                                      <textarea
                                        id="field-{field.name}-{rowIndex}-{sf.name}"
                                        bind:value={row[sf.name]}
                                        placeholder="Detail {sf.label.toLowerCase()}..."
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary focus:bg-background outline-none transition-all resize-none min-h-[80px] custom-scrollbar"
                                      ></textarea>
                                    {:else if sf.type === 'boolean'}
                                      <label
                                        class="flex items-center justify-between px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg cursor-pointer hover:bg-muted/20 transition-colors"
                                      >
                                        <span class="text-[10px] font-bold text-foreground/80"
                                          >Aktifkan</span
                                        >
                                        <div class="relative inline-flex items-center">
                                          <input
                                            type="checkbox"
                                            bind:checked={row[sf.name]}
                                            class="sr-only peer"
                                          />
                                          <div
                                            class="w-7 h-4 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"
                                          ></div>
                                        </div>
                                      </label>
                                    {:else if sf.type === 'select'}
                                      <div class="relative">
                                        <select
                                          id="field-{field.name}-{rowIndex}-{sf.name}"
                                          bind:value={row[sf.name]}
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-bold focus:border-primary focus:bg-background outline-none transition-all appearance-none cursor-pointer"
                                        >
                                          <option value="" disabled selected>Pilih...</option>
                                          {#each sf.options || [] as opt}
                                            <option value={opt.value}>{opt.label}</option>
                                          {/each}
                                        </select>
                                        <i
                                          class="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/50 pointer-events-none"
                                        ></i>
                                      </div>
                                    {:else if sf.type === 'relation'}
                                      <div class="relative">
                                        <input
                                          id="field-{field.name}-{rowIndex}-{sf.name}"
                                          type="text"
                                          readonly
                                          placeholder="Cari..."
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-bold focus:border-primary focus:bg-background outline-none transition-all cursor-pointer"
                                          onclick={() => alert(`Lookup: ${sf.relation_collection}`)}
                                        />
                                        <i
                                          class="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-primary"
                                        ></i>
                                      </div>
                                    {:else if sf.type === 'number' || sf.type === 'currency'}
                                      <input
                                        id="field-{field.name}-{rowIndex}-{sf.name}"
                                        type="number"
                                        bind:value={row[sf.name]}
                                        placeholder="0"
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-mono font-bold focus:border-primary focus:bg-background outline-none transition-all"
                                      />
                                    {:else}
                                      <input
                                        id="field-{field.name}-{rowIndex}-{sf.name}"
                                        type={sf.type === 'datetime' ? 'datetime-local' : 'text'}
                                        bind:value={row[sf.name]}
                                        placeholder="Masukkan {sf.label.toLowerCase()}..."
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary focus:bg-background outline-none transition-all"
                                      />
                                    {/if}
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                {:else if field.type === 'number' || field.type === 'currency'}
                  <input
                    id="field-{field.name}"
                    type="number"
                    bind:value={formData[field.name]}
                    placeholder="0"
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-mono font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  />
                {:else if field.type === 'password'}
                  <div class="relative">
                    <input
                      id="field-{field.name}"
                      type={visiblePasswordFields[field.name] ? 'text' : 'password'}
                      bind:value={formData[field.name]}
                      placeholder="Masukkan {field.label.toLowerCase()}..."
                      class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                    />
                    <button
                      aria-label="eyes"
                      type="button"
                      onclick={() => toggleVisibility(field.name)}
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                      tabindex="-1"
                    >
                      <i
                        class="fas {visiblePasswordFields[field.name]
                          ? 'fa-eye-slash'
                          : 'fa-eye'} text-xs"
                      ></i>
                    </button>
                  </div>
                {:else if field.type === 'email'}
                  <input
                    id="field-{field.name}"
                    type="email"
                    bind:value={formData[field.name]}
                    placeholder="Masukkan {field.label.toLowerCase()}..."
                    inputmode="email"
                    autocomplete="email"
                    spellcheck="false"
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                  />
                {:else}
                  <input
                    id="field-{field.name}"
                    type={field.type === 'datetime' ? 'datetime-local' : 'text'}
                    bind:value={formData[field.name]}
                    placeholder="Masukkan {field.label.toLowerCase()}..."
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                  />
                {/if}
              </div>
            {/if}
          {/each}
        </div>

        <div
          class="px-6 py-4 border-t border-border/50 bg-background shrink-0 flex items-center justify-end gap-3"
        >
          <button
            onclick={() => (isAddFormOpen = false)}
            class="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors active:scale-95 touch-manipulation"
          >
            Batal
          </button>
          <button
            onclick={handleSaveData}
            class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 touch-manipulation flex items-center gap-2"
          >
            <i class="fas fa-save opacity-80"></i> Simpan Data
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
