<script lang="ts">
  import * as echarts from 'echarts'
  import { onMount } from 'svelte'

  let { options } = $props<{ options: any }>()

  let chartDom: HTMLElement | null = $state(null)
  let chartInstance: echarts.ECharts | null = $state(null)
  let resizeObserver: ResizeObserver | null = null
  let themeObserver: MutationObserver | null = null
  let isError = $state(false)

  const getCssVar = (variable: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback
    const val = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    return val || fallback
  }

  onMount(() => {
    if (!chartDom) return
    try {
      chartInstance = echarts.init(chartDom, null, {
        renderer: 'canvas',
        devicePixelRatio: window.devicePixelRatio,
      })
      themeObserver = new MutationObserver(() => {
        window.requestAnimationFrame(() => {
          if (chartInstance && options) {
            applyOptions(options)
          }
        })
      })

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })

      if (options && Object.keys(options).length > 0) {
        applyOptions(options)
      }
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          if (chartInstance) chartInstance.resize()
        })
      })
      resizeObserver.observe(chartDom)
      themeObserver = new MutationObserver(() => {
        if (options && chartInstance) {
          applyOptions(options)
        }
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    } catch (error) {
      console.error('[EChartsRenderer] Gagal melakukan inisialisasi:', error)
      isError = true
    }

    return () => {
      if (resizeObserver && chartDom) {
        resizeObserver.unobserve(chartDom)
        resizeObserver.disconnect()
      }
      if (themeObserver) {
        themeObserver.disconnect()
      }
      if (chartInstance) {
        chartInstance.clear()
        chartInstance.dispose()
        chartInstance = null
      }
    }
  })

  $effect(() => {
    if (chartInstance && options && !isError) {
      applyOptions(options)
    }
  })

  function applyOptions(opt: any) {
    if (!chartInstance) return

    try {
      isError = false

      const textColor = getCssVar('--color-foreground', '#09090b')
      const tooltipBg = getCssVar('--color-popover', 'rgba(255, 255, 255, 0.95)')
      const tooltipBorder = getCssVar('--color-border', '#e4e4e7')
      const tooltipText = getCssVar('--color-popover-foreground', '#09090b')
      const gridLineColor = getCssVar('--color-border', '#e4e4e7')

      const baseTheme = {
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          color: textColor,
        },
        tooltip: {
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipText, fontSize: 11 },
          padding: [8, 12],
          borderRadius: 8,
          extraCssText:
            'backdrop-filter: blur(4px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
        },

        valueAxis: {
          splitLine: { lineStyle: { color: gridLineColor, opacity: 0.5 } },
        },
        categoryAxis: {
          axisLine: { lineStyle: { color: gridLineColor, opacity: 0.8 } },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
      }

      let finalOptions
      if (opt.baseOption) {
        finalOptions = {
          ...opt,
          baseOption: {
            ...baseTheme,
            ...opt.baseOption,
            grid: { ...baseTheme.grid, ...opt.baseOption.grid },
          },
        }
      } else {
        finalOptions = { ...baseTheme, ...opt }
      }

      chartInstance.setOption(finalOptions, true)
    } catch (e) {
      console.error('[EChartsRenderer] Gagal menerapkan opsi visual:', e)
      isError = true
    }
  }
</script>

<div class="relative w-full h-full min-h-0 flex items-center justify-center">
  {#if isError}
    <div
      class="absolute inset-4 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border border-destructive/20 rounded-xl text-destructive/80 z-10 transition-all"
    >
      <div class="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <i class="fas fa-exclamation-triangle text-lg"></i>
      </div>
      <span class="text-[10px] font-black uppercase tracking-widest block mb-1">
        Visualisasi Gagal
      </span>
      <p class="text-[9px] font-medium opacity-80 text-center max-w-[200px] leading-relaxed">
        Terjadi masalah saat memuat grafik. Periksa struktur data.
      </p>
    </div>
  {/if}

  <div
    bind:this={chartDom}
    class="absolute inset-0 w-full h-full transition-opacity duration-300 {isError
      ? 'opacity-0 pointer-events-none'
      : 'opacity-100'}"
  ></div>
</div>
