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
  let isDrawerOpen = $state(true)
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
            {
              name: 'collection',
              label: 'Target Collection',
              type: 'text',
              placeholder: 'e.g. transactions',
              required: true,
            },
            {
              name: 'event_type',
              label: 'Trigger On',
              type: 'select',
              options: ['onInsert (New Record)', 'onUpdate (Modification)', 'onDelete (Removal)'],
            },
            {
              name: 'filter',
              label: 'Condition Filter (JSON)',
              type: 'code_editor',
              height: 'h-24',
              placeholder: '{ "status": "pending" }',
            },
          ],
        },
        {
          type: 'trigger_webhook',
          label: 'Webhook Listener',
          icon: 'fas fa-satellite-dish',
          headerColor: 'bg-emerald-600',
          desc: 'External HTTP Trigger',
          inputs: 0,
          outputs: 1,
          fields: [
            { name: 'route', label: 'Endpoint Route', type: 'text', prefix: '/api/hooks/' },
            {
              name: 'method',
              label: 'HTTP Method',
              type: 'select',
              options: ['POST', 'GET', 'PUT', 'DELETE'],
            },
            {
              name: 'auth_token',
              label: 'Require Auth Token',
              type: 'text',
              placeholder: 'Optional: Secret Key',
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
              options: ['UTC', 'Asia/Jakarta', 'America/New_York'],
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
          type: 'logic_switch',
          label: 'Switch Case',
          icon: 'fas fa-list-ul',
          headerColor: 'bg-amber-600',
          desc: 'Multi-way Branching',
          inputs: 1,
          outputs: 1, // Akan diupdate dinamis
          fields: [
            { name: 'variable', label: 'Variable', type: 'text' },
            {
              name: 'cases',
              label: 'Cases List',
              type: 'dynamic_list', // Tipe baru kita
            },
          ],
        },
        {
          type: 'logic_condition',
          label: 'If / Else Condition',
          icon: 'fas fa-code-branch',
          headerColor: 'bg-amber-600',
          desc: 'Branching Logic (1: True, 2: False)',
          inputs: 1,
          outputs: 2,
          fields: [
            { name: 'variable', label: 'Variable', type: 'text', placeholder: 'data.amount' },
            {
              name: 'operator',
              label: 'Operator',
              type: 'select',
              options: ['==', '!=', '>', '<', 'Contains', 'Matches Regex'],
            },
            { name: 'value', label: 'Value', type: 'text' },
          ],
        },
        {
          type: 'logic_iterator',
          label: 'Loop / Iterator',
          icon: 'fas fa-sync',
          headerColor: 'bg-amber-600',
          desc: 'Process Array Items',
          inputs: 1,
          outputs: 2,
          fields: [
            { name: 'source', label: 'Array Source', type: 'text', placeholder: 'data.items' },
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
      id: 'data_spe',
      label: 'Data & SPE Processing',
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-500/10',
      items: [
        {
          type: 'spe_mapper',
          label: 'Object Mapper',
          icon: 'fas fa-random',
          headerColor: 'bg-indigo-600',
          desc: 'Transform Payload Structure',
          inputs: 1,
          outputs: 1,
          fields: [{ name: 'mapping', label: 'Field Mapping', type: 'mapping_builder' }],
        },
        {
          type: 'spe_script',
          label: 'Execute Script',
          icon: 'fas fa-terminal',
          headerColor: 'bg-indigo-600',
          desc: 'Custom JS Logic',
          inputs: 1,
          outputs: 1,
          fields: [
            {
              name: 'code',
              label: 'Function Body',
              type: 'code_editor',
              height: 'h-48',
              placeholder: "// data.newField = 'value';\nreturn data;",
            },
          ],
        },
        {
          type: 'spe_aggregator',
          label: 'Aggregator',
          icon: 'fas fa-calculator',
          headerColor: 'bg-indigo-600',
          desc: 'Math on Data Stream',
          inputs: 1,
          outputs: 1,
          fields: [
            {
              name: 'fn',
              label: 'Function',
              type: 'select',
              options: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'],
            },
            { name: 'field', label: 'Target Field', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'database_crud',
      label: 'Database Actions (CRUD)',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      items: [
        {
          type: 'crud_find',
          label: 'DB Find',
          icon: 'fas fa-search',
          headerColor: 'bg-blue-600',
          desc: 'Query Records',
          inputs: 1,
          outputs: 1,
          fields: [
            { name: 'collection', label: 'Collection', type: 'text' },
            { name: 'query', label: 'Query (JSON)', type: 'code_editor', height: 'h-20' },
          ],
        },
        {
          type: 'crud_insert',
          label: 'DB Insert',
          icon: 'fas fa-plus-circle',
          headerColor: 'bg-blue-600',
          desc: 'Create Record',
          inputs: 1,
          outputs: 1,
          fields: [
            { name: 'collection', label: 'Collection', type: 'text' },
            { name: 'data', label: 'Payload (Empty = current)', type: 'text' },
          ],
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
  // 4. DRAG & DROP LOGIC
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

  function addMappingRow(fieldName) {
    if (!Array.isArray(selectedNodeData[fieldName])) {
      selectedNodeData[fieldName] = []
    }
    selectedNodeData[fieldName] = [
      ...selectedNodeData[fieldName],
      { key: '', mode: 'Direct', value: '' },
    ]
    updateNodeData(fieldName, selectedNodeData[fieldName])
  }

  function updateMappingRow(fieldName, index, prop, value) {
    selectedNodeData[fieldName][index][prop] = value
    updateNodeData(fieldName, selectedNodeData[fieldName])
  }

  function removeMappingRow(fieldName, index) {
    selectedNodeData[fieldName].splice(index, 1)
    selectedNodeData[fieldName] = [...selectedNodeData[fieldName]]
    updateNodeData(fieldName, selectedNodeData[fieldName])
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

  function handleKeyDown(e) {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault()
      if (selectedNodeId) {
        const nodeData = editor.getNodeFromId(selectedNodeId)
        selectedNodeConfig = nodeData
      }
    }
  }

  const activeRuleName = $derived(
    savedRules.find((r) => r.id === activeRuleId)?.name || 'No Rule Selected'
  )
</script>

<div class="flex h-full w-full overflow-hidden bg-background text-foreground font-sans">
  <aside class="flex w-[320px] shrink-0 flex-col border-r border-border bg-card shadow-xl z-20">
    <div class="flex flex-col gap-2 border-b border-border p-5 bg-card/90 backdrop-blur">
      <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">
        Node Library
      </h3>
      <div class="relative flex items-center">
        <i class="fas fa-search absolute left-3 text-muted-foreground"></i>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari komponen node..."
          class="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-4 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">
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
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                draggable={!isLocked}
                ondragstart={(e) => handleDragStart(e, item, category.iconColor)}
                class="group flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all
                        w-full overflow-hidden
                        {isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-grab hover:border-primary/50 hover:bg-muted hover:shadow-md active:cursor-grabbing'}"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {category.iconBg} {category.iconColor}"
                >
                  <i class="{item.icon} text-lg transition-transform group-hover:scale-110"></i>
                </div>
                <div class="flex flex-1 flex-col overflow-hidden min-w-0">
                  <span class="text-xs font-bold text-foreground truncate">{item.label}</span>
                  <span class="text-[10px] text-muted-foreground truncate" title={item.desc}
                    >{item.desc}</span
                  >
                </div>
                {#if !isLocked}
                  <i
                    class="fas fa-grip-vertical ml-auto text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100"
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

  <main class="relative flex-1 bg-background" ondragover={handleDragOver} ondrop={handleDrop}>
    <div
      class="absolute left-6 top-6 flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 p-1.5 shadow-xl backdrop-blur-md z-10 transition-all"
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
          class="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 mr-1"
        >
          <div class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
          <span class="text-[10px] font-black uppercase tracking-widest text-primary"
            >{currentRule?.name}</span
          >
        </div>
        <div class="h-5 w-px bg-border mx-1"></div>
      {/if}
      <button
        onclick={() => {
          if (!activeRuleId) {
            isDrawerOpen = true // Paksa buka drawer jika belum pilih rule
            return
          }
          isLocked = !isLocked
        }}
        class="flex h-9 px-4 items-center justify-center gap-2 rounded-lg font-bold text-xs transition-colors
               {isLocked
          ? 'bg-warning/10 text-warning hover:bg-warning/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      >
        <i class="fas {isLocked ? 'fa-lock' : 'fa-unlock'}"></i>
        {isLocked ? 'Read Only' : 'Edit Mode'}
      </button>
      <div class="h-5 w-px bg-border mx-1"></div>
      <button
        onclick={() => editor?.clearModuleSelected()}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors gap-2 rounded-xl border border-border/60 bg-card/80 px-5 py-2.5 shadow-xl backdrop-blur-md z-10"
        title="Clear Canvas"
        disabled={isLocked}
      >
        <i class="fas fa-eraser"></i>
      </button>
      <button
        onclick={() => (isDrawerOpen = true)}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors gap-2 rounded-xl border border-border/60 bg-card/80 px-5 py-2.5 shadow-xl backdrop-blur-md z-10 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 opacity-100"
        title="Saved Rules"
      >
        <i class="fas fa-folder-open text-primary"></i>
      </button>
    </div>

    {#if isLocked}
      <div
        class="absolute bottom-6 left-6 pointer-events-none flex items-center gap-2 rounded-xl bg-warning/10 px-5 py-3 text-warning border border-warning/20 shadow-lg backdrop-blur-sm z-10"
        in:fade
      >
        <i class="fas fa-shield-alt text-lg"></i>
        <span class="text-xs font-black uppercase tracking-widest"
          >Canvas Locked - Changes Disabled</span
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
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute inset-0 bg-background/60 backdrop-blur-sm z-30"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
        onclick={() => (isDrawerOpen = false)}
      ></div>

      <div
        class="absolute right-0 top-0 bottom-0 w-[420px] border-l border-border bg-card shadow-2xl z-40 flex flex-col"
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
              class="relative w-full flex flex-col items-start rounded-2xl border p-5 transition-all text-left overflow-hidden
                        {activeRuleId === rule.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md'
                : 'border-border bg-card hover:border-primary/50 hover:bg-muted'}"
            >
              {#if activeRuleId === rule.id}
                <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" in:fade></div>
              {/if}

              <div class="flex w-full items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-foreground">{rule.name}</span>
                  {#if activeRuleId === rule.id}
                    <i class="fas fa-check-circle text-primary text-[10px]" in:fly={{ y: 5 }}></i>
                  {/if}
                </div>

                <span
                  class="rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider
                    {rule.status === 'Active'
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
  </main>
  {#if selectedNodeConfig}
    <button
      class="absolute inset-0 bg-background/60 backdrop-blur-sm z-30"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
      onclick={() => (selectedNodeConfig = false)}
      title="Properties"
    >
    </button>
    <div
      class="absolute right-0 top-0 bottom-0 w-[420px] border-l border-border bg-card shadow-2xl z-40 flex flex-col"
      in:fly={{ x: 420, duration: 300, opacity: 1 }}
      out:fly={{ x: 420, duration: 250, opacity: 1 }}
    >
      <div
        class="flex items-center justify-between border-b border-border p-6 bg-card/90 backdrop-blur"
      >
        <div>
          <h2 class="text-xl font-black text-foreground">{selectedNodeConfig.label}</h2>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="text-[9px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
              >ID: {selectedNodeId}</span
            >
            <span class="h-1 w-1 rounded-full bg-border"></span>
            <span class="text-[9px] font-bold text-primary uppercase tracking-widest"
              >{selectedNodeConfig.id}</span
            >
            <span class="text-[9px] font-bold text-primary uppercase tracking-widest"
              >{selectedNodeConfig.desc}</span
            >
          </div>
        </div>
        <button
          aria-label="Rules"
          onclick={closeProperties}
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
        {#if selectedNodeConfig.fields && selectedNodeConfig.fields.length > 0}
          {#each selectedNodeConfig.fields as field}
            <div class="flex flex-col gap-2.5">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label class="flex items-center justify-between">
                <span
                  class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80"
                >
                  {field.label}
                  {#if field.required}
                    <span class="text-destructive ml-0.5">*</span>
                  {/if}
                </span>
                {#if field.type === 'code_editor'}
                  <span
                    class="text-[8px] font-bold text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10"
                    >Script Mode</span
                  >
                {/if}
              </label>

              {#if field.type === 'select'}
                <div class="relative group">
                  <select
                    value={selectedNodeData[field.name] || ''}
                    onchange={(e) => updateNodeData(field.name, e.target.value)}
                    class="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-xs font-semibold text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer shadow-sm hover:border-primary/40"
                  >
                    <option value="" disabled>Pilih opsi...</option>
                    {#each field.options as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                  <i
                    class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none group-hover:text-primary transition-colors"
                  ></i>
                </div>
              {:else if field.type === 'code_editor'}
                <div
                  class="rounded-2xl border border-input bg-[#0f111a] p-1.5 shadow-2xl relative group focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                >
                  <textarea
                    value={selectedNodeData[field.name] || ''}
                    oninput={(e) => updateNodeData(field.name, e.target.value)}
                    placeholder={field.placeholder || '// Tulis logika di sini...'}
                    class="w-full bg-transparent p-4 text-[11px] font-mono text-emerald-400 focus:outline-none resize-none {field.height ||
                      'h-32'} custom-scrollbar"
                    spellcheck="false"
                  ></textarea>
                  <div
                    class="absolute bottom-3 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span class="text-[9px] font-mono text-slate-500 italic"
                      >Ln {selectedNodeData[field.name]?.split('\n').length || 1}</span
                    >
                  </div>
                </div>
              {:else}
                <div class="relative group">
                  {#if field.prefix}
                    <div
                      class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-border/50"
                    >
                      <span class="text-[10px] font-black text-muted-foreground/60"
                        >{field.prefix}</span
                      >
                    </div>
                  {/if}
                  <input
                    type={field.type || 'text'}
                    value={selectedNodeData[field.name] || ''}
                    oninput={(e) => updateNodeData(field.name, e.target.value)}
                    placeholder={field.placeholder || ''}
                    class="w-full rounded-xl border border-input bg-background {field.prefix
                      ? 'pl-20'
                      : 'px-4'} py-3 text-xs font-semibold text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm group-hover:border-primary/40"
                  />
                </div>
              {/if}
            </div>
          {/each}
        {:else}
          <div class="flex flex-col items-center justify-center h-60 text-center space-y-4">
            <div
              class="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/30 border border-dashed border-border"
            >
              <i class="fas fa-cog text-2xl animate-spin-slow"></i>
            </div>
            <div>
              <p class="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Static Node
              </p>
              <p class="text-[10px] text-muted-foreground/60">
                Tidak memerlukan konfigurasi parameter.
              </p>
            </div>
          </div>
        {/if}
      </div>
      <div class="p-6 border-t border-border bg-card/80 backdrop-blur-md space-y-3">
        <button
          type="button"
          onclick={deleteCurrentNode}
          class="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm active:scale-[0.98]"
        >
          <i class="fas fa-trash-alt text-xs"></i>
          Delete Component
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* =========================================================
     1. CANVAS & GRID SYSTEM
     ========================================================= */
  #drawflow-canvas {
    width: 100%;
    height: 100%;
    position: relative;
    /* Grid Pattern dinamis mengikuti warna border tema */
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

  /* Outline saat node diklik / dipilih */
  :global(.drawflow .drawflow-node.selected .node-card) {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
    width: 14px !important;
    height: 14px !important;
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
     4. LINE CLAMP & TEXT TRUNCATION (Fixed Compatibility Warning)
     ========================================================= */
  :global(.line-clamp-node) {
    /* Properti standar untuk kompatibilitas masa depan */
    line-clamp: 2 !important;

    /* Properti vendor-prefixed untuk dukungan browser saat ini */
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

  :global(.drawflow .point) {
    stroke: var(--color-primary) !important;
    stroke-width: 2px !important;
    fill: var(--color-card) !important;
  }

  /* Saat mode readonly aktif */
  :global(#drawflow-canvas.is-readonly) {
    cursor: not-allowed !important;
  }

  /* Membuat garis koneksi sedikit transparan saat locked */
  :global(#drawflow-canvas.is-readonly .connection) {
    opacity: 0.5;
  }

  /* Mencegah kursor grab muncul pada node saat locked */
  :global(#drawflow-canvas.is-readonly .drawflow-node) {
    cursor: not-allowed !important;
  }
  /* =========================================================
     6. SCROLLBAR THEME
     ========================================================= */
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.2);
    border-radius: 10px;
  }
</style>
