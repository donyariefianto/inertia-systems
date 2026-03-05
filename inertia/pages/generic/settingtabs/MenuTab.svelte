<script lang="ts">
  import { page } from '@inertiajs/svelte'
  import { slide, fade } from 'svelte/transition'
  import { EncryptionService } from '~/stores/encryption'
  import type { MenuNode, MenuConfig } from '~/types/menu'

  let { menuTree = $bindable<MenuNode[]>([]) } = $props()

  let selectedId = $state<string | null>(null)
  let isDirty = $state(false)
  let isTableConfigOpen = $state(false)
  let activeFieldIndex = $state<number | null>(null)

  let draggedId = $state<string | null>(null)
  let dropTargetId = $state<string | null>(null)
  let dropZone = $state<'before' | 'inside' | 'after' | null>(null)

  let isInitialized = $state(false)

  const activeItem = $derived(selectedId ? findNode(menuTree, selectedId) : null)
  const activeConfig = $derived<MenuConfig | undefined>(activeItem?.config)

  $effect(() => {
    if (isInitialized) return
    const sidebar = $page.props.sidebar as any
    if (sidebar?.ciphertext && sidebar?.nonce && menuTree.length === 0) {
      try {
        const decryptedRaw = EncryptionService.decrypt(sidebar.nonce, sidebar.ciphertext)
        const data = typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
        const rawMenu = data.sidemenu || data
        menuTree = processInitialData(rawMenu)
        isInitialized = true
      } catch (error) {
        console.error('Enterprise Data Initialization Failed:', error)
      }
    }
  })

  function findNode(nodes: MenuNode[], id: string): MenuNode | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.sub_sidemenu) {
        const found = findNode(node.sub_sidemenu, id)
        if (found) return found
      }
    }
    return null
  }

  function removeNode(nodes: MenuNode[], id: string): MenuNode | null {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes.splice(i, 1)[0]
      if (nodes[i].sub_sidemenu) {
        const found = removeNode(nodes[i].sub_sidemenu!, id)
        if (found) return found
      }
    }
    return null
  }

  function processInitialData(nodes: MenuNode[]): MenuNode[] {
    return nodes.map((node) => {
      if (node.id && String(node.id).includes('fixed')) node.locked = true
      if (node.config?.fields) {
        node.config.fields.forEach((f) => {
          if (f._isCollapsed === undefined) f._isCollapsed = true
        })
      }
      if (node.sub_sidemenu && node.sub_sidemenu.length > 0) {
        node.sub_sidemenu = processInitialData(node.sub_sidemenu)
      }
      return node
    })
  }

  const generateId = () => 'node_' + Math.random().toString(36).substring(2, 9)

  function addTemplateItem(type: 'group' | 'tableview') {
    const isTable = type === 'tableview'
    const newNode: MenuNode = {
      id: generateId(),
      name: isTable ? 'New Collections' : 'New Folder',
      icon: isTable ? 'fas fa-table' : 'fas fa-folder',
      type: type,
      path: isTable ? 'new-collections' : 'new-folder',
      sub_sidemenu: type === 'group' ? [] : undefined,
      config: isTable ? { endpoint: '', collectionName: '', fields: [] } : undefined,
    }

    if (isTable) {
      const parent = selectedId ? findNode(menuTree, selectedId) : null
      if (!parent || parent.type !== 'group') {
        alert("⚠️ Operasi Ditolak: Tabel harus dimasukkan ke dalam 'Folder/Group'.")
        return
      }
      if (parent.locked) {
        alert('⚠️ Akses Ditolak: Group sistem dikunci dan tidak dapat menerima modifikasi.')
        return
      }
      parent.sub_sidemenu = parent.sub_sidemenu || []
      parent.sub_sidemenu.push(newNode)
      parent.expanded = true
    } else {
      if (menuTree.length > 1) menuTree.splice(menuTree.length - 1, 0, newNode)
      else menuTree.push(newNode)
    }

    selectedId = newNode.id
    isDirty = true
  }

  function deleteNode(id: string) {
    const node = findNode(menuTree, id)
    if (!node) return
    if (node.locked) {
      alert('🔒 Node ini dikunci oleh sistem dan tidak dapat dihapus.')
      return
    }
    if (confirm(`Hapus "${node.name}" secara permanen? Seluruh data di dalamnya akan terhapus.`)) {
      removeNode(menuTree, id)
      if (selectedId === id) {
        selectedId = null
        activeFieldIndex = null
        isTableConfigOpen = false
      }
      isDirty = true
    }
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId || !dropZone) return
    const movingNode = removeNode(menuTree, draggedId)
    if (!movingNode) return

    const insertNode = (nodes: MenuNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          if (dropZone === 'inside') {
            nodes[i].sub_sidemenu = nodes[i].sub_sidemenu || []
            nodes[i].sub_sidemenu!.push(movingNode)
            nodes[i].expanded = true
          } else if (dropZone === 'before') {
            nodes.splice(i, 0, movingNode)
          } else if (dropZone === 'after') {
            nodes.splice(i + 1, 0, movingNode)
          }
          return true
        }
        if (nodes[i].sub_sidemenu && insertNode(nodes[i].sub_sidemenu!)) return true
      }
      return false
    }

    insertNode(menuTree)
    isDirty = true
    draggedId = null
    dropTargetId = null
    dropZone = null
  }

  const mathOps = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'MODULO', 'PERCENTAGE']
  const aggOps = ['SUM', 'AVG', 'COUNT', 'COUNT_DISTINCT', 'MAX', 'MIN']

  const isMath = (op: string) => mathOps.includes(op)
  const isAgg = (op: string) => aggOps.includes(op)
</script>

<div
  class="relative overflow-hidden flex h-full w-full flex-col bg-background text-foreground font-sans border border-border/50 shadow-sm"
>
  <div
    class="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-hidden min-h-0 bg-muted/5"
  >
    <div
      class="w-full lg:w-[320px] xl:w-1/4 h-[40%] lg:h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm shrink-0"
    >
      <div
        class="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0"
      >
        <span class="text-xs font-bold uppercase opacity-50 flex items-center gap-2">
          <i class="fas fa-sitemap"></i> Structure {isDirty ? '(Unsaved)' : ''}
        </span>
        <div class="flex gap-2">
          <button
            onclick={() => addTemplateItem('tableview')}
            class="text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 touch-manipulation
            {activeItem?.type === 'group' && !activeItem.locked
              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white'
              : 'bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed'}"
          >
            <i class="fas fa-plus"></i> Table
          </button>
          <button
            onclick={() => addTemplateItem('group')}
            class="text-[10px] font-bold bg-muted text-foreground px-3 py-1.5 rounded-lg border border-transparent hover:border-border shadow-sm flex items-center gap-1 transition-all touch-manipulation"
          >
            <i class="fas fa-folder-plus"></i> Folder
          </button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {@render renderTree(menuTree, 0)}
      </div>
    </div>

    <div
      class="flex-1 flex flex-col bg-card rounded-2xl min-h-[50%] lg:min-h-0 border border-border overflow-hidden shadow-sm relative"
    >
      <div
        class="p-4 border-b border-border bg-muted/30 shrink-0 flex justify-between items-center"
      >
        <span class="text-xs font-bold uppercase opacity-50 flex items-center gap-2"
          ><i class="fas fa-sliders-h"> </i> Node Properties</span
        >
        {#if activeItem && !activeItem.locked}
          <button
            onclick={() => deleteNode(activeItem.id)}
            class="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 touch-manipulation"
          >
            <i class="fas fa-trash-alt"></i> Delete Node
          </button>
        {/if}
      </div>

      <div class="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10 custom-scrollbar">
        {#if activeItem}
          <div class="space-y-6 md:space-y-8 max-w-4xl mx-auto" in:fade={{ duration: 200 }}>
            <div class="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <div class="flex items-center gap-3 mb-6 pb-5 border-b border-border/50">
                <div
                  class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
                >
                  <i class="fas fa-info-circle text-lg"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-foreground leading-none">Informasi Node</h3>
                  <p class="text-[11px] text-muted-foreground mt-1.5">
                    Pengaturan identitas visual dan rute navigasi.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div class="space-y-2 {activeItem.type === 'group' ? 'md:col-span-2' : ''}">
                  <label
                    for="label-name"
                    class="block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Label Name
                  </label>
                  <input
                    type="text"
                    disabled={activeItem.locked}
                    bind:value={activeItem.name}
                    oninput={() => (isDirty = true)}
                    placeholder="Contoh: Data Karyawan"
                    class="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed shadow-sm"
                  />
                </div>

                {#if activeItem.type !== 'group'}
                  <div class="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <label
                      for="path"
                      class="block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Path / Slug URL
                    </label>
                    <input
                      type="text"
                      disabled={activeItem.locked}
                      bind:value={activeItem.path}
                      oninput={() => (isDirty = true)}
                      placeholder="data-karyawan"
                      class="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed shadow-sm"
                    />
                  </div>
                {/if}

                <div class="space-y-2">
                  <label
                    for="icon-identity"
                    class="block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Icon Identity
                  </label>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center border border-border shrink-0 shadow-inner"
                    >
                      <i class="{activeItem.icon} text-lg text-foreground/80"></i>
                    </div>
                    <input
                      type="text"
                      disabled={activeItem.locked}
                      bind:value={activeItem.icon}
                      oninput={() => (isDirty = true)}
                      placeholder="fas fa-cube"
                      class="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <label
                    for="Type Identifier"
                    class="block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Type Identifier
                  </label>
                  <div
                    class="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center h-[46px] shadow-inner select-none cursor-default"
                  >
                    <i class="fas fa-tag mr-2 opacity-50"></i>
                    {activeItem.type || 'Undefined'}
                  </div>
                </div>
              </div>
            </div>

            {#if activeItem.type === 'tableview'}
              <div
                class="p-8 md:p-10 border-2 border-dashed border-primary/30 rounded-3xl bg-primary/[0.03] text-center transition-all hover:bg-primary/[0.05] animate-in fade-in slide-in-from-bottom-4"
              >
                <div
                  class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-inner"
                >
                  <i class="fas fa-database text-3xl text-primary"></i>
                </div>
                <h3 class="text-lg md:text-xl font-black text-foreground mb-2">
                  Schema Configurator
                </h3>
                <p class="text-xs text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                  Kelola struktur koleksi database, relasi tabel tingkat lanjut, dan formulir
                  tampilan secara dinamis.
                </p>
                <button
                  disabled={activeItem.locked}
                  onclick={() => {
                    if (!activeItem.config)
                      activeItem.config = { endpoint: '', collectionName: '', fields: [] }
                    isTableConfigOpen = true
                  }}
                  class="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 mx-auto text-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none touch-manipulation active:scale-95"
                >
                  <i class="fas fa-code-branch"></i> Buka Editor Schema
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div
            class="h-full flex flex-col items-center justify-center opacity-30 text-center p-6 animate-in fade-in duration-700"
          >
            <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <i class="fas fa-mouse-pointer text-3xl animate-bounce"></i>
            </div>
            <p class="font-black uppercase tracking-widest text-sm text-foreground">
              Pilih node menu
            </p>
            <p class="text-[11px] font-medium text-muted-foreground mt-2 max-w-xs">
              Navigasi ke panel struktur di sebelah kiri untuk melihat dan mengubah properti.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if isTableConfigOpen && activeConfig}
    <div
      class="absolute flex inset-0 bg-background flex flex-col z-50 overflow-hidden"
      transition:slide={{ axis: 'y', duration: 300 }}
    >
      <div class="shrink-0 bg-card border-b border-border flex flex-col z-20 shadow-sm relative">
        <div class="p-3 md:px-6 md:py-4 flex flex-wrap justify-between items-center gap-3">
          <div class="flex items-center gap-3 md:gap-4">
            <button
              aria-label="Tutup Config"
              onclick={() => {
                isTableConfigOpen = false
                activeFieldIndex = null
              }}
              class="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 touch-manipulation"
              ><i class="fas fa-arrow-left"></i></button
            >
            <div class="min-w-0">
              <h4 class="text-base md:text-md font-black leading-none truncate">Schema Builder</h4>
              <p
                class="text-[9px] md:text-[10px] font-bold text-primary tracking-widest uppercase mt-1 truncate"
              >
                {activeItem?.name}
              </p>
            </div>
          </div>
          <button
            onclick={() => {
              isTableConfigOpen = false
              activeFieldIndex = null
            }}
            class="px-5 py-2.5 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl shadow-md uppercase text-[9px] md:text-[10px] tracking-widest transition-transform active:scale-95 touch-manipulation whitespace-nowrap"
            >Simpan</button
          >
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col lg:flex-row relative bg-muted/5">
        <div
          class="w-full lg:w-[320px] xl:w-[360px] shrink-0 border-r border-border bg-card flex flex-col h-full z-10 transition-all {activeFieldIndex !==
          null
            ? 'hidden lg:flex'
            : 'flex'}"
        >
          <div class="p-4 space-y-4 bg-muted/20 border-b border-border/60">
            <div class="space-y-1.5">
              <label
                for="api-endpoint"
                class="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2"
              >
                <i class="fas fa-link text-[8px]"></i> API Endpoint
              </label>
              <input
                id="api-endpoint"
                type="text"
                bind:value={activeConfig.endpoint}
                oninput={() => (isDirty = true)}
                class="w-full px-3 py-1.5 bg-background border border-border rounded-md font-mono text-[11px] focus:border-primary outline-none transition-all shadow-inner"
                placeholder="/api/v1/..."
              />
            </div>
            <div class="space-y-1.5">
              <label
                for="collection-name"
                class="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2"
              >
                <i class="fas fa-database text-[8px]"></i> Collection
              </label>
              <input
                id="collection-name"
                type="text"
                bind:value={activeConfig.collectionName}
                oninput={() => (isDirty = true)}
                class="w-full px-3 py-1.5 bg-background border border-border rounded-md font-mono text-[11px] focus:border-primary outline-none transition-all shadow-inner"
                placeholder="db_name"
              />
            </div>
          </div>
          <div
            class="p-4 border-b border-border flex justify-between items-center bg-background/50 sticky top-0"
          >
            <span
              class="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"
            >
              <i class="fas fa-layer-group"></i>
              {activeConfig.fields?.length || 0} Fields
            </span>
            <button
              onclick={() => {
                activeConfig.fields = activeConfig.fields || []
                activeConfig.fields.push({
                  label: 'New Field',
                  name: 'new_field',
                  type: 'text',
                  options: [],
                  calculation: { enable_calc: false, operation: 'SUM', fields: '' },
                  sub_fields: [],
                })
                activeFieldIndex = activeConfig.fields.length - 1
                isDirty = true
              }}
              class="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary transition-all rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 touch-manipulation"
            >
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-muted/10">
            {#if !activeConfig.fields || activeConfig.fields.length === 0}
              <div class="text-center py-12 opacity-50">
                <i class="fas fa-stream text-3xl mb-3 block"></i>
                <p class="text-xs font-semibold">Struktur tabel kosong.</p>
              </div>
            {/if}

            {#each activeConfig.fields || [] as field, idx}
              <div
                class="group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border {activeFieldIndex ===
                idx
                  ? 'bg-background border-primary/30 shadow-sm border-l-4 border-l-primary'
                  : 'bg-transparent border-transparent hover:bg-muted/50 border-l-4 border-l-transparent'}"
                onclick={() => (activeFieldIndex = idx)}
                onkeydown={() => (activeFieldIndex = idx)}
                role="button"
                tabindex="0"
              >
                <div
                  class="flex flex-col items-center shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                >
                  <button
                    aria-label="UP"
                    onclick={(e) => {
                      e.stopPropagation()
                      if (idx > 0) {
                        const temp = activeConfig.fields![idx]
                        activeConfig.fields![idx] = activeConfig.fields![idx - 1]
                        activeConfig.fields![idx - 1] = temp
                        isDirty = true
                        activeFieldIndex = idx - 1
                      }
                    }}
                    disabled={idx === 0}
                    class="w-6 h-5 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-20 touch-manipulation"
                    ><i class="fas fa-caret-up text-[14px]"></i></button
                  >
                  <button
                    aria-label="DOWN"
                    onclick={(e) => {
                      e.stopPropagation()
                      if (idx < activeConfig.fields!.length - 1) {
                        const temp = activeConfig.fields![idx]
                        activeConfig.fields![idx] = activeConfig.fields![idx + 1]
                        activeConfig.fields![idx + 1] = temp
                        isDirty = true
                        activeFieldIndex = idx + 1
                      }
                    }}
                    disabled={idx === activeConfig.fields!.length - 1}
                    class="w-6 h-5 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-20 touch-manipulation"
                    ><i class="fas fa-caret-down text-[14px]"></i></button
                  >
                </div>

                <div class="flex-1 min-w-0 flex flex-col justify-center py-1">
                  <p
                    class="text-xs font-bold truncate transition-colors {activeFieldIndex === idx
                      ? 'text-primary'
                      : 'text-foreground'}"
                  >
                    {field.label || 'Untitled Field'}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[9px] font-mono text-muted-foreground truncate"
                      >{field.name || 'db_key'}</span
                    ><span class="w-1 h-1 rounded-full bg-border"></span><span
                      class="text-[8px] font-black tracking-widest text-muted-foreground uppercase"
                      >{field.type}</span
                    >
                  </div>
                </div>

                <button
                  onclick={(e) => {
                    e.stopPropagation()
                    activeConfig.fields!.splice(idx, 1)
                    if (activeFieldIndex === idx) activeFieldIndex = null
                    else if (activeFieldIndex !== null && activeFieldIndex > idx) activeFieldIndex--
                    isDirty = true
                  }}
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-destructive/50 hover:bg-destructive/10 hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shrink-0 mr-1 touch-manipulation"
                  title="Hapus Field"><i class="fas fa-trash-alt text-[12px]"></i></button
                >
              </div>
            {/each}
          </div>
        </div>

        <div
          class="flex-1 h-full flex flex-col bg-background relative overflow-hidden transition-all {activeFieldIndex ===
          null
            ? 'hidden lg:flex'
            : 'flex'}"
        >
          {#if activeFieldIndex !== null && activeConfig.fields?.[activeFieldIndex]}
            {@const field = activeConfig.fields[activeFieldIndex]}

            <div
              class="lg:hidden shrink-0 border-b border-border bg-card p-3 flex items-center gap-3 shadow-sm z-20"
            >
              <button
                onclick={() => (activeFieldIndex = null)}
                class="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-md bg-muted/50 border border-border touch-manipulation"
                ><i class="fas fa-chevron-left"></i> Kembali</button
              >
              <span class="text-xs font-black text-primary truncate flex-1"
                >{field.label || 'Properties'}</span
              >
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10">
              <div
                class="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <div class="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm">
                  <div class="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                    <div
                      class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
                    >
                      <i class="fas fa-sliders-h"></i>
                    </div>
                    <div>
                      <h3 class="text-sm font-black text-foreground leading-none">
                        Identitas Utama
                      </h3>
                      <p class="text-[10px] text-muted-foreground mt-1">
                        Konfigurasi dasar pemetaan database dan UI.
                      </p>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div class="space-y-1.5">
                      <label
                        for="display-label"
                        class="text-[9px] font-black uppercase text-muted-foreground tracking-widest"
                        >Display Label (UI)</label
                      ><input
                        type="text"
                        id="display-label"
                        bind:value={field.label}
                        oninput={() => (isDirty = true)}
                        class="w-full text-xs font-bold bg-background border border-border rounded-xl px-3.5 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-foreground shadow-sm"
                      />
                    </div>
                    <div class="space-y-1.5">
                      <label
                        for="DatabaseKey"
                        class="text-[9px] font-black uppercase text-muted-foreground tracking-widest"
                        >Database Key</label
                      ><input
                        type="text"
                        bind:value={field.name}
                        oninput={() => (isDirty = true)}
                        class="w-full text-xs font-bold bg-background border border-border rounded-xl px-3.5 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-foreground shadow-sm"
                      />
                    </div>
                    <div class="space-y-1.5">
                      <label
                        for="DataType"
                        class="text-[9px] font-black uppercase text-muted-foreground tracking-widest"
                        >Data Type</label
                      >
                      <div class="relative">
                        <select
                          bind:value={field.type}
                          onchange={() => {
                            isDirty = true
                            if (['number', 'currency'].includes(field.type) && !field.calculation)
                              field.calculation = {
                                enable_calc: false,
                                operation: 'SUM',
                                fields: '',
                              }
                            if (field.type === 'select' && !Array.isArray(field.options))
                              field.options = []
                            if (field.type === 'repeater' && !Array.isArray(field.sub_fields))
                              field.sub_fields = []
                          }}
                          class="w-full text-xs font-bold bg-background border border-border rounded-xl pl-3.5 pr-8 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all cursor-pointer text-foreground appearance-none shadow-sm"
                        >
                          <optgroup label="Standar"
                            ><option value="text">Text (Pendek)</option><option value="textarea"
                              >Textarea</option
                            ><option value="boolean">Boolean</option><option value="datetime"
                              >Datetime</option
                            ><option value="email">Email</option></optgroup
                          >
                          <optgroup label="Numerik"
                            ><option value="number">Number</option><option value="currency"
                              >Currency</option
                            ></optgroup
                          >
                          <optgroup label="Kompleks"
                            ><option value="select">Select</option><option value="relation"
                              >Relation</option
                            ><option value="repeater">Repeater (Tabel)</option>
                            <option value="password">Password</option></optgroup
                          >
                          <optgroup label="Media"
                            ><option value="image">Image Upload</option></optgroup
                          >
                        </select>
                        <i
                          class="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"
                        ></i>
                      </div>
                    </div>
                  </div>
                </div>

                {#if ['number', 'currency'].includes(field.type)}
                  <div
                    class="group relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md"
                    transition:slide
                  >
                    <div class="absolute inset-y-0 left-0 w-1 bg-primary/40"></div>

                    <div class="p-5 md:p-7">
                      <div
                        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div class="flex items-center gap-3">
                          <div
                            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                          >
                            <i class="fas fa-calculator text-sm"></i>
                          </div>
                          <div>
                            <h3
                              class="text-xs font-black uppercase tracking-widest text-foreground"
                            >
                              Display Format
                            </h3>
                            <p class="text-[10px] font-medium text-muted-foreground">
                              Otomatisasi format
                            </p>
                          </div>
                        </div>
                      </div>
                      <div class="mb-6 flex flex-col gap-4">
                        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <div class="space-y-2">
                            <label
                              for="regional-locale"
                              class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80"
                            >
                              <i class="fas fa-globe"></i> Regional Locale
                            </label>
                            <select
                              bind:value={field.locale}
                              class="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all"
                            >
                              <option value="id-ID">Indonesia (1.234,56)</option>
                              <option value="en-US">English US (1,234.56)</option>
                              <option value="de-DE">German (1.234,56)</option>
                            </select>
                          </div>

                          <div class="space-y-2">
                            <label
                              for="display-format"
                              class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80"
                            >
                              <i class="fas fa-coins"></i> Display Format
                            </label>
                            <select
                              bind:value={field.format}
                              class="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-xs font-bold outline-none focus:border-primary transition-all"
                            >
                              {#if field.type === 'currency'}
                                <option value="IDR">IDR (Rupiah)</option>
                                <option value="USD">USD (Dollar)</option>
                              {:else}
                                <option value="decimal">Desimal Standar</option>
                                <option value="compact">Ringkas (1.2M)</option>
                                <option value="percent">Persentase (%)</option>
                              {/if}
                            </select>
                          </div>
                        </div>
                      </div>

                      {#if field.calculation}
                        <div
                          class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div class="flex items-center gap-3">
                            <div
                              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                            >
                              <i class="fas fa-calculator text-sm"></i>
                            </div>
                            <div>
                              <h3
                                class="text-xs font-black uppercase tracking-widest text-foreground"
                              >
                                Computation Logic
                              </h3>
                              <p class="text-[10px] font-medium text-muted-foreground">
                                Otomatisasi kalkulasi data secara sistemik
                              </p>
                            </div>
                          </div>

                          <label
                            class="relative inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-2 transition-colors hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              bind:checked={field.calculation.enable_calc}
                              onchange={() => (isDirty = true)}
                              class="peer sr-only"
                            />
                            <div
                              class="peer h-5 w-9 rounded-full bg-muted-foreground/20 after:absolute after:left-[18px] after:top-[10px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-4"
                            ></div>
                            <span
                              class="text-[10px] font-black uppercase tracking-tight text-foreground/70"
                              >Aktifkan</span
                            >
                          </label>
                        </div>
                        {#if field.calculation.enable_calc}
                          <div
                            class="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500"
                          >
                            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                              <div class="space-y-2">
                                <label
                                  for="operation-mode"
                                  class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80"
                                >
                                  <i class="fas fa-microchip"></i> Mode Operasi
                                </label>
                                <select
                                  bind:value={field.calculation.operation}
                                  onchange={() => (isDirty = true)}
                                  class="w-full cursor-pointer rounded-xl border border-border/80 bg-background px-4 py-3 text-xs font-bold outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                                >
                                  <optgroup label="Mathematics (Row-based)">
                                    <option value="ADD">Penjumlahan (+)</option>
                                    <option value="SUBTRACT">Pengurangan (-)</option>
                                    <option value="MULTIPLY">Perkalian (×)</option>
                                    <option value="DIVIDE">Pembagian (÷)</option>
                                    <option value="PERCENTAGE">Persentase (%)</option>
                                  </optgroup>
                                  <optgroup label="Aggregation (Group-based)">
                                    <option value="SUM">Total (Sum)</option>
                                    <option value="AVG">Rata-rata (Avg)</option>
                                    <option value="COUNT">Total Baris (Count)</option>
                                  </optgroup>
                                </select>
                              </div>

                              <div class="space-y-2">
                                <label
                                  for="target-keys"
                                  class="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80"
                                >
                                  <i class="fas fa-key"></i> Target Keys
                                </label>
                                <input
                                  type="text"
                                  bind:value={field.calculation.fields}
                                  oninput={() => (isDirty = true)}
                                  placeholder="cth: qty, unit_price"
                                  class="w-full rounded-xl border border-border/80 bg-background px-4 py-3 font-mono text-xs font-bold outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4 shadow-inner"
                                />
                              </div>
                            </div>

                            <div
                              class="flex gap-4 rounded-2xl border {isMath(
                                field.calculation.operation
                              )
                                ? 'bg-blue-500/[0.03] border-blue-500/20'
                                : 'bg-amber-500/[0.03] border-amber-500/20'} p-4 transition-colors"
                            >
                              <div
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl {isMath(
                                  field.calculation.operation
                                )
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-amber-500/10 text-amber-600'}"
                              >
                                <i
                                  class="fas {isMath(field.calculation.operation)
                                    ? 'fa-info-circle'
                                    : 'fa-layer-group'} text-xs"
                                ></i>
                              </div>
                              <div class="space-y-1">
                                <h4
                                  class="text-[10px] font-black uppercase tracking-widest {isMath(
                                    field.calculation.operation
                                  )
                                    ? 'text-blue-700'
                                    : 'text-amber-700'}"
                                >
                                  Panduan {isMath(field.calculation.operation)
                                    ? 'Matematika'
                                    : 'Agregasi'}
                                </h4>
                                <p class="text-[11px] leading-relaxed text-muted-foreground">
                                  {#if isMath(field.calculation.operation)}
                                    Kalkulasi dilakukan <strong>per baris</strong>. Pastikan
                                    <code>keys</code> yang dimasukkan tersedia di kolom lain dalam tabel
                                    ini.
                                  {:else}
                                    Kalkulasi dilakukan pada <strong>seluruh data</strong>. Hasil
                                    akan ditampilkan sebagai ringkasan (footer) di bawah tabel.
                                  {/if}
                                </p>
                              </div>
                            </div>
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/if}

                {#if field.type === 'select' && Array.isArray(field.options)}
                  <div
                    class="bg-amber-500/[0.02] border border-amber-500/20 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden"
                    transition:slide
                  >
                    <div class="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                    <div
                      class="flex items-center justify-between mb-5 pb-4 border-b border-amber-500/10"
                    >
                      <h3 class="text-xs font-black text-amber-600 flex items-center gap-2">
                        <i class="fas fa-list-ul"></i> Dropdown Options
                      </h3>
                      <button
                        type="button"
                        onclick={() => {
                          field.options!.push({ label: '', value: '' })
                          isDirty = true
                        }}
                        class="text-[9px] font-black uppercase bg-background border border-amber-500/30 text-amber-600 px-3 py-1.5 rounded-lg shadow-sm"
                        ><i class="fas fa-plus mr-1"></i> Add</button
                      >
                    </div>
                    <div class="space-y-2.5">
                      {#each field.options as opt, oIdx}
                        <div class="flex items-center gap-3">
                          <input
                            type="text"
                            bind:value={opt.label}
                            oninput={() => (isDirty = true)}
                            placeholder="Label UI"
                            class="flex-1 text-xs font-bold bg-background border border-border rounded-xl px-3.5 py-2 outline-none focus:border-amber-500 shadow-sm"
                          />
                          <input
                            type="text"
                            bind:value={opt.value}
                            oninput={() => (isDirty = true)}
                            placeholder="Value DB"
                            class="flex-1 text-xs font-mono bg-background border border-border rounded-xl px-3.5 py-2 outline-none focus:border-amber-500 shadow-sm"
                          />
                          <button
                            aria-label="Add"
                            type="button"
                            onclick={() => {
                              field.options!.splice(oIdx, 1)
                              isDirty = true
                            }}
                            class="w-8 h-8 flex items-center justify-center text-destructive/50 hover:text-destructive"
                            ><i class="fas fa-times"></i></button
                          >
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if field.type === 'relation'}
                  <div
                    class="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden"
                    transition:slide
                  >
                    <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                    <h3
                      class="text-xs font-black text-emerald-600 mb-5 pb-4 border-b border-emerald-500/10"
                    >
                      <i class="fas fa-link mr-2"></i> Relation Configuration
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        bind:value={field.relation_collection}
                        oninput={() => (isDirty = true)}
                        placeholder="Target Collection"
                        class="w-full text-xs font-bold border border-emerald-500/30 rounded-xl px-3.5 py-2.5 bg-background outline-none focus:border-emerald-500 shadow-sm"
                      />
                      <input
                        type="text"
                        bind:value={field.relation_key}
                        oninput={() => (isDirty = true)}
                        placeholder="Value Key (_id)"
                        class="w-full text-xs font-mono border border-emerald-500/30 rounded-xl px-3.5 py-2.5 bg-background outline-none focus:border-emerald-500 shadow-sm"
                      />
                      <input
                        type="text"
                        bind:value={field.relation_display}
                        oninput={() => (isDirty = true)}
                        placeholder="Display Key (name)"
                        class="w-full text-xs font-mono border border-emerald-500/30 rounded-xl px-3.5 py-2.5 bg-background outline-none focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                    <div class="pt-4 mt-4 border-t border-emerald-500/10">
                      <label class="flex items-center gap-2.5 cursor-pointer w-max mb-3">
                        <input
                          type="checkbox"
                          bind:checked={field.relation_enable_autopopulate}
                          onchange={() => (isDirty = true)}
                          class="w-4 h-4 rounded text-emerald-500 border-emerald-500/40 bg-background"
                        />
                        <span class="text-[10px] font-black uppercase text-emerald-700"
                          >Enable Auto-Fill (Auto Populate)</span
                        >
                      </label>
                      {#if field.relation_enable_autopopulate}
                        <input
                          type="text"
                          bind:value={field.relation_autopopulate_map}
                          oninput={() => (isDirty = true)}
                          placeholder="Format -> source_key:target_key"
                          class="w-full text-xs font-mono border border-emerald-500/30 rounded-xl px-4 py-2.5 bg-background outline-none focus:border-emerald-500"
                          transition:slide
                        />
                      {/if}
                    </div>
                  </div>
                {/if}

                {#if field.type === 'repeater'}
                  <div
                    class="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden"
                    transition:slide
                  >
                    <div
                      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-primary/10"
                    >
                      <h3 class="text-sm font-black text-foreground">
                        <i class="fas fa-table-cells-large text-primary mr-2"></i> Schema Tabel Dinamis
                      </h3>
                      <button
                        type="button"
                        onclick={() => {
                          field.sub_fields = field.sub_fields || []
                          field.sub_fields.push({
                            label: 'New Col',
                            name: 'new_col',
                            type: 'text',
                            options: [],
                            calculation: { enable_calc: false, operation: 'SUM', fields: '' },
                          })
                          isDirty = true
                        }}
                        class="bg-background border border-primary/30 text-primary px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-primary hover:text-white transition-all"
                        ><i class="fas fa-plus"></i> Tambah Kolom</button
                      >
                    </div>

                    <div class="space-y-5">
                      {#each field.sub_fields || [] as sf, sIdx}
                        <div
                          class="bg-muted/10 border border-border/80 rounded-xl p-4 relative group transition-all shadow-sm"
                        >
                          <button
                            aria-label="Hapus Kolom"
                            type="button"
                            onclick={() => {
                              field.sub_fields!.splice(sIdx, 1)
                              isDirty = true
                            }}
                            class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all z-10"
                            ><i class="fas fa-times"></i></button
                          >

                          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8 mb-3">
                            <input
                              type="text"
                              bind:value={sf.label}
                              oninput={() => (isDirty = true)}
                              placeholder="Label Kolom"
                              class="text-xs font-bold border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary w-full shadow-sm"
                            />
                            <input
                              type="text"
                              bind:value={sf.name}
                              oninput={() => (isDirty = true)}
                              placeholder="db_key"
                              class="text-xs font-mono border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary w-full shadow-sm"
                            />
                            <select
                              bind:value={sf.type}
                              onchange={() => {
                                isDirty = true
                                if (['number', 'currency'].includes(sf.type) && !sf.calculation)
                                  sf.calculation = {
                                    enable_calc: false,
                                    operation: 'SUM',
                                    fields: '',
                                  }
                                if (sf.type === 'select' && !Array.isArray(sf.options))
                                  sf.options = []
                              }}
                              class="text-xs font-bold border border-border rounded-lg px-3 py-2 bg-background outline-none focus:border-primary w-full shadow-sm"
                              ><option value="text">Text</option><option value="number"
                                >Number</option
                              ><option value="currency">Currency</option><option value="select"
                                >Select</option
                              ><option value="relation">Relation</option><option value="datetime"
                                >Datetime</option
                              ></select
                            >
                          </div>

                          <div class="pl-2 border-l-2 border-border/50">
                            {#if ['number', 'currency'].includes(sf.type) && sf.calculation}
                              <div
                                class="mt-4 p-5 bg-blue-500/[0.03] border border-blue-500/20 rounded-2xl space-y-5 shadow-inner"
                                transition:slide
                              >
                                <div
                                  class="flex items-center justify-between border-b border-blue-500/10 pb-4"
                                >
                                  <div class="flex items-center gap-2 text-blue-600">
                                    <i class="fas fa-calculator text-[10px]"></i>
                                    <span class="text-[9px] font-black uppercase tracking-widest"
                                      >Sub-Field Computation</span
                                    >
                                  </div>

                                  <div
                                    class="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
                                  >
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div class="space-y-1.5">
                                        <label
                                          for="regional-locale"
                                          class="text-[8px] font-black uppercase text-muted-foreground/80 tracking-widest"
                                          >Regional Locale</label
                                        >
                                        <select
                                          bind:value={sf.locale}
                                          onchange={() => (isDirty = true)}
                                          class="w-full text-[10px] font-bold border border-blue-500/30 rounded-xl px-3 py-2.5 bg-background outline-none focus:border-blue-500"
                                        >
                                          <option value="id-ID">Indonesia (1.234,56)</option>
                                          <option value="en-US">English US (1,234.56)</option>
                                          <option value="de-DE">German (1.234,56)</option>
                                        </select>
                                      </div>

                                      <div class="space-y-1.5">
                                        <label
                                          for="regional-format"
                                          class="text-[8px] font-black uppercase text-muted-foreground/80 tracking-widest"
                                          >Display Format</label
                                        >
                                        <select
                                          bind:value={sf.format}
                                          onchange={() => (isDirty = true)}
                                          class="w-full text-[10px] font-bold border border-blue-500/30 rounded-xl px-3 py-2.5 bg-background outline-none focus:border-blue-500"
                                        >
                                          {#if sf.type === 'currency'}
                                            <option value="IDR">IDR (Rp)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                          {:else}
                                            <option value="decimal">Desimal Standar</option>
                                            <option value="compact">Ringkas (1.2M)</option>
                                            <option value="percent">Persentase (%)</option>
                                          {/if}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  class="flex items-center justify-between border-b border-blue-500/10 pb-4"
                                >
                                  <div class="flex items-center gap-2 text-blue-600">
                                    <i class="fas fa-calculator text-[10px]"></i>
                                    <span class="text-[9px] font-black uppercase tracking-widest"
                                      >Sub-Field Computation</span
                                    >
                                  </div>
                                  <label
                                    class="flex items-center gap-2 cursor-pointer bg-background border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-sm hover:border-blue-500 transition-all active:scale-95"
                                  >
                                    <input
                                      type="checkbox"
                                      bind:checked={sf.calculation.enable_calc}
                                      onchange={() => (isDirty = true)}
                                      class="w-3.5 h-3.5 rounded text-blue-500 focus:ring-0 border-blue-500/30 cursor-pointer"
                                    />
                                    <span
                                      class="text-[8px] font-black uppercase text-blue-700 tracking-wider"
                                      >Aktifkan</span
                                    >
                                  </label>
                                </div>

                                {#if sf.calculation.enable_calc}
                                  <div
                                    class="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
                                  >
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div class="space-y-1.5">
                                        <label
                                          for="operation-mode"
                                          class="text-[8px] font-black uppercase text-muted-foreground/80 tracking-widest"
                                          >Operation Mode</label
                                        >
                                        <select
                                          bind:value={sf.calculation.operation}
                                          onchange={() => (isDirty = true)}
                                          class="w-full text-[10px] font-bold border border-blue-500/30 rounded-xl px-3 py-2.5 bg-background outline-none focus:border-blue-500 text-foreground shadow-sm"
                                        >
                                          <optgroup label="Mathematics">
                                            <option value="ADD">ADD (+)</option>
                                            <option value="SUBTRACT">SUBTRACT (-)</option>
                                            <option value="MULTIPLY">MULTIPLY (×)</option>
                                            <option value="DIVIDE">DIVIDE (÷)</option>
                                          </optgroup>
                                          <optgroup label="Aggregation">
                                            <option value="SUM">SUM (Total)</option>
                                            <option value="AVG">AVG (Rata-rata)</option>
                                          </optgroup>
                                        </select>
                                      </div>

                                      <div class="space-y-1.5">
                                        <label
                                          for="target-keys"
                                          class="text-[8px] font-black uppercase text-muted-foreground/80 tracking-widest"
                                          >Target Keys</label
                                        >
                                        <input
                                          type="text"
                                          bind:value={sf.calculation.fields}
                                          oninput={() => (isDirty = true)}
                                          placeholder="qty, price"
                                          class="w-full text-[10px] font-mono border border-blue-500/30 rounded-xl px-3 py-2.5 bg-background outline-none focus:border-blue-500 text-foreground shadow-sm"
                                        />
                                      </div>
                                    </div>

                                    <div class="md:col-span-2">
                                      <div
                                        class="p-3.5 rounded-xl border flex gap-3 transition-all duration-300
                                        {isMath(sf.calculation.operation)
                                          ? 'bg-indigo-500/[0.04] border-indigo-500/20'
                                          : 'bg-amber-500/[0.04] border-amber-500/20'}"
                                      >
                                        <i
                                          class="fas {isMath(sf.calculation.operation)
                                            ? 'fa-square-root-alt text-indigo-500'
                                            : 'fa-chart-pie text-amber-500'} text-xs pt-0.5"
                                        ></i>
                                        <div class="space-y-0.5">
                                          <p
                                            class="text-[8px] font-black uppercase tracking-widest {isMath(
                                              sf.calculation.operation
                                            )
                                              ? 'text-indigo-600'
                                              : 'text-amber-600'}"
                                          >
                                            Logic Note: {isMath(sf.calculation.operation)
                                              ? 'Baris'
                                              : 'Grup'}
                                          </p>
                                          <p
                                            class="text-[10px] text-muted-foreground leading-tight"
                                          >
                                            {#if isMath(sf.calculation.operation)}
                                              Dihitung antar kolom pada <strong
                                                >baris yang sama</strong
                                              >.
                                            {:else if isAgg(sf.calculation.operation)}
                                              Dihitung sebagai <strong>total ringkasan</strong> dari seluruh
                                              baris.
                                            {/if}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                {/if}
                              </div>
                            {/if}

                            {#if sf.type === 'select' && Array.isArray(sf.options)}
                              <div
                                class="mt-2 p-3 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl space-y-2.5"
                                transition:slide
                              >
                                <div class="flex items-center justify-between mb-2">
                                  <span
                                    class="text-[8px] font-black text-amber-600 uppercase tracking-widest"
                                    >Opsi Dropdown</span
                                  >
                                  <button
                                    type="button"
                                    onclick={() => {
                                      sf.options!.push({ label: '', value: '' })
                                      isDirty = true
                                    }}
                                    class="text-[8px] border border-amber-500/40 text-amber-600 px-2 py-1 rounded-md font-bold bg-background hover:bg-amber-500 hover:text-white transition-colors"
                                    >Add Opsi</button
                                  >
                                </div>
                                {#each sf.options as opt, oIdx}
                                  <div class="flex items-center gap-2">
                                    <input
                                      type="text"
                                      bind:value={opt.label}
                                      oninput={() => (isDirty = true)}
                                      placeholder="Label UI"
                                      class="w-1/2 text-[10px] font-bold border border-border rounded-lg px-2.5 py-1.5 bg-background"
                                    />
                                    <input
                                      type="text"
                                      bind:value={opt.value}
                                      oninput={() => (isDirty = true)}
                                      placeholder="Value DB"
                                      class="w-1/2 text-[10px] font-mono border border-border rounded-lg px-2.5 py-1.5 bg-background"
                                    />
                                    <button
                                      aria-label="isDirty"
                                      type="button"
                                      onclick={() => {
                                        sf.options!.splice(oIdx, 1)
                                        isDirty = true
                                      }}
                                      class="text-destructive/50 hover:text-destructive p-1"
                                      ><i class="fas fa-times text-[10px]"></i></button
                                    >
                                  </div>
                                {/each}
                              </div>
                            {/if}

                            {#if sf.type === 'relation'}
                              <div
                                class="mt-2 p-3.5 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-3"
                                transition:slide
                              >
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <input
                                    type="text"
                                    bind:value={sf.relation_collection}
                                    oninput={() => (isDirty = true)}
                                    placeholder="Target Collection"
                                    class="w-full text-[10px] font-bold border border-border rounded-lg px-2.5 py-1.5 bg-background shadow-sm"
                                  />
                                  <input
                                    type="text"
                                    bind:value={sf.relation_key}
                                    oninput={() => (isDirty = true)}
                                    placeholder="Value (_id)"
                                    class="w-full text-[10px] font-mono border border-border rounded-lg px-2.5 py-1.5 bg-background shadow-sm"
                                  />
                                  <input
                                    type="text"
                                    bind:value={sf.relation_display}
                                    oninput={() => (isDirty = true)}
                                    placeholder="Display (name)"
                                    class="w-full text-[10px] font-mono border border-border rounded-lg px-2.5 py-1.5 bg-background shadow-sm"
                                  />
                                </div>
                                <div class="pt-2 border-t border-emerald-500/10">
                                  <label class="flex items-center gap-2 cursor-pointer w-max mb-2">
                                    <input
                                      type="checkbox"
                                      bind:checked={sf.relation_enable_autopopulate}
                                      onchange={() => (isDirty = true)}
                                      class="w-3.5 h-3.5 rounded text-emerald-500 border-emerald-500/40 bg-background"
                                    />
                                    <span
                                      class="text-[8px] font-black uppercase text-emerald-700/80"
                                      >Auto-Fill Sub-Field</span
                                    >
                                  </label>
                                  {#if sf.relation_enable_autopopulate}
                                    <input
                                      type="text"
                                      bind:value={sf.relation_autopopulate_map}
                                      oninput={() => (isDirty = true)}
                                      placeholder="source:target, source2:target2"
                                      class="w-full text-[10px] font-mono border border-emerald-500/30 rounded-lg px-2.5 py-1.5 bg-background shadow-sm"
                                      transition:slide
                                    />
                                  {/if}
                                </div>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <div
                  class="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-3 cursor-pointer"
                      ><input
                        type="checkbox"
                        bind:checked={field.required}
                        onchange={() => (isDirty = true)}
                        class="w-4 h-4 text-primary rounded bg-background border-border focus:ring-primary/30"
                      /><span class="text-[10px] font-black uppercase text-muted-foreground"
                        >Wajib Diisi</span
                      ></label
                    >
                    <label class="flex items-center gap-3 cursor-pointer"
                      ><input
                        type="checkbox"
                        bind:checked={field.readonly}
                        onchange={() => (isDirty = true)}
                        class="w-4 h-4 text-primary rounded bg-background border-border focus:ring-primary/30"
                      /><span class="text-[10px] font-black uppercase text-muted-foreground"
                        >Hanya Baca</span
                      ></label
                    >
                    <label class="flex items-center gap-3 cursor-pointer"
                      ><input
                        type="checkbox"
                        bind:checked={field.show_up}
                        onchange={() => (isDirty = true)}
                        class="w-4 h-4 text-primary rounded bg-background border-border focus:ring-primary/30"
                      /><span class="text-[10px] font-black uppercase text-muted-foreground"
                        >Tampilkan</span
                      ></label
                    >
                  </div>
                  <div
                    class="flex items-center gap-3 bg-muted/10 border border-border/70 rounded-xl px-3 py-2"
                  >
                    <span class="text-[9px] font-black uppercase text-muted-foreground"
                      >Lebar UI</span
                    >
                    <select
                      bind:value={field.width}
                      onchange={() => (isDirty = true)}
                      class="text-[10px] font-bold bg-background border border-border rounded-lg px-2 py-1.5 outline-none min-w-[100px]"
                      ><option value="100">100%</option><option value="66">66%</option><option
                        value="50">50%</option
                      ><option value="33">33%</option></select
                    >
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <div
              class="flex-1 flex items-center justify-center p-6 text-center animate-in fade-in duration-500 hidden lg:flex bg-muted/5"
            >
              <div class="max-w-sm">
                <div
                  class="w-24 h-24 bg-card rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 border border-border/50"
                >
                  <i class="fas fa-sliders-h text-4xl text-primary/30"></i>
                </div>
                <h3 class="text-lg font-black text-foreground mb-2">Properties Inspector</h3>
                <p class="text-[11px] text-muted-foreground">
                  Pilih field di struktur panel kiri untuk mengonfigurasi properti lanjutannya.
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

{#snippet renderTree(nodes: MenuNode[], depth: number)}
  <div class="space-y-1">
    {#each nodes as node (node.id)}
      {#if dropTargetId === node.id && dropZone === 'before'}
        <div
          class="h-1 bg-primary rounded-full animate-pulse my-1 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
        ></div>
      {/if}
      <div
        role="button"
        tabindex="0"
        class="group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer relative touch-manipulation {selectedId ===
        node.id
          ? 'bg-primary/10 border-primary/30 shadow-sm'
          : 'border-transparent hover:bg-muted/50'}"
        style="margin-left: {depth * 1.25}rem"
        draggable={!node.locked}
        ondragstart={() => !node.locked && (draggedId = node.id)}
        ondragover={(e) => {
          e.preventDefault()
          if (draggedId === node.id || node.locked) return
          dropTargetId = node.id
          const r = e.currentTarget.getBoundingClientRect()
          const y = e.clientY - r.top
          if (y < r.height * 0.25) dropZone = 'before'
          else if (y > r.height * 0.75) dropZone = 'after'
          else dropZone = 'inside'
        }}
        ondrop={() => handleDrop(node.id)}
        onclick={() => (selectedId = node.id)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            selectedId = node.id
          }
        }}
      >
        <div class="flex items-center gap-3 overflow-hidden pointer-events-none">
          <i
            class="fas fa-grip-vertical opacity-20 text-[10px] group-hover:opacity-60 transition-opacity"
          ></i>
          <div
            class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center transition-colors {selectedId ===
            node.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card border border-border text-muted-foreground'}"
          >
            <i class="{node.icon} text-[10px]"></i>
          </div>
          <span
            class="text-xs font-bold truncate {selectedId === node.id
              ? 'text-foreground'
              : 'text-muted-foreground'}">{node.name}</span
          >
          {#if node.locked}<i class="fas fa-lock text-[8px] opacity-40 shrink-0"></i>{/if}
        </div>

        <div class="flex items-center gap-1 shrink-0">
          {#if !node.locked}
            <button
              aria-label="delete node"
              type="button"
              onclick={(e) => {
                e.stopPropagation()
                deleteNode(node.id)
              }}
              class="w-7 h-7 rounded-md flex items-center justify-center text-destructive/70 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all touch-manipulation"
              ><i class="fas fa-times text-[10px]"></i></button
            >
          {/if}
          {#if node.sub_sidemenu}
            <button
              aria-label="sub-sidemenu-button"
              type="button"
              class="w-7 h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors touch-manipulation"
              onclick={(e) => {
                e.stopPropagation()
                node.expanded = !node.expanded
              }}
              ><i class="fas fa-chevron-{node.expanded ? 'down' : 'right'} text-[9px] opacity-50"
              ></i></button
            >
          {/if}
        </div>
      </div>
      {#if dropTargetId === node.id && dropZone === 'after'}
        <div
          class="h-1 bg-primary rounded-full animate-pulse my-1 shadow-[0_0_5px_rgba(var(--primary),0.5)]"
        ></div>
      {/if}
      {#if node.sub_sidemenu && node.expanded}
        <div transition:slide>{@render renderTree(node.sub_sidemenu, depth + 1)}</div>
      {/if}
    {/each}
  </div>
{/snippet}
