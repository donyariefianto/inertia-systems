<script lang="ts">
  import { Confirm } from '~/utils/confirm.svelte'
  import { fade, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  const typeConfig = {
    primary: 'var(--color-primary)',
    destructive: 'var(--color-destructive)',
    warning: 'var(--color-warning)',
  }
</script>

{#if Confirm.isActive}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
  >
    <div
      transition:scale={{ start: 0.9, duration: 400, easing: expoOut }}
      class="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-2xl)] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      <div class="p-6">
        <h3 class="text-lg font-bold text-[var(--color-foreground)] mb-2">
          {Confirm.config?.title}
        </h3>
        <p class="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
          {Confirm.config?.message}
        </p>
      </div>

      <div
        class="flex items-center justify-end gap-3 p-4 bg-[var(--color-muted)]/30 border-t border-[var(--color-border)]"
      >
        <button
          onclick={() => Confirm.answer(false)}
          class="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] rounded-[var(--radius-md)] transition-all"
        >
          {Confirm.config?.cancelText}
        </button>
        <button
          onclick={() => Confirm.answer(true)}
          class="px-5 py-2 text-sm font-bold text-white rounded-[var(--radius-md)] shadow-lg transition-all active:scale-95"
          style:background={typeConfig[Confirm.config?.type || 'primary']}
        >
          {Confirm.config?.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
