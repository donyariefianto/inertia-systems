<script lang="ts">
 import { page } from '@inertiajs/svelte'
 import { slide, fade } from 'svelte/transition'
 import { EncryptionService } from '~/stores/encryption'

 // --- 1. TYPES ---
 type FieldConfig = {
  name: string
  label: string
  type: string
  required?: boolean
  unique?: boolean
  readonly?: boolean
  width?: string
  options?: string[]
  relation_collection?: string
  relation_key?: string
  relation_display?: string
  relation_enable_autopopulate?: boolean
  relation_autopopulate_map?: string
  sub_fields?: any[]
  _isCollapsed?: boolean
 }

 type MenuNode = {
  id: string
  name: string
  icon: string
  type?: string
  path?: string
  locked?: boolean
  permissions?: string[]
  sub_sidemenu?: MenuNode[]
  expanded?: boolean
  config?: {
   endpoint?: string
   collectionName?: string
   fields?: FieldConfig[]
  }
 }

 // --- 2. STATE ---
 let { menuTree = $bindable([]) } = $props()
 let selectedId = $state<string | null>(null)
 let isDirty = $state(false)
 let isTableConfigOpen = $state(false)

 // Drag & Drop
 let draggedId = $state<string | null>(null)
 let dropTargetId = $state<string | null>(null)
 let dropZone = $state<'before' | 'inside' | 'after' | null>(null)

 // --- 3. INIT (DECRYPTION) ---
 $effect(() => {
  const sidebar = $page.props.sidebar as any
  if (sidebar?.ciphertext && sidebar?.nonce && menuTree.length === 0) {
   try {
    const decryptedRaw = EncryptionService.decrypt(sidebar.nonce, sidebar.ciphertext)
    const data = typeof decryptedRaw === 'string' ? JSON.parse(decryptedRaw) : decryptedRaw
    const rawMenu = data.sidemenu || data
    menuTree = processInitialData(rawMenu)
   } catch (e) {
    console.error('Initialization failed', e)
   }
  }
 })

 // --- 4. RECURSIVE ENGINE ---
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
   const found = removeNode(nodes[i].sub_sidemenu ?? [], id)
   if (found) return found
  }
  return null
 }
 const activeItem = $derived(selectedId ? findNode(menuTree, selectedId) : null)

 // --- 5. ACTION HANDLERS ---
 function addTemplateItem(type: 'group' | 'tableview') {
  const newNode: MenuNode = {
   id: 'node_' + Math.random().toString(36).substring(2, 9),
   name: type === 'tableview' ? 'New Collections' : 'New Folder',
   icon: type === 'tableview' ? 'fas fa-table' : 'fas fa-folder',
   type: type,
   path: type === 'tableview' ? 'new-collections' : 'new-folder',
   sub_sidemenu: type === 'group' ? [] : undefined,
   config: type === 'tableview' ? { endpoint: '', collectionName: '', fields: [] } : undefined,
  }

  if (type === 'tableview') {
   const parent = selectedId ? findNode(menuTree, selectedId) : null
   if (!parent || parent.type !== 'group') {
    alert("⚠️ WAJIB: Silakan pilih 'Folder/Group' di sidebar sebagai parent terlebih dahulu!")
    return
   }

   if (parent.locked) {
    alert('⚠️ AKSES DITOLAK: Tidak dapat menambah table ke dalam Group Sistem yang dikunci.')
    return
   }
   parent.sub_sidemenu = parent.sub_sidemenu ?? []
   parent.sub_sidemenu.push(newNode)
   parent.expanded = true
  } else {
   if (menuTree.length > 1) {
    menuTree.splice(menuTree.length - 1, 0, newNode)
   } else {
    menuTree.push(newNode)
   }
  }

  selectedId = newNode.id
  isDirty = true
 }
 function deleteNode(id: string) {
  const node = findNode(menuTree, id)
  if (node?.locked) {
   alert('Node ini dikunci oleh sistem dan tidak dapat dihapus.')
   return
  }

  if (
   confirm(
    `Apakah Anda yakin ingin menghapus "${node?.name}"? Semua sub-menu di dalamnya juga akan terhapus.`
   )
  ) {
   removeNode(menuTree, id)
   if (selectedId === id) selectedId = null
   isDirty = true
  }
 }
 function handleDrop(targetId: string) {
  if (!draggedId || draggedId === targetId) return
  const movingNode = removeNode(menuTree, draggedId)
  if (!movingNode) return

  const insert = (items: MenuNode[]) => {
   for (let i = 0; i < items.length; i++) {
    if (items[i].id === targetId) {
     return true
    }
    if (items[i].sub_sidemenu && insert(items[i].sub_sidemenu ?? [])) return true
   }
   return false
  }
  insert(menuTree)
  isDirty = true
  draggedId = null
  dropTargetId = null
  dropZone = null
 }
 function addField() {
  if (activeItem?.config) {
   activeItem.config.fields = activeItem.config.fields || []
   activeItem.config.fields.push({
    name: 'new_field',
    label: 'New Field',
    type: 'text',
    _isCollapsed: true,
   })
   isDirty = true
  }
 }
 function moveField(idx: number, dir: number) {
  if (activeItem?.config?.fields) {
   const f = activeItem.config.fields
   if (idx + dir < 0 || idx + dir >= f.length) return
   ;[f[idx], f[idx + dir]] = [f[idx + dir], f[idx]] // Destructuring swap
   isDirty = true
  }
 }
 function processInitialData(nodes: MenuNode[]): MenuNode[] {
  return nodes.map((node) => {
   if (node.id && String(node.id).includes('fixed')) {
    node.locked = true
   }
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
</script>

<div
 class="relative overflow-hidden flex h-full w-full flex-col bg-background text-foreground overflow-hidden font-sans border border-border/50 rounded-lg shadow-sm"
>
 <div
  class="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-hidden min-h-0 bg-muted/5"
 >
  <div
   class="w-full lg:w-1/3 xl:w-1/4 h-[40%] lg:h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
  >
   <div class="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
    <span class="text-xs font-bold uppercase opacity-50 flex items-center gap-2"
     ><i class="fas fa-sitemap"></i> Structure {isDirty ? '(Unsaved Changes)' : ''}</span
    >
    <div class="flex gap-2">
     <button
      onclick={() => addTemplateItem('tableview')}
      class="text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1
            {activeItem?.type === 'group' && !activeItem.locked
       ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white'
       : 'bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed'}"
      title={activeItem?.type !== 'group'
       ? 'Pilih Group dulu'
       : 'Tambah Table ke ' + activeItem.name}
     >
      <i class="fas fa-plus"></i> Table
     </button>

     <button
      onclick={() => addTemplateItem('group')}
      class="text-[10px] font-bold bg-muted text-foreground px-3 py-1.5 rounded-lg border border-transparent hover:border-border shadow-sm flex items-center gap-1 transition-all"
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
   class="flex-1 flex flex-col bg-card rounded-2xl min-h-[50%] lg:min-h-0 border-border overflow-hidden shadow-sm"
  >
   <div class="p-4 border-b border-border bg-muted/30 shrink-0 flex justify-between items-center">
    <span class="text-xs font-bold uppercase opacity-50 flex items-center gap-2"
     ><i class="fas fa-sliders-h"> </i> Node Properties</span
    >
    {#if activeItem && !activeItem.locked}
     <button
      onclick={() => deleteNode(activeItem.id)}
      class="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
     >
      <i class="fas fa-trash-alt"></i> Delete Node
     </button>
    {/if}
   </div>

   <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
    {#if activeItem}
     <div class="space-y-8" in:fade>
      <div class="space-y-4">
       <label for="label-name" class="block text-[10px] font-black uppercase opacity-40"
        >Label Name</label
       >
       <input
        type="text"
        disabled={activeItem.locked}
        bind:value={activeItem.name}
        oninput={() => (isDirty = true)}
        class="disabled w-full px-4 py-3 bg-background border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
       />
       {#if activeItem.type !== 'group'}
        <label for="label-name" class="block text-[10px] font-black uppercase opacity-40"
         >Path</label
        >
        <input
         type="text"
         disabled={activeItem.locked}
         bind:value={activeItem.path}
         oninput={() => (isDirty = true)}
         class="disabled w-full px-4 py-3 bg-background border border-border rounded-xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
       {/if}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
       <div class="space-y-4">
        <label for="icon-identity" class="block text-[10px] font-black uppercase opacity-40"
         >Icon Identity</label
        >
        <div class="flex items-center gap-3">
         <div
          class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border"
         >
          <i class="{activeItem.icon} text-lg"></i>
         </div>
         <input
          disabled={activeItem.locked}
          type="text"
          bind:value={activeItem.icon}
          oninput={() => (isDirty = true)}
          class="flex-1 px-4 py-3 bg-background border border-border rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none"
         />
        </div>
       </div>
       <div class="space-y-4">
        <label for="type-identifier" class="block text-[10px] font-black uppercase opacity-40"
         >Type Identifier</label
        >
        <div
         class="px-4 py-3 bg-muted/50 border border-border rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground"
        >
         {activeItem.type || 'Undefined'}
        </div>
       </div>
      </div>

      {#if activeItem.type === 'tableview'}
       <div
        class="p-8 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5 text-center transition-all hover:bg-primary/10"
       >
        <i class="fas fa-database text-3xl text-primary mb-4"></i>
        <h3 class="text-lg font-black mb-2">Schema Configurator</h3>
        <p class="text-xs text-muted-foreground mb-6">
         Kelola struktur database dan field untuk modul ini.
        </p>
        <button
         disabled={activeItem.locked}
         onclick={() => (isTableConfigOpen = true)}
         class="w-full sm:w-auto px-6 py-2.5 md:px-8 md:py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto text-xs md:text-sm"
        >
         <i class="fas fa-code-branch"></i> Buka Editor Schema
        </button>
       </div>
      {/if}
     </div>
    {:else}
     <div class="h-full flex flex-col items-center justify-center opacity-20 text-center">
      <i class="fas fa-mouse-pointer text-4xl mb-4 animate-bounce"></i>
      <p class="font-bold uppercase tracking-widest">Pilih node untuk melihat properti</p>
     </div>
    {/if}
   </div>
  </div>
 </div>

 {#if isTableConfigOpen && activeItem?.config}
  <div
   class="absolute inset-0 bg-background flex flex-col overflow-y-auto custom-scrollbar"
   transition:slide={{ axis: 'y', duration: 300 }}
  >
   <div
    class="shrink-0 bg-card border-b border-border p-3 md:px-6 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
   >
    <div class="flex items-center gap-4">
     <button
      aria-label="Close Table Config"
      onclick={() => (isTableConfigOpen = false)}
      class="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-all"
     >
      <i class="fas fa-arrow-left"></i>
     </button>
     <h2 class="text-lg font-black">
      Data Schema: <span class="text-primary">{activeItem.name}</span>
     </h2>
    </div>
    <button
     onclick={() => (isTableConfigOpen = false)}
     class="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg uppercase text-[10px] tracking-widest"
    >
     Selesai
    </button>
   </div>

   <div
    class="shrink-0 bg-muted/30 border-b border-border p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
   >
    <div class="space-y-2">
     <label for="API Endpoint" class="text-[10px] font-black uppercase opacity-50"
      >API Endpoint</label
     >
     <input
      type="text"
      bind:value={activeItem.config.endpoint}
      oninput={() => (isDirty = true)}
      class="w-full px-4 py-2 bg-background border border-border rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary/50 outline-none"
     />
    </div>
    <div class="space-y-2">
     <label for="Collection Name" class="text-[10px] font-black uppercase opacity-50"
      >Collection Name</label
     >
     <input
      type="text"
      bind:value={activeItem.config.collectionName}
      oninput={() => (isDirty = true)}
      class="w-full px-4 py-2 bg-background border border-border rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary/50 outline-none"
     />
    </div>
   </div>

   <div
    class="w-full shrink-0 px-6 py-3 border-b border-border flex justify-between items-center bg-card"
   >
    <span class="text-[10px] font-black uppercase opacity-50"
     >{activeItem.config.fields?.length || 0} Fields Configured</span
    >
    <button
     onclick={addField}
     class="px-5 py-2 bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg text-[10px] font-black uppercase flex items-center gap-2"
    >
     <i class="fas fa-plus"></i> Tambah Field
    </button>
   </div>

   <div class="flex-1 min-h-0 p-1 md:p-10 bg-background/50 custom-scrollbar">
    <!-- <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-32"> -->
    <div
     class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0 pb-20 md:pb-32"
    >
     {#each activeItem.config.fields || [] as field, idx}
      <div
       class="bg-card border {field.type === 'repeater'
        ? 'border-primary/50 ring-1 ring-primary/20'
        : 'border-border'} rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all flex flex-col group relative overflow-hidden h-fit animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
       <div
        class="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-muted/30 border-b {field.type ===
        'repeater'
         ? 'border-primary/20'
         : 'border-border'} select-none shrink-0 w-full"
       >
        <div class="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
         <button
          aria-label="repeater"
          onclick={() => {
           field._isCollapsed = !field._isCollapsed
           isDirty = true
          }}
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground transition-all active:scale-90"
         >
          <i
           class="fas fa-chevron-down transition-transform duration-300 {field._isCollapsed
            ? '-rotate-90'
            : 'rotate-0'}"
          ></i>
         </button>

         <div
          class="w-6 h-6 bg-background rounded text-[10px] font-bold flex items-center justify-center text-foreground shrink-0 shadow-inner border border-border"
         >
          {idx + 1}
         </div>

         <div class="flex-1 min-w-0">
          <input
           type="text"
           bind:value={field.label}
           oninput={() => (isDirty = true)}
           class="bg-transparent font-bold text-sm text-foreground w-full outline-none focus:text-primary placeholder-muted-foreground truncate transition-colors"
           placeholder="Label Field (Cth: Nama)"
          />
         </div>
        </div>

        <div
         class="flex items-center gap-1 mt-2 sm:mt-0 self-end sm:self-auto bg-background/50 sm:bg-transparent p-1 sm:p-0 rounded-lg sm:rounded-none"
        >
         <button
          onclick={() => moveField(idx, -1)}
          disabled={idx === 0}
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Naik"><i class="fas fa-arrow-up text-[10px]"></i></button
         >
         <button
          onclick={() => moveField(idx, 1)}
          disabled={idx === (activeItem.config?.fields?.length || 0) - 1}
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Turun"><i class="fas fa-arrow-down text-[10px]"></i></button
         >
         <div class="w-px h-4 bg-border mx-1"></div>
         <button
          type="button"
          onclick={() => {
           if (activeItem?.config?.fields) {
            // Menggunakan structuredClone (lebih modern) atau JSON.parse untuk deep copy
            const clone = JSON.parse(JSON.stringify(field))
            activeItem.config.fields.splice(idx + 1, 0, clone)
            isDirty = true
           }
          }}
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          title="Duplikat"
         >
          <i class="fas fa-copy text-[10px]"></i>
         </button>

         <button
          type="button"
          onclick={() => {
           if (activeItem?.config?.fields) {
            activeItem.config.fields.splice(idx, 1)
            isDirty = true
           }
          }}
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
          title="Hapus"
         >
          <i class="fas fa-trash text-[10px]"></i>
         </button>
        </div>
       </div>

       {#if !field._isCollapsed}
        <div class="p-5 bg-card shrink-0 space-y-5" transition:slide>
         <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-7 space-y-1.5">
           <label
            for="field-type-{idx}"
            class="block text-[9px] font-black text-muted-foreground uppercase">Data Type</label
           >
           <div class="relative">
            <select
             bind:value={field.type}
             onchange={() => (isDirty = true)}
             class="w-full pl-3 pr-8 py-2.5 border border-input rounded-lg text-xs bg-background focus:ring-1 focus:ring-primary/50 outline-none appearance-none font-bold text-foreground transition-all shadow-sm"
            >
             <option value="text">Text (Singkat)</option>
             <option value="number">Number (Angka)</option>
             <option value="currency">Currency (Uang)</option>
             <option value="datetime">Datetime (Tgl & Jam)</option>
             <option value="select">Select (Dropdown)</option>
             <option value="relation">Relation (Lookup)</option>
             <option value="repeater">Repeater (Tabel)</option>
             <option value="textarea">Textarea (Paragraf)</option>
             <option value="image">Image (Upload)</option>
             <option value="boolean">Boolean (Switch)</option>
             <option value="icon">Icon (Select Icon)</option>
            </select>
            <div
             class="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground"
            >
             <i class="fas fa-chevron-down text-[10px]"></i>
            </div>
           </div>
          </div>
          <div class="md:col-span-5 space-y-1.5">
           <label
            for="field-name-{idx}"
            class="block text-[9px] font-black text-muted-foreground uppercase">Database Key</label
           >
           <input
            type="text"
            bind:value={field.name}
            oninput={() => (isDirty = true)}
            class="w-full px-3 py-2.5 border border-input rounded-lg text-xs font-mono bg-amber-500/5 focus:bg-background focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-sm text-foreground"
            placeholder="db_column_name"
           />
          </div>
         </div>

         {#if field.type === 'select'}
          <div
           class="bg-muted/30 p-4 rounded-xl border border-border space-y-3 animate-in slide-in-from-top-2"
          >
           <div class="flex justify-between items-center">
            <label
             for="field-options-{idx}"
             class="block text-[10px] font-bold text-foreground uppercase"
             ><i class="fas fa-list-ul mr-1"></i> Static Options</label
            >
            <span
             class="text-[9px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border"
             >Pisahkan dengan koma</span
            >
           </div>
           <textarea
            value={(field.options || []).join(', ')}
            oninput={(e) => {
             field.options = e.currentTarget.value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s)
             isDirty = true
            }}
            rows="2"
            class="w-full px-4 py-3 border border-input rounded-lg text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-muted-foreground bg-background transition-all"
            placeholder="Pcs, Box, Pack"
           ></textarea>
          </div>
         {/if}

         {#if field.type === 'relation'}
          <div
           class="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 space-y-4 animate-in slide-in-from-top-2"
          >
           <div class="flex items-center gap-2 text-indigo-500 border-b border-indigo-500/20 pb-2">
            <i class="fas fa-link"></i>
            <span class="text-[10px] font-black uppercase tracking-widest">Relationship Config</span
            >
           </div>

           <input
            type="text"
            bind:value={field.relation_collection}
            oninput={() => (isDirty = true)}
            class="w-full px-4 py-2.5 border border-indigo-500/20 rounded-lg text-xs bg-background outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-foreground"
            placeholder="Nama Target Collection"
           />

           <div class="grid grid-cols-2 gap-3">
            <input
             type="text"
             bind:value={field.relation_key}
             oninput={() => (isDirty = true)}
             class="w-full px-4 py-2.5 border border-indigo-500/20 rounded-lg text-xs bg-background outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
             placeholder="Key Relasi (_id)"
            />
            <input
             type="text"
             bind:value={field.relation_display}
             oninput={() => (isDirty = true)}
             class="w-full px-4 py-2.5 border border-indigo-500/20 rounded-lg text-xs bg-background outline-none focus:ring-1 focus:ring-indigo-500/50"
             placeholder="Display Label (name)"
            />
           </div>

           <div class="pt-2">
            <label class="flex items-center gap-2 cursor-pointer select-none group/rel">
             <input
              type="checkbox"
              bind:checked={field.relation_enable_autopopulate}
              onchange={() => (isDirty = true)}
              class="rounded text-indigo-500 focus:ring-indigo-500 w-4 h-4 border-indigo-500/30 bg-background transition-colors"
             />
             <span
              class="text-[10px] font-bold text-indigo-500/70 group-hover/rel:text-indigo-500 uppercase transition-colors"
              >Enable Auto-Fill Data</span
             >
            </label>

            {#if field.relation_enable_autopopulate}
             <div class="mt-3" transition:slide>
              <input
               type="text"
               bind:value={field.relation_autopopulate_map}
               oninput={() => (isDirty = true)}
               class="w-full px-4 py-2.5 border border-indigo-500/30 rounded-lg text-xs font-mono bg-background outline-none"
               placeholder="source_field:target_field, ..."
              />
             </div>
            {/if}
           </div>
          </div>
         {/if}

         {#if field.type === 'repeater'}
          <div
           class="bg-card border-2 border-dashed border-primary/30 rounded-xl overflow-hidden animate-in slide-in-from-top-2"
          >
           <div
            class="flex justify-between items-center p-3 bg-primary/5 border-b border-primary/20"
           >
            <div class="flex items-center gap-2 text-primary">
             <i class="fas fa-table"></i><span
              class="text-[10px] font-black uppercase tracking-widest"
              >Kolom Tabel (Sub-Fields)</span
             >
            </div>
            <button
             onclick={() => {
              field.sub_fields = field.sub_fields || []
              field.sub_fields.push({
               name: '',
               label: '',
               type: 'text',
              })
              isDirty = true
             }}
             class="text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg shadow-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
            >
             <i class="fas fa-plus"></i> Add Col
            </button>
           </div>

           <div class="p-3 bg-muted/10 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {#if !field.sub_fields || field.sub_fields.length === 0}
             <p class="text-center text-muted-foreground text-[10px] italic py-6">
              Belum ada kolom. Klik "Add Col" untuk menambah.
             </p>
            {:else}
             {#each field.sub_fields as sf, sIdx}
              <div
               class="flex items-center gap-2 bg-background p-2 rounded-lg border border-border shadow-sm group/sf"
              >
               <input
                type="text"
                bind:value={sf.label}
                oninput={() => (isDirty = true)}
                class="w-1/3 text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-2 py-1 text-foreground transition-colors"
                placeholder="Label"
               />
               <input
                type="text"
                bind:value={sf.name}
                oninput={() => (isDirty = true)}
                class="w-1/3 text-xs font-mono bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-2 py-1 text-foreground transition-colors"
                placeholder="db_key"
               />
               <select
                bind:value={sf.type}
                onchange={() => (isDirty = true)}
                class="w-1/3 text-xs bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-2 py-1 text-foreground transition-colors"
               >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
               </select>
               <button
                aria-label="subfields"
                onclick={() => {
                 field.sub_fields = field.sub_fields ?? []
                 field.sub_fields.splice(sIdx, 1)
                 isDirty = true
                }}
                class="text-red-500 opacity-30 hover:opacity-100 hover:bg-red-500/10 p-1.5 rounded transition-all"
               >
                <i class="fas fa-trash text-[10px]"></i>
               </button>
              </div>
             {/each}
            {/if}
           </div>
          </div>
         {/if}

         <div class="flex flex-wrap items-center gap-5 pt-5 mt-2 border-t border-border">
          <label class="flex items-center gap-2 cursor-pointer select-none group/chk">
           <input
            type="checkbox"
            bind:checked={field.required}
            onchange={() => (isDirty = true)}
            class="rounded text-primary focus:ring-primary w-4 h-4 border-input bg-background transition-colors"
           />
           <span
            class="text-[10px] font-bold text-muted-foreground group-hover/chk:text-foreground uppercase transition-colors"
            >Required</span
           >
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none group/chk">
           <input
            type="checkbox"
            bind:checked={field.readonly}
            onchange={() => (isDirty = true)}
            class="rounded text-primary focus:ring-primary w-4 h-4 border-input bg-background transition-colors"
           />
           <span
            class="text-[10px] font-bold text-muted-foreground group-hover/chk:text-foreground uppercase transition-colors"
            >Read Only</span
           >
          </label>

          <div class="ml-auto flex items-center gap-3">
           <span class="text-[9px] font-black text-muted-foreground uppercase tracking-widest"
            >Width:</span
           >
           <select
            bind:value={field.width}
            onchange={() => (isDirty = true)}
            class="text-[10px] font-bold border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground"
           >
            <option value="50">50% (Half)</option>
            <option value="100">100% (Full)</option>
            <option value="33">33% (One Third)</option>
            <option value="66">66% (Two Thirds)</option>
           </select>
          </div>
         </div>
        </div>
       {/if}
      </div>
     {/each}
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
    class="group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer relative
            {selectedId === node.id
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
      class="w-7 h-7 rounded-lg {selectedId === node.id
       ? 'bg-primary text-primary-foreground'
       : 'bg-card border border-border text-muted-foreground'} flex items-center justify-center transition-colors"
     >
      <i class="{node.icon} text-[10px]"></i>
     </div>
     <span
      class="text-xs font-bold truncate {selectedId === node.id
       ? 'text-foreground'
       : 'text-muted-foreground'}"
     >
      {node.name}
     </span>
     {#if node.locked}
      <i class="fas fa-lock text-[8px] opacity-40"></i>
     {/if}
    </div>
    <div class="flex items-center gap-1">
     {#if !node.locked}
      <button
       type="button"
       onclick={(e) => {
        e.stopPropagation()
        deleteNode(node.id)
       }}
       class="w-6 h-6 rounded flex items-center justify-center text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-50 hover:opacity-100 hover:bg-red-500/10 transition-all"
       aria-label="Delete node"
      >
       <i class="fas fa-times text-[10px]"></i>
      </button>
     {/if}

     {#if node.sub_sidemenu}
      <button
       type="button"
       class="w-6 h-6 flex items-center justify-center hover:bg-background rounded transition-colors"
       onclick={(e) => {
        e.stopPropagation()
        node.expanded = !node.expanded
       }}
       aria-expanded={node.expanded}
       aria-label="Toggle submenu"
      >
       <i class="fas fa-chevron-{node.expanded ? 'down' : 'right'} text-[8px] opacity-40"></i>
      </button>
     {/if}
    </div>
   </div>
   {#if dropTargetId === node.id && dropZone === 'after'}
    <div
     class="h-1 bg-color-primary rounded-full animate-pulse my-1 shadow-[0_0_5px_rgba(var(--color-primary),0.5)]"
    ></div>
   {/if}
   {#if node.sub_sidemenu && node.expanded}
    <div transition:slide>{@render renderTree(node.sub_sidemenu, depth + 1)}</div>
   {/if}
  {/each}
 </div>
{/snippet}
