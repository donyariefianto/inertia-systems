<script>
  import { useForm } from '@inertiajs/svelte';
  import MainLayout from '~/layouts/MainLayout.svelte';

  const form = useForm({});

  function logout() {
    $form.delete('/logout');
  }
</script>

<MainLayout>
  <div class="flex min-h-screen">
    
    <aside class="hidden w-64 border-r border-border bg-card p-6 md:block">
      <div class="mb-8 text-xl font-bold text-primary">EnterpriseApp</div>
      <nav class="space-y-2">
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a href="#" class="block rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary">Dashboard</a>
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a href="#" class="block rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Settings</a>
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a href="#" class="block rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Users</a>
      </nav>
    </aside>

    <div class="flex-1 bg-background">
      <header class="flex h-16 items-center justify-between border-b border-border px-6">
        <h1 class="text-lg font-semibold text-foreground">Dashboard</h1>
        <button 
          onclick={logout} 
          class="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Logout
        </button>
      </header>

      <div class="p-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          {#each ['Total Revenue', 'Active Users', 'Server Load'] as item}
            <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 class="text-sm font-medium text-muted-foreground">{item}</h3>
              <div class="mt-2 text-3xl font-bold text-foreground">
                {item === 'Total Revenue' ? '$45,231.89' : item === 'Active Users' ? '+2350' : '34%'}
              </div>
            </div>
          {/each}
        </div>

        <div class="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 class="text-lg font-medium text-foreground">Recent Activity</h2>
          <div class="mt-4 h-48 rounded-lg border border-dashed border-border bg-muted/50 flex items-center justify-center text-muted-foreground">
            Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  </div>
</MainLayout>