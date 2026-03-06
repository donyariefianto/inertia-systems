<script lang="ts">
  import { toast } from '~/utils/toast.svelte'
  import { fly, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  // Mapping menggunakan Semantic Tokens dari app.css Anda
  const themes = {
    success: {
      color: 'var(--color-success)',
      icon: 'fa-circle-check',
      label: 'Success',
    },
    error: {
      color: 'var(--color-destructive)',
      icon: 'fa-circle-exclamation',
      label: 'Error',
    },
    warning: {
      color: 'var(--color-warning)',
      icon: 'fa-triangle-exclamation',
      label: 'Warning',
    },
    info: {
      color: 'var(--color-info)',
      icon: 'fa-circle-info',
      label: 'Information',
    },
  }
</script>

<div
  class="fixed z-[9999]
         /* Mobile: Di bawah tengah dengan padding aman */
         bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]
         /* Desktop: Pindah ke pojok kanan bawah */
         sm:bottom-8 sm:right-8 sm:left-auto sm:p-0 sm:w-[400px]
         flex flex-col-reverse gap-3 pointer-events-none"
>
  {#each toast.all as item (item.id)}
    {@const theme = themes[item.type]}

    <div
      role="alert"
      aria-live="assertive"
      /* Animasi: Di mobile lebih enak muncul dari bawah (y), di desktop dari kanan (x) */
      in:fly={{ y: 20, x: window.innerWidth > 640 ? 50 : 0, duration: 400, easing: expoOut }}
      out:scale={{ start: 0.95, duration: 200 }}
      class="group pointer-events-auto relative overflow-hidden rounded-[var(--radius-xl)]
             bg-[color-mix(in_srgb,var(--color-card),transparent_20%)]
             backdrop-blur-2xl border border-[var(--color-border)]
             shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all hover:translate-y-[-2px]"
    >
      <div
        class="absolute inset-0 opacity-5 pointer-events-none"
        style:background="radial-gradient(circle at 0% 0%, {theme.color}, transparent 70%)"
      ></div>

      <div class="relative p-4 flex items-start gap-4">
        <div
          class="flex-shrink-0 w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center border border-[color-mix(in_srgb,text-current,transparent_80%)]"
          style:background="color-mix(in_srgb, {theme.color}, transparent 90%)"
          style:color={theme.color}
        >
          <i class="fas {theme.icon} text-lg"></i>
        </div>

        <div class="flex-1 min-w-0 pt-0.5">
          <p
            class="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60"
            style:color={theme.color}
          >
            {theme.label}
          </p>
          <p class="text-[13px] font-medium text-[var(--color-foreground)] leading-relaxed">
            {item.message}
          </p>
        </div>

        <button
          aria-label="close toast"
          onclick={() => toast.remove(item.id)}
          class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-all"
        >
          <i class="fas fa-times text-[10px]"></i>
        </button>
      </div>

      <div class="absolute bottom-0 left-0 h-[3px] w-full bg-[var(--color-muted)] opacity-30"></div>
      <div
        class="absolute bottom-0 left-0 h-[3px] animate-progress-shrink origin-left group-hover:[animation-play-state:paused]"
        style:background={theme.color}
      ></div>
    </div>
  {/each}
</div>

<style>
  @keyframes progress-shrink {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }

  .animate-progress-shrink {
    animation: progress-shrink 5s linear forwards;
    width: 100%;
  }
</style>
