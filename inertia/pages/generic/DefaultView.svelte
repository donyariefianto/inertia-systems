<script>
  import MainLayout from '~/layouts/MainLayout.svelte';
  
  let { data } = $props();
</script>

<MainLayout>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
      <i class="fas fa-file-alt text-4xl"></i>
    </div>
    <h1 class="text-3xl font-bold text-foreground mb-2">Halaman Statis</h1>
    <p class="text-muted-foreground max-w-md">
      Ini adalah halaman penampung untuk rute tanpa tipe `chartview` atau `tableview`. Data konfigurasi JSON Anda dapat dirender secara kustom di sini.
    </p>
  </div>
</MainLayout>