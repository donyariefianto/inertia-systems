<script>
  import { page } from '@inertiajs/svelte'
  import { fade, fly } from 'svelte/transition'

  // State internal untuk kontrol visibilitas manual (jika ingin ditutup)
  let visible = $state(false)

  // Mengambil data flash secara reaktif dari props Inertia
  let flash = $derived($page.props.flash)

  // Efek untuk memicu tampilan ketika ada pesan baru
  $effect(() => {
    if (flash?.success || flash?.error || flash?.info) {
      visible = true
      // Auto-hide setelah 5 detik
      const timer = setTimeout(() => (visible = false), 5000)
      return () => clearTimeout(timer)
    }
  })
</script>

{#if visible}
  <div
    class="fixed right-4 top-20 z-[100] w-full max-w-sm space-y-2 pointer-events-none"
    transition:fly={{ x: 50, duration: 400 }}
  >
    {#if flash?.success}
      <div
        class="pointer-events-auto flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-500 shadow-lg backdrop-blur-md"
      >
        <i class="fas fa-check-circle"></i>
        <p class="text-sm font-medium">{flash.success}</p>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          type="button"
          onclick={() => (visible = false)}
          class="ml-auto opacity-50 hover:opacity-100"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    {/if}

    {#if flash?.error}
      <div
        class="pointer-events-auto flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive shadow-lg backdrop-blur-md"
      >
        <i class="fas fa-exclamation-triangle"></i>
        <p class="text-sm font-medium">{flash.error}</p>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          type="button"
          onclick={() => (visible = false)}
          class="ml-auto opacity-50 hover:opacity-100"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    {/if}
  </div>
{/if}
