<script>
  import { useForm } from '@inertiajs/svelte';
  
  const form = useForm({
    email: '',
    password: '',
    remember: false
  });

  function submit() {
    $form.post('/login');
  }
</script>

<div class="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
  <div class="relative hidden w-full flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:w-5/12">
    <div class="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-white opacity-10 blur-3xl"></div>
    <div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-black opacity-10 blur-3xl"></div>

    <div class="relative z-10 flex items-center gap-3">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold backdrop-blur-sm shadow-inner">TB</div>
      <span class="text-2xl font-bold tracking-wide">Sahabat<span class="opacity-80">System</span></span>
    </div>

    <div class="relative z-10 max-w-md">
      <h2 class="text-3xl font-bold leading-tight">Sistem Manajemen Tersentralisasi</h2>
      <p class="mt-4 text-lg opacity-80">Pantau operasional, proyeksi, dan kinerja pabrik secara real-time dari satu tempat yang aman.</p>
    </div>

    <div class="relative z-10 text-sm opacity-60">
      &copy; 2026 TB Sahabat. All rights reserved.
    </div>
  </div>

  <div class="flex w-full flex-col items-center justify-center p-8 lg:w-7/12">
    <div class="w-full max-w-sm space-y-8">
      
      <div class="flex items-center gap-2 lg:hidden mb-8">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">TB</div>
        <span class="text-xl font-bold">Sahabat<span class="text-primary">System</span></span>
      </div>

      <div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
        <p class="mt-2 text-sm text-muted-foreground">Silakan login untuk melanjutkan ke panel kontrol.</p>
      </div>

      {#if $form.errors.auth}
        <div class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {$form.errors.auth}
        </div>
      {/if}

      <form class="space-y-6" on:submit|preventDefault={submit}>
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-foreground">Alamat Email</label>
          <input 
            id="email" type="text" bind:value={$form.email} required
            class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            placeholder="admin@sahabat.com"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="password" class="text-sm font-medium text-foreground">Password</label>
            <button type="button" class="text-sm font-medium text-primary hover:underline">Lupa password?</button>
          </div>
          <input 
            id="password" type="password" bind:value={$form.password} required
            class="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            placeholder="••••••••"
          />
        </div>

        <div class="flex items-center">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={$form.remember} class="h-4 w-4 rounded border-border text-primary focus:ring-primary">
            <span class="text-sm text-muted-foreground">Ingat sesi saya</span>
          </label>
        </div>

        <button 
          type="submit" disabled={$form.processing}
          class="flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {#if $form.processing}
            <i class="fas fa-circle-notch fa-spin mr-2"></i> Memproses...
          {:else}
            Masuk ke Sistem
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>