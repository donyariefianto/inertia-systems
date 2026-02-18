<script lang="ts">
  import ThemePicker from '../components/ThemePicker.svelte'
  export let message: string
</script>

<div class="min-h-screen bg-background text-foreground">
  <div class="container mx-auto p-8">
    <h1 class="text-4xl font-bold text-primary mb-4">{message}</h1>
    <p class="text-lg text-foreground/80">
      Selamat datang di aplikasi dengan tema dinamis!
    </p>

    <div class="mt-8 p-6 bg-muted rounded-lg">
      <p class="text-accent">Warna aksen dapat berubah sesuai tema.</p>
    </div>

    <div class="mt-8">
      <ThemePicker />
    </div>
  </div>
</div>