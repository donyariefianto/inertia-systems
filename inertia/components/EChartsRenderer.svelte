<script lang="ts">
  import * as echarts from 'echarts';
  import { onMount } from 'svelte';

  // --- PROPS ---
  let { options } = $props<{ options: any }>();

  // --- STATE ---
  let chartDom: HTMLElement | null = $state(null);
  let chartInstance: echarts.ECharts | null = $state(null);
  let resizeObserver: ResizeObserver | null = null;
  let isError = $state(false);

  // --- LIFECYCLE & MEMORY PROTECTION ---
  onMount(() => {
    if (!chartDom) return;

    try {
      // 1. Inisialisasi ECharts (Dark Mode + Canvas Renderer untuk performa tinggi)
      // Menggunakan devicePixelRatio standar agar grafis tajam di semua resolusi
      chartInstance = echarts.init(chartDom, 'dark', {
        renderer: 'canvas',
        devicePixelRatio: window.devicePixelRatio
      });

      // 2. Terapkan Opsi Awal
      if (options && Object.keys(options).length > 0) {
        applyOptions(options);
      }

      // 3. Resize Observer (Anti-Lag)
      // requestAnimationFrame wajib digunakan agar saat window di-resize atau
      // sidebar dibuka, browser tidak melempar error "loop limit exceeded"
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          if (chartInstance) {
            chartInstance.resize();
          }
        });
      });
      
      resizeObserver.observe(chartDom);

    } catch (error) {
      console.error('[EChartsRenderer] Gagal melakukan inisialisasi:', error);
      isError = true;
    }

    // 4. Garbage Collection (Mencegah OOM - Out of Memory)
    return () => {
      if (resizeObserver && chartDom) {
        resizeObserver.unobserve(chartDom);
        resizeObserver.disconnect();
      }
      if (chartInstance) {
        chartInstance.clear(); // Bersihkan memori internal canvas
        chartInstance.dispose(); // Hancurkan instance secara tuntas
        chartInstance = null;
      }
    };
  });

  // --- REACTIVITY ---
  // Otomatis memperbarui grafik jika prop 'options' berubah dari parent
  $effect(() => {
    if (chartInstance && options && !isError) {
      applyOptions(options);
    }
  });

  // --- RENDER LOGIC ---
  function applyOptions(opt: any) {
    if (!chartInstance) return;

    try {
      isError = false;

      // Base Tema Dark Zinc Enterprise
      // Disuntikkan ke setiap grafik agar konsisten tanpa perlu diatur manual di JSON
      const baseTheme = {
        backgroundColor: 'transparent', // Agar menyatu dengan bg-card Tailwind
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        tooltip: {
          backgroundColor: 'rgba(9, 9, 11, 0.95)', // Zinc 950
          borderColor: 'rgba(39, 39, 42, 0.5)',    // Zinc 800
          textStyle: { color: '#e4e4e7', fontSize: 11 }, // Zinc 200
          padding: [8, 12],
          borderRadius: 8,
          extraCssText: 'backdrop-filter: blur(4px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
        },
        grid: {
          // Memberi ruang agar label pada sumbu X/Y tidak terpotong di layar kecil
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true 
        }
      };

      const finalOptions = { ...baseTheme, ...opt };

      // Parameter 'true' (notMerge) sangat vital.
      // Ini memastikan grafik lama dihapus bersih sebelum grafik baru digambar,
      // mencegah data lama bertumpuk (ghosting) saat user mengganti filter varian.
      chartInstance.setOption(finalOptions, true);
      
    } catch (e) {
      console.error('[EChartsRenderer] Gagal menerapkan opsi visual:', e);
      isError = true;
    }
  }
</script>

<div class="relative w-full h-full min-h-0 flex items-center justify-center">
  {#if isError}
    <div class="absolute inset-4 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border border-destructive/20 rounded-xl text-destructive/80 z-10 transition-all">
      <div class="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <i class="fas fa-exclamation-triangle text-lg"></i>
      </div>
      <span class="text-[10px] font-black uppercase tracking-widest block mb-1">Visualisasi Gagal</span>
      <p class="text-[9px] font-medium opacity-80 text-center max-w-[200px] leading-relaxed">
        Terjadi masalah saat memuat grafik. Periksa struktur data.
      </p>
    </div>
  {/if}
  
  <div 
    bind:this={chartDom} 
    class="absolute inset-0 w-full h-full transition-opacity duration-300 {isError ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
  ></div>
</div>