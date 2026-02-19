<script>
  import { useForm } from '@inertiajs/svelte';
  import MainLayout from '~/layouts/MainLayout.svelte';

  let form = useForm({
    email: '',
    password: '',
  });

  function submit() {
    $form.post('/login');
  }
</script>

<MainLayout>
  <div class="flex min-h-screen w-full flex-col md:flex-row">
    
    <div class="relative hidden w-full flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:w-1/2">
      <div class="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-white opacity-10 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-black opacity-10 blur-3xl"></div>

      <div class="relative z-10 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
           <span class="font-bold">E</span>
        </div>
        <span class="text-xl font-bold tracking-wide">Enterprise Corp</span>
      </div>

      <div class="relative z-10 max-w-lg">
        <blockquote class="text-2xl font-medium leading-relaxed">
          "Manage your organization securely and efficiently with our new enterprise platform."
        </blockquote>
      </div>

      <div class="relative z-10 text-sm opacity-80">
        © 2026 Enterprise Corp. Security & Compliance.
      </div>
    </div>

    <div class="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
      
      <div class="w-full max-w-md space-y-8">
        <div class="text-center lg:text-left">
          <h2 class="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
          <p class="mt-2 text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {#if $form.errors.auth}
          <div class="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            ⚠️ {$form.errors.auth}
          </div>
        {/if}

        <form on:submit|preventDefault={submit} class="space-y-6">
          
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium text-foreground">Email Address</label>
            <input 
              type="text" 
              id="email" 
              required
              bind:value={$form.email}
              class="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="name@enterprise.com"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-foreground">Password</label>
              <!-- svelte-ignore a11y_invalid_attribute -->
              <a href="#" class="text-sm font-medium text-primary hover:underline">Forgot password?</a>
            </div>
            <input 
              type="password" 
              id="password"
              required
              bind:value={$form.password}
              class="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={$form.processing}
            class="flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {#if $form.processing}
              Processing...
            {:else}
              Sign In
            {/if}
          </button>

        </form>

        <p class="text-center text-sm text-muted-foreground">
          Don't have an account? 
          <!-- svelte-ignore a11y_invalid_attribute -->
          <a href="#" class="font-semibold text-primary hover:underline">Contact Admin</a>
        </p>
      </div>
    </div>
  </div>
</MainLayout>