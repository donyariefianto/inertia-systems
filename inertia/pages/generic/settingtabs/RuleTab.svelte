<script>
  import { onMount, tick } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import Drawflow from 'drawflow'
  import 'drawflow/dist/drawflow.min.css'

  let { config, closeTab } = $props()

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  let editor = $state(null)
  let isLocked = $state(true)
  let isDrawerOpen = $state(true) // Untuk Saved Rules
  let isLibraryOpen = $state(false) // Untuk Node Library di Mobile
  let searchQuery = $state('')
  let activeRuleId = $state(null)
  let selectedNodeId = $state(null)
  let selectedNodeData = $state({})
  let selectedNodeConfig = $state(null)

  $effect(() => {
    if (editor) {
      editor.editor_mode = isLocked ? 'fixed' : 'edit'
      const container = document.getElementById('drawflow-canvas')
      if (isLocked) {
        container.classList.add('is-readonly')
      } else {
        container.classList.remove('is-readonly')
      }
    }
  })

  // ==========================================
  // 2. DATA SOURCE
  // ==========================================
  const savedRules = [
    { id: 'rule_1', name: 'New User Onboarding', status: 'Active', updatedAt: '2 jam lalu' },
    { id: 'rule_2', name: 'Payment Failed Retry', status: 'Draft', updatedAt: '1 hari lalu' },
    { id: 'rule_3', name: 'Monthly Report CRON', status: 'Error', updatedAt: '3 hari lalu' },
  ]

  export const dreCategories = [
    {
      id: 'triggers',
      label: 'Start / Triggers',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      items: [
        {
          type: 'trigger_db',
          label: 'Database Event',
          icon: 'fas fa-database',
          headerColor: 'bg-emerald-600',
          desc: 'Trigger on DB mutations',
          inputs: 0,
          outputs: 1,
          fields: [
            { name: 'collection', label: 'Target Collection', type: 'text', required: true },
            {
              name: 'event_type',
              label: 'Trigger On',
              type: 'select',
              options: ['onInsert', 'onUpdate', 'onDelete'],
            },
            {
              name: 'filter',
              label: 'Condition Filter (JSON)',
              type: 'code_editor',
              height: 'h-24',
            },
          ],
        },
        {
          type: 'trigger_schedule',
          label: 'Scheduler (Cron)',
          icon: 'fas fa-clock',
          headerColor: 'bg-emerald-600',
          desc: 'Time-based trigger',
          inputs: 0,
          outputs: 1,
          fields: [
            { name: 'cron', label: 'Cron Expression', type: 'text', placeholder: '0 0 * * *' },
            {
              name: 'timezone',
              label: 'Timezone',
              type: 'select',
              options: ['UTC', 'Asia/Jakarta'],
            },
          ],
        },
      ],
    },
    {
      id: 'logic_flow',
      label: 'Flow Logic & Control',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      items: [
        {
          type: 'logic_condition',
          label: 'If / Else Condition',
          icon: 'fas fa-code-branch',
          headerColor: 'bg-amber-600',
          desc: 'Branching Logic (1: True, 2: False)',
          inputs: 1,
          outputs: 2,
          fields: [
            { name: 'variable', label: 'Variable', type: 'text' },
            {
              name: 'operator',
              label: 'Operator',
              type: 'select',
              options: ['==', '!=', '>', '<', 'Contains'],
            },
            { name: 'value', label: 'Value', type: 'text' },
          ],
        },
        {
          type: 'logic_delay',
          label: 'Sleep / Delay',
          icon: 'fas fa-hourglass-half',
          headerColor: 'bg-amber-600',
          desc: 'Pause Execution',
          inputs: 1,
          outputs: 1,
          fields: [{ name: 'duration', label: 'Duration (Seconds)', type: 'number', default: 5 }],
        },
      ],
    },
    {
      id: 'actions',
      label: 'External Actions',
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
      items: [
        {
          type: 'action_http',
          label: 'HTTP Request',
          icon: 'fas fa-globe',
          headerColor: 'bg-purple-600',
          desc: 'Call External API',
          inputs: 1,
          outputs: 1,
          fields: [
            {
              name: 'method',
              label: 'Method',
              type: 'select',
              options: ['GET', 'POST', 'PUT', 'PATCH'],
            },
            { name: 'url', label: 'URL', type: 'text' },
            { name: 'headers', label: 'Headers', type: 'code_editor', height: 'h-20' },
          ],
        },
      ],
    },
  ]

  const filteredCategories = $derived(
    dreCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  )

  // ==========================================
  // 3. INISIALISASI DRAWFLOW
  // ==========================================
  onMount(async () => {
    await tick()
    const container = document.getElementById('drawflow-canvas')
    if (!container) return

    editor = new Drawflow(container)
    editor.reroute = true
    editor.force_first_input = false
    editor.start()

    editor.on('nodeSelected', (id) => {
      selectedNodeId = id
    })

    editor.on('nodeUnselected', () => {
      selectedNodeId = null
      selectedNodeConfig = null
    })

    editor.on('contextmenu', (e) => {
      const nodeEl = e.target.closest('.drawflow-node')
      if (!nodeEl) return
      const id = nodeEl.id.replace('node-', '')
      const nodeInfo = editor.getNodeFromId(id)

      if (nodeInfo) {
        nodeEl.classList.add('selected')
        editor.node_selected = nodeEl
        selectedNodeId = id
        selectedNodeData = $state.snapshot(nodeInfo.data || {})
        selectedNodeConfig = getNodeConfig(nodeInfo.name)
      }
    })
  })

  // ==========================================
  // 4. DRAG, DROP & TAP LOGIC (Mobile Friendly)
  // ==========================================
  function handleDragStart(event, nodeData, catColor) {
    if (isLocked) {
      event.preventDefault()
      return
    }
    const payload = { ...nodeData, color: catColor }
    event.dataTransfer.setData('application/json', JSON.stringify(payload))
    event.dataTransfer.effectAllowed = 'copy'
  }

  function handleDragOver(event) {
    if (isLocked) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event) {
    if (isLocked || !editor) return
    event.preventDefault()

    try {
      const dataRaw = event.dataTransfer.getData('application/json')
      if (!dataRaw) return
      const node = JSON.parse(dataRaw)
      const rect = document.getElementById('drawflow-canvas').getBoundingClientRect()
      const x =
        (event.clientX - rect.left) *
        (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom))
      const y =
        (event.clientY - rect.top) *
        (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom))

      addNodeToCanvas(node, x, y)
    } catch (e) {
      console.error('Drop Error:', e)
    }
  }

  // Fungsi khusus Mobile: Tap to Add Node
  function handleNodeTap(node) {
    if (isLocked || !editor) return

    // Taruh di tengah layar berdasarkan zoom saat ini
    const rect = document.getElementById('drawflow-canvas').getBoundingClientRect()
    const x =
      (rect.width / 2) *
      (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom))
    const y =
      (rect.height / 2) *
      (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom))

    addNodeToCanvas(node, x, y)

    // Tutup library di mobile setelah tap
    if (window.innerWidth < 1024) isLibraryOpen = false
  }

  function addNodeToCanvas(node, x, y) {
    const html = `
      <div class="node-card w-[240px] rounded-xl border border-border bg-card shadow-xl overflow-hidden pointer-events-auto">
        <div class="px-4 py-2 flex items-center gap-2 border-b border-border ${node.headerColor || 'bg-muted/50'}">
            <i class="${node.icon} text-white text-[10px]"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-white truncate flex-1">${node.label}</span>
        </div>
        <div class="p-4 bg-card">
            <p class="line-clamp-node text-[10px] text-muted-foreground font-medium" title="${node.desc}">
            ${node.desc}
            </p>
        </div>
      </div>
    `
    editor.addNode(
      node.type,
      node.inputs ?? 1,
      node.outputs ?? 1,
      x,
      y,
      node.type,
      { ...node },
      html
    )
  }

  function getNodeConfig(type) {
    for (const cat of dreCategories) {
      const item = cat.items.find((i) => i.type === type)
      if (item) return item
    }
    return null
  }

  function updateNodeData(fieldName, value) {
    selectedNodeData[fieldName] = value
    if (selectedNodeId && editor) {
      editor.updateNodeDataFromId(selectedNodeId, $state.snapshot(selectedNodeData))
    }
  }

  function deleteCurrentNode() {
    if (selectedNodeId && editor) {
      editor.removeNodeId('node-' + selectedNodeId)
      selectedNodeId = null
      selectedNodeConfig = null
      selectedNodeData = {}
    }
  }

  function closeProperties(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    selectedNodeId = null
    selectedNodeConfig = null
    selectedNodeData = {}
    if (editor) {
      const selectedNodes = document.querySelectorAll('.drawflow-node.selected')
      selectedNodes.forEach((el) => el.classList.remove('selected'))
      editor.node_selected = null
    }
  }

  const activeRuleName = $derived(
    savedRules.find((r) => r.id === activeRuleId)?.name || 'No Rule Selected'
  )
</script>

<div
  class="flex h-full w-full overflow-hidden bg-background text-foreground font-sans relative min-w-0"
>
  <aside
    class="absolute lg:relative z-40 flex flex-col h-[calc(100%-1.5rem)] lg:h-full m-3 lg:m-0 border border-border lg:border-0 lg:border-r bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out rounded-2xl lg:rounded-none shrink-0
    {isLibraryOpen
      ? 'w-[280px] sm:w-[320px] translate-x-0 opacity-100'
      : 'w-0 -translate-x-full lg:translate-x-0 lg:w-[320px] opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}"
  >
    <div
      class="flex flex-col gap-2 border-b border-border p-4 bg-card/90 backdrop-blur rounded-t-2xl lg:rounded-none"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Node Library
        </h3>
        <button
          aria-label="node-library"
          onclick={() => (isLibraryOpen = false)}
          class="lg:hidden text-muted-foreground w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="relative flex items-center">
        <i class="fas fa-search absolute left-3 text-muted-foreground"></i>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari komponen node..."
          class="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-4 text-xs font-medium focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
      {#each filteredCategories as category}
        <div class="space-y-4">
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap"
            >
              {category.label}
            </span>
            <div class="h-px flex-1 bg-border/60"></div>
          </div>
          <div class="grid gap-2">
            {#each category.items as item}
              <div
                role="button"
                tabindex="0"
                draggable={!isLocked}
                onkeydown={() => handleNodeTap(item)}
                onclick={() => handleNodeTap(item)}
                ondragstart={(e) => handleDragStart(e, item, category.iconColor)}
                class="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 shadow-sm transition-all w-full overflow-hidden
                       {isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-grab hover:border-primary/50 hover:bg-card hover:shadow-md active:scale-95'}"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {category.iconBg} {category.iconColor}"
                >
                  <i class="{item.icon} text-base transition-transform group-hover:scale-110"></i>
                </div>
                <div class="flex flex-1 flex-col overflow-hidden min-w-0">
                  <span class="text-xs font-bold text-foreground truncate">{item.label}</span>
                  <span class="text-[10px] text-muted-foreground truncate" title={item.desc}
                    >{item.desc}</span
                  >
                </div>
                {#if !isLocked}
                  <div class="text-[9px] font-bold text-primary/50 uppercase lg:hidden">Tap</div>
                  <i
                    class="fas fa-grip-vertical ml-auto text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hidden lg:block"
                  ></i>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
          in:fade
        >
          <i class="fas fa-box-open text-4xl mb-4 opacity-20"></i>
          <p class="text-xs font-bold uppercase tracking-widest">Node tidak ditemukan</p>
        </div>
      {/each}
    </div>
  </aside>

  <main
    class="relative flex-1 bg-background h-full w-full min-w-0"
    ondragover={handleDragOver}
    ondrop={handleDrop}
  >
    <div
      class="absolute bottom-6 md:bottom-auto md:top-6 left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 flex w-[90%] md:w-auto flex-wrap justify-center items-center gap-1.5 md:gap-2.5 rounded-xl border border-border/60 bg-card/95 md:bg-card/80 p-2 md:p-1.5 shadow-2xl md:shadow-xl backdrop-blur-md z-10 transition-all"
    >
      <button
        onclick={() => editor?.zoom_in()}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Zoom In"><i class="fas fa-search-plus"></i></button
      >
      <button
        onclick={() => editor?.zoom_out()}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Zoom Out"><i class="fas fa-search-minus"></i></button
      >
      <button
        onclick={() => editor?.zoom_reset()}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Reset View"><i class="fas fa-compress-arrows-alt"></i></button
      >
      <div class="h-5 w-px bg-border mx-1"></div>

      {#if activeRuleId}
        {@const currentRule = savedRules.find((r) => r.id === activeRuleId)}
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 mr-1 max-w-[120px] md:max-w-none"
        >
          <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0"></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-primary truncate"
            >{currentRule?.name}</span
          >
        </div>
        <div class="h-5 w-px bg-border mx-1"></div>
      {/if}

      <button
        onclick={() => {
          if (!activeRuleId) {
            isDrawerOpen = true
            return
          }
          isLocked = !isLocked
        }}
        class="flex h-9 px-3 md:px-4 items-center justify-center gap-2 rounded-lg font-bold text-xs transition-colors {isLocked
          ? 'bg-warning/10 text-warning hover:bg-warning/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      >
        <i class="fas {isLocked ? 'fa-lock' : 'fa-unlock'}"></i>
        <span class="hidden sm:inline">{isLocked ? 'Read Only' : 'Edit Mode'}</span>
      </button>

      <div class="h-5 w-px bg-border mx-1"></div>
      <button
        onclick={() => editor?.clearModuleSelected()}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Clear Canvas"
        disabled={isLocked}
      >
        <i class="fas fa-eraser"></i>
      </button>
      <button
        onclick={() => (isDrawerOpen = true)}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
        title="Saved Rules"
      >
        <i class="fas fa-folder-open"></i>
      </button>
    </div>

    {#if !isLibraryOpen}
      <button
        aria-label="open-library"
        transition:fade
        onclick={() => (isLibraryOpen = true)}
        class="lg:hidden absolute right-6 bottom-24 z-30 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center active:scale-90 transition-transform"
      >
        <i class="fas fa-plus text-lg"></i>
      </button>
    {/if}

    {#if isLocked}
      <div
        class="absolute top-20 md:bottom-6 md:top-auto left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 pointer-events-none flex items-center gap-2 rounded-xl bg-warning/10 px-5 py-3 text-warning border border-warning/20 shadow-lg backdrop-blur-sm z-10 w-max"
        in:fade
      >
        <i class="fas fa-shield-alt text-lg"></i>
        <span class="text-[10px] md:text-xs font-black uppercase tracking-widest"
          >Canvas Locked</span
        >
      </div>
    {/if}

    <div
      oncontextmenu={(e) => e.preventDefault()}
      id="drawflow-canvas"
      class="h-full w-full"
      aria-label="Flowchart Editor Canvas"
      role="application"
    ></div>

    {#if isDrawerOpen}
      <div
        tabindex="0"
        role="button"
        class="absolute inset-0 bg-background/60 backdrop-blur-sm z-30"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
        onclick={() => (isDrawerOpen = false)}
        onkeydown={() => (isDrawerOpen = false)}
      ></div>

      <div
        class="absolute right-0 top-0 bottom-0 w-full md:w-[420px] border-l border-border bg-card shadow-2xl z-40 flex flex-col"
        in:fly={{ x: 420, duration: 300, opacity: 1 }}
        out:fly={{ x: 420, duration: 250, opacity: 1 }}
      >
        <div
          class="flex items-center justify-between border-b border-border p-6 bg-card/90 backdrop-blur"
        >
          <div>
            <h2 class="text-xl font-black text-foreground">Rule Repository</h2>
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Kelola otomasi sistem
            </p>
          </div>
          <button
            aria-label="Rules"
            onclick={() => (isDrawerOpen = false)}
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {#each savedRules as rule}
            <button
              onclick={() => {
                activeRuleId = rule.id
                isDrawerOpen = false
              }}
              class="relative w-full flex flex-col items-start rounded-lg border p-5 transition-all text-left overflow-hidden {activeRuleId ===
              rule.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md'
                : 'border-border bg-card hover:border-primary/50 hover:bg-muted'}"
            >
              {#if activeRuleId === rule.id}<div
                  class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"
                  in:fade
                ></div>{/if}
              <div class="flex w-full items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-foreground">{rule.name}</span>
                  {#if activeRuleId === rule.id}<i
                      class="fas fa-check-circle text-primary text-[10px]"
                      in:fly={{ y: 5 }}
                    ></i>{/if}
                </div>
                <span
                  class="rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider {rule.status ===
                  'Active'
                    ? 'bg-success/10 text-success border border-success/20'
                    : rule.status === 'Error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-muted text-muted-foreground border border-border'}"
                >
                  {rule.status}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                <i class="fas fa-clock"></i> Diperbarui {rule.updatedAt}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if selectedNodeConfig}
      <div
        role="button"
        tabindex="0"
        class="absolute inset-0 bg-background/60 backdrop-blur-sm z-30"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
        onclick={closeProperties}
        onkeydown={closeProperties}
      ></div>

      <div
        class="absolute right-0 bottom-0 md:top-0 w-full md:w-[420px] h-[75vh] md:h-full border-t md:border-t-0 md:border-l border-border bg-card shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] md:shadow-2xl z-40 flex flex-col rounded-t-3xl md:rounded-none"
        in:fly={{ y: 200, duration: 300, opacity: 1 }}
        out:fly={{ y: 200, duration: 250, opacity: 1 }}
      >
        <div class="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 md:hidden shrink-0"></div>

        <div
          class="flex items-center justify-between border-b border-border p-5 md:p-6 bg-card/90 backdrop-blur"
        >
          <div>
            <h2 class="text-xl font-black text-foreground">{selectedNodeConfig.label}</h2>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-[9px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                >ID: {selectedNodeId}</span
              >
              <span class="h-1 w-1 rounded-full bg-border"></span>
              <span class="text-[9px] font-bold text-primary uppercase tracking-widest truncate"
                >{selectedNodeConfig.desc}</span
              >
            </div>
          </div>
          <button
            onclick={closeProperties}
            aria-label="close-properties"
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
          {#if selectedNodeConfig.fields && selectedNodeConfig.fields.length > 0}
            {#each selectedNodeConfig.fields as field}
              <div class="flex flex-col gap-2.5">
                <label for="code-editor" class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80"
                  >
                    {field.label}
                    {#if field.required}<span class="text-destructive ml-0.5">*</span>{/if}
                  </span>
                  {#if field.type === 'code_editor'}<span
                      class="text-[8px] font-bold text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10"
                      >Script Mode</span
                    >{/if}
                </label>

                {#if field.type === 'select'}
                  <div class="relative group">
                    <select
                      value={selectedNodeData[field.name] || ''}
                      onchange={(e) => updateNodeData(field.name, e.target.value)}
                      class="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-xs font-semibold text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-sm hover:border-primary/40"
                    >
                      <option value="" disabled>Pilih opsi...</option>
                      {#each field.options as opt}<option value={opt}>{opt}</option>{/each}
                    </select>
                    <i
                      class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none group-hover:text-primary transition-colors"
                    ></i>
                  </div>
                {:else if field.type === 'code_editor'}
                  <div
                    class="rounded-lg border border-input bg-[#0f111a] p-1.5 shadow-2xl relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                  >
                    <textarea
                      value={selectedNodeData[field.name] || ''}
                      oninput={(e) => updateNodeData(field.name, e.target.value)}
                      placeholder={field.placeholder || '// Tulis logika di sini...'}
                      class="w-full bg-transparent p-4 text-[11px] font-mono text-emerald-400 focus:outline-none resize-none {field.height ||
                        'h-32'} custom-scrollbar"
                      spellcheck="false"
                    ></textarea>
                  </div>
                {:else}
                  <div class="relative group">
                    {#if field.prefix}<div
                        class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-border/50"
                      >
                        <span class="text-[10px] font-black text-muted-foreground/60"
                          >{field.prefix}</span
                        >
                      </div>{/if}
                    <input
                      type={field.type || 'text'}
                      value={selectedNodeData[field.name] || ''}
                      oninput={(e) => updateNodeData(field.name, e.target.value)}
                      placeholder={field.placeholder || ''}
                      class="w-full rounded-xl border border-input bg-background {field.prefix
                        ? 'pl-20'
                        : 'px-4'} py-3 text-xs font-semibold text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm hover:border-primary/40"
                    />
                  </div>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="flex flex-col items-center justify-center h-48 text-center space-y-4">
              <div
                class="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/30 border border-dashed border-border"
              >
                <i class="fas fa-cog text-2xl animate-spin-slow"></i>
              </div>
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Static Node
                </p>
                <p class="text-[10px] text-muted-foreground/60">Tidak ada parameter konfigurasi.</p>
              </div>
            </div>
          {/if}
        </div>
        <div
          class="p-5 md:p-6 border-t border-border bg-card/80 backdrop-blur-md space-y-3 shrink-0"
        >
          <button
            type="button"
            onclick={deleteCurrentNode}
            class="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm active:scale-95"
          >
            <i class="fas fa-trash-alt text-xs"></i> Delete Component
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  /* =========================================================
     1. CANVAS & GRID SYSTEM
     ========================================================= */
  #drawflow-canvas {
    width: 100%;
    height: 100%;
    position: relative;
    /* PENTING UNTUK MOBILE: Mencegah scroll browser saat drag di HP */
    touch-action: none;
    background-image: radial-gradient(var(--color-border) 1px, transparent 1px);
    background-size: 24px 24px;
    background-color: var(--color-background);
  }

  /* =========================================================
     2. NODE CONTAINER RESET
     ========================================================= */
  :global(.drawflow .drawflow-node) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    width: auto !important;
    min-width: 240px;
    z-index: 2;
  }

  :global(.drawflow .drawflow-node.selected .node-card) {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }

  /* Touch Target Lebih Besar di Mobile */
  @media (max-width: 768px) {
    :global(.drawflow .drawflow-node) {
      padding: 10px !important;
    }
  }

  /* =========================================================
     3. MULTIPLE PORTS ALIGNMENT (Precision Positioning)
     ========================================================= */
  :global(.drawflow .drawflow-node .inputs),
  :global(.drawflow .drawflow-node .outputs) {
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-around !important;
    height: 100% !important;
    position: absolute !important;
    top: 0 !important;
    padding: 10px 0 !important;
    gap: 10px !important;
  }

  :global(.drawflow .drawflow-node .inputs) {
    left: 0 !important;
  }
  :global(.drawflow .drawflow-node .outputs) {
    right: 0 !important;
  }

  :global(.drawflow .drawflow-node .input),
  :global(.drawflow .drawflow-node .output) {
    width: 16px !important;
    height: 16px !important;
    background: var(--color-card) !important;
    border: 3px solid var(--color-primary) !important;
    position: relative !important;
    z-index: 10 !important;
    margin: 0 !important;
    border-radius: 50% !important;
    cursor: crosshair !important;
    transition: all 0.2s ease;
  }

  :global(.drawflow .drawflow-node .input) {
    left: -18px !important;
  }
  :global(.drawflow .drawflow-node .output) {
    right: -5px !important;
  }
  :global(.drawflow-node .drawflow-delete) {
    display: none !important;
  }

  /* =========================================================
     4. LINE CLAMP & TEXT TRUNCATION
     ========================================================= */
  :global(.line-clamp-node) {
    line-clamp: 2 !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    word-break: break-word !important;
    min-height: 2.4em;
    line-height: 1.2em;
  }

  /* =========================================================
     5. CONNECTIONS (Cables)
     ========================================================= */
  :global(.drawflow .connection .main-path) {
    stroke: var(--color-primary) !important;
    stroke-width: 3px !important;
    stroke-linecap: round;
  }

  /* Garis lebih tebal di HP agar mudah disentuh */
  @media (max-width: 768px) {
    :global(.drawflow .connection .main-path) {
      stroke-width: 4px !important;
    }
  }

  :global(.drawflow .point) {
    stroke: var(--color-primary) !important;
    stroke-width: 2px !important;
    fill: var(--color-card) !important;
  }

  /* Readonly State */
  :global(#drawflow-canvas.is-readonly) {
    cursor: not-allowed !important;
  }
  :global(#drawflow-canvas.is-readonly .connection) {
    opacity: 0.5;
  }
  :global(#drawflow-canvas.is-readonly .drawflow-node) {
    cursor: not-allowed !important;
  }
</style>
