<script lang="ts">
  import { slide, fade, fly } from 'svelte/transition'
  import type { MenuConfig, FieldConfig } from '~/types/menu'
  import { EncryptionService } from '~/stores/encryption'
  import { getCsrfToken } from '~/utils/getCrsfToken'
  import { Confirm } from '~/utils/confirm.svelte'
  import { toast } from '~/utils/toast.svelte'

  let { config = {} as MenuConfig, title = '' } = $props<{
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
    if (value === null || value === undefined || value === '') return '-'
    const type = field.type
    const locale = field.locale || 'id-ID'
    const format = field.format || (type === 'currency' ? 'IDR' : 'decimal')
    const precision = field.precision ?? 0

    try {
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: format,
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(value)

        case 'number':
          if (format === 'percent') {
            return new Intl.NumberFormat(locale, {
              style: 'percent',
              minimumFractionDigits: precision,
            }).format(value / 100)
          }

          if (format === 'compact') {
            return new Intl.NumberFormat(locale, {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value)
          }

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
      return String(value)
    }
  }

  function toggleColumn(name: string) {
    const isCurrentlyActive = activeColumnNames.includes(name);
    
    if (isCurrentlyActive) {      
      if (activeColumnNames.length > 1) {
        activeColumnNames = activeColumnNames.filter((n) => n !== name);
      }
    } else {
      activeColumnNames = [...activeColumnNames, name];
    }
  }
  
  function showAllColumns() {
    activeColumnNames = allFields.map(f => f.name);
  }

  function openAddForm() {
    formData = {}
    isAddFormOpen = true
  }

  async function handleSaveData() {
    if (!config.endpoint) return
    const missingFields = config.fields?.filter((f: FieldConfig) => f.required && !formData[f.name])
    if (missingFields?.length) {
      return toast.add(
        `Mohon isi: ${missingFields.map((f: FieldConfig) => f.label).join(', ')}`,
        'warning'
      )
    }

    
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
      toast.add('Error: ' + error.message, 'error')
    } finally {
      
    }
  }

  async function handleDelete(id: string | number) {
    const ok = await Confirm.show({
      title: 'Hapus Proyeksi?',
      message: 'Tindakan ini tidak dapat dibatalkan. Semua data engine akan ikut terhapus.',
      confirmText: 'Ya, Hapus',
      type: 'destructive',
    })
    if (!ok) return
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
      toast.add('Data berhasil dihapus', 'success')

      await fetchData()
    } catch (error: any) {
      toast.add('Error: ' + error.message, 'error')
    } finally {
      isLoading = false
    }
  }

  function initGroupData(_node: HTMLElement, config: { fieldName: string; subFields: any[] }) {
    const { fieldName, subFields } = config
    if (formData && fieldName) {
      const currentData = formData[fieldName]
      if (!currentData || Array.isArray(currentData)) {
        const initialObj: Record<string, any> = {}

        if (subFields && Array.isArray(subFields)) {
          subFields.forEach((sf) => {
            if (sf.type === 'boolean') {
              initialObj[sf.name] = false
            } else if (sf.type === 'number' || sf.type === 'currency') {
              initialObj[sf.name] = 0
            } else {
              initialObj[sf.name] = ''
            }
          })
        }
        formData[fieldName] = initialObj
      }
    }
  }

  function formatJsonData(fieldName: any) {
    const rawValue = formData[fieldName]
    if (!rawValue || rawValue.trim() === '') {
      formData[fieldName] = '[\n  \n]'
      return
    }
    try {
      const parsedData = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
      formData[fieldName] = JSON.stringify(parsedData, null, 2)
    } catch (error) {
      console.error('[JSON Parse Error]:', error.message)
      toast.add(`Format JSON Tidak Valid: ${error.message}`, 'error')
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
        
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      isLoading = false
    }
  }

  function openEditForm(item: any) {
    const systemKeys = ['_id', 'created_at', 'updated_at', 'deleted_at'];
    const formattedData = Object.entries(item).reduce((acc, [key, value]) => {
      if (systemKeys.includes(key)) {
        acc[key] = value;
        return acc;
      }
      if (value !== null && typeof value === 'object') {
        try {
          acc[key] = JSON.stringify(value, null, 2);
        } catch (e) {
          acc[key] = value;
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    formData = formattedData;
    selectedId = item._id || item.id;
    isEditMode = true;
    isAddFormOpen = true;
  }

  const getGridWidth = (width: string | number | undefined): string => {
    const w = String(width)
    switch (w) {
      case '33':
        return 'md:col-span-4' 
      case '50':
        return 'md:col-span-6' 
      case '66':
        return 'md:col-span-8' 
      case '100':
      default:
        return 'md:col-span-12' 
    }
  }

  function toggleVisibility(fieldName: string) {
    visiblePasswordFields[fieldName] = !visiblePasswordFields[fieldName]
  }
  function syntaxHighlight(json: any) {
    if (json === null || json === undefined) return '<span class="text-rose-500">null</span>';
    
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2); 
    }
    
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    
    const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match: string) {
      let cls = 'text-orange-400'; 
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-primary font-semibold'; 
        } else {
          cls = 'text-emerald-500'; 
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-blue-500'; 
      } else if (/null/.test(match)) {
        cls = 'text-rose-500'; 
      }
      return `<span class="${cls}">${match}</span>`;
    });

    
    return highlighted.trim();
  }
</script>

<div
  class="flex inset-0 flex-col h-full w-full bg-background border border-border/80 rounded-lg animate-in fade-in duration-500 overflow-hidden shadow-2xl"
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
            class="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col focus:outline-none"
            transition:slide={{ duration: 250, axis: 'y' }}
          >
            <div class="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h4 class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Manage Columns
              </h4>
              <button 
                onclick={showAllColumns}
                class="text-[10px] font-medium text-primary hover:underline transition-all"
              >
                Reset
              </button>
            </div>

            <div class="max-h-72 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {#each allFields as field}
                {@const isActive = activeColumnNames.includes(field.name)}
                {@const isLastOne = isActive && activeColumnNames.length === 1}

                <label
                  class="flex items-center justify-between px-3 py-2 rounded-lg transition-all
                  {isLastOne ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'}"
                  title={isLastOne ? "Minimal harus ada satu kolom yang tampil" : ""}
                >
                  <div class="flex items-center gap-3">
                    <div class="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={isLastOne} 
                        onchange={() => toggleColumn(field.name)}
                        class="peer appearance-none w-4 h-4 rounded border border-border bg-background checked:bg-primary transition-all disabled:cursor-not-allowed"
                      />
                      <i class="fas fa-check absolute text-[8px] text-primary-foreground opacity-0 peer-checked:opacity-100"></i>
                    </div>
                    
                    <span class="text-xs font-medium {isActive ? 'text-primary' : 'text-muted-foreground'}">
                      {field.label}
                    </span>
                  </div>
                </label>
              {/each}
            </div>
          </div>

          <div
            role="button"
            tabindex="0"
            class="fixed inset-0 z-40 bg-transparent"
            onclick={() => (isColumnManagerOpen = false)}
            onkeydown={(e) => e.key === 'Escape' && (isColumnManagerOpen = false)}
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

  <div class="flex-1 min-h-0 flex flex-col px-3 md:px-6 lg:px-8 pb-4 md:pb-6 relative">
    <div
      class="flex-1 border border-border/40 overflow-hidden flex flex-col relative ring-1 ring-black/[0.02] dark:ring-white/[0.02]"
    >
      {#if isLoading}
        <div
          class="absolute inset-0 z-30 bg-background/50 backdrop-blur-md flex items-center justify-center"
          in:fade={{ duration: 300 }}
        >
          <div
            class="bg-card px-8 py-5 rounded-lg shadow-2xl border border-border/50 flex items-center gap-5 ring-1 ring-black/5"
          >
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 rounded-full blur-md bg-primary/30 animate-pulse"></div>
              <i class="fas fa-circle-notch fa-spin text-primary text-2xl relative z-10"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-foreground tracking-tight">Menyinkronkan Data</p>
              <p
                class="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mt-1"
              >
                Menghubungkan ke Server
              </p>
            </div>
          </div>
        </div>
      {:else}
        <div class="relative flex-1 w-full overflow-x-auto overflow-y-auto custom-scrollbar">
          {#if !config.endpoint}
            <div
              class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-80"
            >
              <div
                class="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner relative group"
              >
                <div
                  class="absolute inset-0 rounded-full bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-500"
                ></div>
                <i class="fas fa-link text-3xl text-muted-foreground/40"></i>
              </div>
              <h3 class="text-lg font-bold text-foreground tracking-tight">Endpoint Terputus</h3>
              <p class="text-sm font-medium text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Tautkan tabel ini ke endpoint API melalui Schema Builder untuk mulai mengelola data.
              </p>
            </div>
          {:else if dataList.length === 0 && !isLoading}
            <div
              class="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              in:fade={{ duration: 200 }}
            >
              <div
                class="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50 shadow-inner"
              >
                <i class="fas fa-inbox text-3xl text-muted-foreground/40"></i>
              </div>
              <h3 class="text-lg font-bold text-foreground tracking-tight">Koleksi Kosong</h3>
              <p class="text-sm font-medium text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Belum ada entri data yang ditemukan untuk koleksi ini.
              </p>
            </div>
          {:else}
            <table class="w-max min-w-full text-left border-collapse">
              <thead class="bg-card/95 sticky top-0 z-20 backdrop-blur-xl shadow-sm">
                <tr>
                  <th
                    class="px-5 py-4 border-b border-border/40 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-14 text-center"
                  >
                    No
                  </th>
                  {#each visibleFields as field}
                    <th
                      class="px-5 py-4 border-b border-border/40 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 whitespace-nowrap min-w-[160px] max-w-[300px]"
                    >
                      {field.label}
                    </th>
                  {/each}
                  <th
                    class="px-6 py-4 border-b border-border/40 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 text-right sticky right-0 bg-card/95 backdrop-blur-xl w-32 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border/40"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-border/40">
                {#each dataList as row, idx (row.id || row._id || idx)}
                  <tr class="hover:bg-muted/30 transition-colors duration-200 group">
                    <td
                      class="px-5 py-4 text-[11px] font-bold text-muted-foreground/50 text-center"
                    >
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>

                    {#each visibleFields as field}
                      <td class="px-5 py-4 text-[13px] text-foreground/90 overflow-visible max-w-[300px]">
                        {#if field.type === 'boolean'}
                          {@const isTrue = !!row[field.name]}
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm
                            {isTrue ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}">
                            <span class="w-1.5 h-1.5 rounded-full {isTrue ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                            {formatValue(isTrue, field)}
                          </span>

                        {:else if field.type === 'select'}
                          <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary/5 text-primary border border-primary/10 shadow-sm uppercase tracking-wide">
                            {formatValue(row[field.name], field)}
                          </span>
                        {:else if field.type === 'password'}
                          <div class="flex items-center gap-2">
                            <span class="font-mono text-[14px] tracking-[0.3em] text-muted-foreground/50 select-none">
                              ••••••••
                            </span>
                            
                            <button 
                              onclick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(row[field.name]);
                              }}
                              class="p-1.5 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                              title="Copy Raw Value"
                            >
                              <i class="fas fa-copy text-[10px]"></i>
                            </button>
                          </div>
                        {:else if field.type === 'any'}
                          {@const val = row[field.name]}
                          {@const isNull = val === null || val === undefined}
                          {@const isArray = Array.isArray(val)}
                          {@const isObject = typeof val === 'object' && !isArray && !isNull}

                          <div class="relative group/inspector inline-flex items-center">
                            
                            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border/60 transition-all duration-300 select-none cursor-pointer
                              {isNull ? 'bg-muted/20 text-muted-foreground/50' : ''}
                              {isArray ? 'bg-blue-500/5 border-blue-500/20 text-blue-600' : ''}
                              {isObject ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-600' : ''}
                              {!isNull && !isArray && !isObject ? 'bg-muted/40 text-foreground' : ''}
                              group-hover/inspector:ring-2 group-hover/inspector:ring-primary/10 group-hover/inspector:border-primary/30">
                              
                              <i class="fas {isArray ? 'fa-layer-group' : isObject ? 'fa-brackets-curly' : 'fa-font'} text-[9px] opacity-70"></i>
                              <span class="text-[10px] font-bold font-mono uppercase tracking-tight">
                                {isArray ? `List[${val.length}]` : isObject ? `Map{${Object.keys(val).length}}` : 'Any'}
                              </span>
                            </div>

                            <div class="invisible group-hover/inspector:visible opacity-0 group-hover/inspector:opacity-100 scale-95 group-hover/inspector:scale-100 
                              transition-all duration-200 absolute z-[100] top-full left-0 pt-3 min-w-[320px] max-w-sm 
                              pointer-events-none group-hover/inspector:pointer-events-auto">
                              
                              <div class="bg-card/98 backdrop-blur-xl border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col ring-1 ring-black/5">
                                
                                <div class="px-4 py-2 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                                  <span class="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">Object Inspector</span>
                                  <button 
                                    onclick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(val, null, 2)); }}
                                    class="px-2 py-1 rounded bg-primary/10 hover:bg-primary hover:text-white text-[9px] font-bold text-primary transition-all active:scale-90">
                                    <i class="fas fa-copy mr-1"></i> COPY
                                  </button>
                                </div>

                                <div class="p-4 max-h-64 overflow-y-auto custom-scrollbar bg-card/50">
                                  <pre class="text-[11px] font-mono leading-relaxed selection:bg-primary/30 text-foreground/90 uppercase tracking-tight">{@html val ? syntaxHighlight(val) : '<span class="text-muted-foreground/40 italic">null</span>'}</pre>
                                </div>
                              </div>
                            </div>
                          </div>

                        {:else}
                          <div class="w-full truncate font-medium {field.type === 'number' || field.type === 'currency' ? 'font-mono tracking-tight' : ''}" title={String(row[field.name] || '')}>
                            {formatValue(row[field.name], field)}
                          </div>
                        {/if}
                      </td>
                    {/each}

                    <td
                      class="px-6 py-3 text-right sticky right-0 bg-card z-10 group-hover:bg-muted transition-colors duration-200 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border/40"
                    >
                      <div class="flex items-center justify-end gap-2">
                        <button
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:bg-blue-500/10 hover:text-blue-600 transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95"
                          title="Edit Data"
                          onclick={() => openEditForm(row)}
                        >
                          <i class="fas fa-pen text-xs"></i>
                        </button>
                        <button
                          onclick={() => handleDelete(row.id || row._id)}
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-600 transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95"
                          title="Hapus Data"
                        >
                          <i class="fas fa-trash-alt text-xs"></i>
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
          class="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-xl px-5 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20"
        >
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Menampilkan <span class="text-foreground"
              >{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span
            >
            -
            <span class="text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
            dari <span class="text-primary">{totalItems}</span>
          </span>

          <div class="flex gap-2 items-center">
            <button
              aria-label="prev"
              disabled={currentPage === 1 || isLoading}
              onclick={() => currentPage--}
              class="w-9 h-9 rounded-lg border border-border/60 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-card transition-all duration-200 shadow-sm active:scale-95 touch-manipulation"
            >
              <i class="fas fa-chevron-left text-[10px]"></i>
            </button>

            <div
              class="flex items-center justify-center min-w-[36px] h-9 px-3 text-[13px] font-bold text-foreground bg-muted/30 border border-border/40 rounded-lg shadow-inner"
            >
              {currentPage}
            </div>

            <button
              aria-label="next"
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || isLoading}
              onclick={() => currentPage++}
              class="w-9 h-9 rounded-lg border border-border/60 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-card transition-all duration-200 shadow-sm active:scale-95 touch-manipulation"
            >
              <i class="fas fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      {/if}
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

        <div
          class="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-12 gap-6 content-start"
        >
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
                    readonly={field.readonly}
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner min-h-[120px] custom-scrollbar resize-none read-only:bg-muted/50 read-only:text-muted-foreground read-only:cursor-not-allowed read-only:border-dashed"
                  ></textarea>
                {:else if field.type === 'any'}
                  <div
                    class="group relative rounded-xl overflow-hidden border border-border/80 bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-inner {field.readonly
                      ? 'opacity-80'
                      : ''}"
                  >
                    <div
                      class="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50"
                    >
                      <div class="flex items-center gap-2">
                        <div class="flex gap-1.5 opacity-40">
                          <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                          <div class="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
                        </div>

                        <span
                          class="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                        >
                          JSON Payload
                          <span class="text-primary/70 lowercase font-mono italic">
                            ({field.name})
                          </span>
                        </span>
                      </div>

                      {#if !field.readonly}
                        <button
                          type="button"
                          onclick={() => formatJsonData(field.name)}
                          class="flex items-center gap-1.5 text-[9px] font-bold bg-background border border-border text-muted-foreground px-2.5 py-1 rounded-md shadow-sm hover:border-primary/50 hover:text-primary transition-all active:scale-95"
                        >
                          <i class="fas fa-magic text-[8px]"></i> Format & Validasi
                        </button>
                      {/if}
                    </div>

                    <textarea
                      id="field-{field.name}"
                      bind:value={formData[field.name]}
                      placeholder="Enter JSON data..."
                      readonly={field.readonly}
                      spellcheck="false"
                      class="w-full px-4 py-3 bg-transparent text-primary border-none text-[11px] font-mono leading-relaxed focus:outline-none focus:ring-0 min-h-[160px] custom-scrollbar resize-none read-only:cursor-not-allowed placeholder:text-muted-foreground/30"
                    ></textarea>
                  </div>
                {:else if field.type === 'boolean'}
                  <label
                    class="flex items-center justify-between p-3.5 border border-border/80 rounded-xl bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                  >
                    <span class="text-xs font-bold text-foreground/80">Aktifkan {field.label}</span>
                    <div
                      class="relative inline-flex items-center {field.readonly
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'}"
                    >
                      <input
                        type="checkbox"
                        disabled={field.readonly}
                        bind:checked={formData[field.name]}
                        class="sr-only peer"
                      />
                      <div
                        class="w-9 h-5 bg-muted-foreground/20 peer-focus:outline-none rounded-full peer
                              peer-checked:bg-primary
                              peer-checked:after:translate-x-full peer-checked:after:border-white
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                              after:bg-white after:border-gray-300 after:border after:rounded-full
                              after:h-4 after:w-4 after:transition-all
                              peer-disabled:bg-muted-foreground/10 peer-disabled:cursor-not-allowed"
                      ></div>
                    </div>
                  </label>
                {:else if field.type === 'select'}
                  <div class="relative">
                    <select
                      id="field-{field.name}"
                      bind:value={formData[field.name]}
                      disabled={field.readonly}
                      class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner appearance-none peer
                            disabled:bg-muted/50 disabled:cursor-not-allowed disabled:text-muted-foreground/70 disabled:border-dashed"
                    >
                      <option value="" disabled selected>Pilih {field.label}...</option>
                      {#each field.options || [] as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                    <div
                      class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 transition-opacity peer-disabled:opacity-40"
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
                      disabled={field.readonly}
                      placeholder="Cari {field.label}..."
                      class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-bold focus:border-primary outline-none transition-all shadow-inner peer
                            {field.readonly
                        ? 'cursor-not-allowed bg-muted/50 text-muted-foreground/70 border-dashed'
                        : 'cursor-pointer'}"
                      onclick={() =>
                        !field.readonly &&
                        toast.add(`Buka Lookup untuk: ${field.relation_collection}`, 'info')}
                    />
                    <div
                      class="absolute right-4 top-1/2 -translate-y-1/2 transition-colors {field.readonly
                        ? 'text-muted-foreground/40'
                        : 'text-primary'}"
                    >
                      <i class="fas fa-search text-[10px]"></i>
                    </div>
                  </div>
                {:else if field.type === 'repeater' || field.type === 'object_group'}
                  <div
                    class="p-1 rounded-lg bg-gradient-to-b from-border/50 to-transparent transition-all duration-500"
                  >
                    <div
                      class="p-4 md:p-5 border border-border/80 rounded-[15px] bg-card/50 backdrop-blur-sm space-y-4 md:space-y-5"
                    >
                      <div class="flex items-center justify-between border-b border-border/60 pb-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner"
                          >
                            <i
                              class="fas {field.type === 'repeater'
                                ? 'fa-table-cells-large'
                                : 'fa-layer-group'} text-[13px]"
                            ></i>
                          </div>
                          <div>
                            <span
                              class="text-[11px] font-black text-foreground uppercase tracking-widest block"
                            >
                              {field.label}
                            </span>
                            {#if field.type === 'repeater'}
                              <span
                                class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 block"
                              >
                                Total: {formData[field.name]?.length || 0} Baris
                              </span>
                            {:else}
                              <div class="flex items-center gap-1.5 mt-1">
                                <div
                                  class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
                                ></div>
                                <span
                                  class="text-[8px] font-black text-blue-500 uppercase tracking-tighter"
                                >
                                  Single Object Structure
                                </span>
                              </div>
                            {/if}
                          </div>
                        </div>

                        {#if field.type === 'repeater'}
                          <button
                            type="button"
                            onclick={() => {
                              if (!formData[field.name] || !Array.isArray(formData[field.name]))
                                formData[field.name] = []
                              formData[field.name] = [...formData[field.name], {}]
                            }}
                            class="text-[10px] font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <i class="fas fa-plus"></i>
                            <span class="hidden sm:inline">Tambah Baris</span>
                          </button>
                        {/if}
                      </div>

                      {#if field.type === 'repeater'}
                        {#if !formData[field.name] || !Array.isArray(formData[field.name]) || formData[field.name].length === 0}
                          <div
                            class="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/10"
                          >
                            <div
                              class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3"
                            >
                              <i class="fas fa-stream text-muted-foreground/50 text-lg"></i>
                            </div>
                            <p class="text-[11px] font-bold text-foreground">
                              Belum ada baris data
                            </p>
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
                                        class="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider flex items-center justify-between"
                                      >
                                        <span
                                          >{sf.label}
                                          {#if sf.required}<span class="text-destructive">*</span
                                            >{/if}</span
                                        >
                                      </label>

                                      {#if sf.type === 'textarea'}
                                        <textarea
                                          bind:value={row[sf.name]}
                                          placeholder="Detail {sf.label.toLowerCase()}..."
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary outline-none transition-all resize-none min-h-[80px] custom-scrollbar"
                                        ></textarea>
                                      {:else if sf.type === 'boolean'}
                                        <label
                                          class="flex items-center justify-between px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg cursor-pointer hover:bg-muted/20 transition-colors"
                                        >
                                          <span class="text-[10px] font-bold text-foreground/80"
                                            >Aktifkan</span
                                          >
                                          <input
                                            type="checkbox"
                                            bind:checked={row[sf.name]}
                                            class="w-4 h-4 rounded text-primary focus:ring-0 border-border/60"
                                          />
                                        </label>
                                      {:else if sf.type === 'select'}
                                        <select
                                          bind:value={row[sf.name]}
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-bold focus:border-primary outline-none transition-all"
                                        >
                                          <option value="" disabled selected>Pilih...</option>
                                          {#each sf.options || [] as opt}<option value={opt.value}
                                              >{opt.label}</option
                                            >{/each}
                                        </select>
                                      {:else if sf.type === 'number' || sf.type === 'currency'}
                                        <input
                                          type="number"
                                          bind:value={row[sf.name]}
                                          placeholder="0"
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-mono font-bold focus:border-primary outline-none transition-all"
                                        />
                                      {:else}
                                        <input
                                          type={sf.type === 'datetime' ? 'datetime-local' : 'text'}
                                          bind:value={row[sf.name]}
                                          placeholder="Masukkan {sf.label.toLowerCase()}..."
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary outline-none transition-all"
                                        />
                                      {/if}
                                    </div>
                                  {/each}
                                </div>
                              </div>
                            {/each}
                          </div>
                        {/if}
                      {:else}
                        <div
                          class="p-4 md:p-6 bg-background/50 border border-border/50 rounded-xl shadow-sm"
                          use:initGroupData={{ fieldName: field.name, subFields: field.sub_fields }}
                        >
                          {#if formData[field.name] && !Array.isArray(formData[field.name])}
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              {#each field.sub_fields || [] as sf}
                                <div class="space-y-1.5 {getGridWidth(sf.width)}">
                                  <label
                                    for="group-{field.name}-{sf.name}"
                                    class="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-wider flex items-center justify-between"
                                  >
                                    <span
                                      >{sf.label}
                                      {#if sf.required}<span class="text-destructive">*</span
                                        >{/if}</span
                                    >
                                    {#if sf.type === 'currency' || sf.type === 'number'}
                                      <span
                                        class="text-[7px] bg-primary/10 px-1 py-0.5 rounded text-primary font-black uppercase"
                                      >
                                        {sf.format || (sf.type === 'currency' ? 'IDR' : 'DEC')}
                                      </span>
                                    {/if}
                                  </label>

                                  <div class="relative group">
                                    {#if sf.type === 'textarea'}
                                      <textarea
                                        bind:value={formData[field.name][sf.name]}
                                        placeholder="Detail {sf.label.toLowerCase()}..."
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary outline-none transition-all resize-none min-h-[80px] custom-scrollbar"
                                      ></textarea>
                                    {:else if sf.type === 'boolean'}
                                      <label
                                        class="flex items-center justify-between px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg cursor-pointer hover:bg-muted/20 transition-colors"
                                      >
                                        <span class="text-[10px] font-bold text-foreground/80"
                                          >Aktifkan Status</span
                                        >
                                        <input
                                          type="checkbox"
                                          bind:checked={formData[field.name][sf.name]}
                                          class="sr-only peer"
                                        />
                                        <div
                                          class="relative w-7 h-4 bg-muted-foreground/30 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full"
                                        ></div>
                                      </label>
                                    {:else if sf.type === 'select'}
                                      <div class="relative">
                                        <select
                                          bind:value={formData[field.name][sf.name]}
                                          class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-bold focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                        >
                                          <option value="" disabled selected>Pilih...</option>
                                          {#each sf.options || [] as opt}<option value={opt.value}
                                              >{opt.label}</option
                                            >{/each}
                                        </select>
                                        <i
                                          class="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/50 pointer-events-none"
                                        ></i>
                                      </div>
                                    {:else if sf.type === 'number' || sf.type === 'currency'}
                                      <input
                                        type="number"
                                        bind:value={formData[field.name][sf.name]}
                                        placeholder="0"
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-mono font-bold focus:border-primary outline-none transition-all"
                                      />
                                    {:else}
                                      <input
                                        type={sf.type === 'datetime' ? 'datetime-local' : 'text'}
                                        bind:value={formData[field.name][sf.name]}
                                        placeholder="Masukkan {sf.label.toLowerCase()}..."
                                        class="w-full px-3.5 py-2.5 bg-muted/10 border border-border/60 rounded-lg text-xs font-medium focus:border-primary outline-none transition-all"
                                      />
                                    {/if}
                                  </div>

                                  {#if sf.description}
                                    <p
                                      class="text-[8px] text-muted-foreground/60 italic px-1 pt-0.5"
                                    >
                                      * {sf.description}
                                    </p>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          {/if}
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
                    readonly={field.readonly}
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-mono font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  />
                {:else if field.type === 'password'}
                  <div class="relative">
                    <input
                      id="field-{field.name}"
                      type={visiblePasswordFields[field.name] ? 'text' : 'password'}
                      bind:value={formData[field.name]}
                      placeholder="Masukkan {field.label.toLowerCase()}..."
                      readonly={field.readonly}
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
                    readonly={field.readonly}
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                  />
                {:else}
                  <input
                    id="field-{field.name}"
                    type={field.type === 'datetime' ? 'datetime-local' : 'text'}
                    bind:value={formData[field.name]}
                    placeholder="Masukkan {field.label.toLowerCase()}..."
                    readonly={field.readonly}
                    class="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner read-only:bg-muted/50 read-only:text-muted-foreground read-only:cursor-not-allowed read-only:border-dashed"
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
