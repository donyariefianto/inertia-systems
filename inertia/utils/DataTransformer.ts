import * as echarts from 'echarts'

export class DataTransformer {
  static getCSSVar(name: string) {
    if (typeof window !== 'undefined') {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      return val || null
    }
    return null
  }
  static transform(
    categoryType: string,
    widgetType: string,
    rawData: any,
    baseOptions: any = {}
  ): any {
    try {
      let finalOptions = JSON.parse(JSON.stringify(baseOptions))
      const safeData = rawData || []

      switch (categoryType) {
        case 'line':
          return this.handleLineCategory(widgetType, safeData, finalOptions)
        case 'bar':
          return this.handleBarCategory(widgetType, safeData, finalOptions)
        default:
          console.warn(`[DataTransformer] Category '${categoryType}' belum dihandle.`)
          return finalOptions
      }
    } catch (error) {
      console.error(`[DataTransformer] Transformasi gagal untuk tipe ${widgetType}:`, error)
      return baseOptions
    }
  }
  private static handleLineCategory(widgetType: string, data: any, option: any): any {
    const primaryColor = this.getCSSVar('--color-primary') || '#18181b'
    const textColor = this.getCSSVar('--color-muted-foreground') || '#71717a'
    const borderColor = this.getCSSVar('--color-border') || '#e4e4e7'
    option.xAxis = option.xAxis || { type: 'category' }
    option.yAxis = option.yAxis || { type: 'value' }
    option.series = Array.isArray(option.series) && option.series.length > 0 ? option.series : [{}]
    const safeData = Array.isArray(data) ? data : []
    switch (widgetType) {
      case 'line_smooth': {
        const labels = safeData.map((d: any) => d.label || d._id || d.name || '-')
        const vals = safeData.map((d: any) => Number(d.value) || 0)

        if (Array.isArray(option.xAxis)) option.xAxis[0].data = labels
        else option.xAxis.data = labels

        option.series[0] = {
          ...option.series[0],
          type: 'line',
          smooth: true,
          data: vals,
        }
        return option
      }
      case 'line_stacked': {
        const seriesItems = safeData.filter((d: any) => d.name && d.data)
        const axisItem = safeData.find((d: any) => d.xAxis)

        if (axisItem) {
          if (Array.isArray(option.xAxis)) option.xAxis[0].data = axisItem.xAxis
          else option.xAxis.data = axisItem.xAxis
        }

        option.legend = option.legend || {}
        option.legend.data = seriesItems.map((d: any) => d.name)
        option.series = seriesItems.map((item: any) => ({
          name: item.name,
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: { focus: 'series' },
          data: Array.isArray(item.data) ? item.data : [],
        }))
        return option
      }
      case 'line_area_large': {
        const labels = safeData.map((d: any) => d.label || d._id || '-')
        const vals = safeData.map((d: any) => Number(d.value) || 0)

        if (Array.isArray(option.xAxis)) option.xAxis[0].data = labels
        else option.xAxis.data = labels

        option.series[0] = {
          ...option.series[0],
          type: 'line',
          areaStyle: { opacity: 0.2 },
          sampling: 'lttb',
          data: vals,
        }
        return option
      }
      case 'line_multi_x': {
        const seriesItems = safeData.filter((d: any) => d.name && d.data)
        if (Array.isArray(option.xAxis)) {
          option.xAxis.forEach((element: any, index: number) => {
            element.data = seriesItems[index]?.axisPointer || []
          })
        }

        option.series = seriesItems.map((item: any) => ({
          name: item.name,
          type: 'line',
          data: Array.isArray(item.data) ? item.data : [],
        }))
        return option
      }
      case 'line_race': {
        const sample = data[0]
        const keys = Object.keys(sample)
        let valKey = '',
          nameKey = '',
          timeKey = ''

        keys.forEach((key) => {
          const val = sample[key]
          if (typeof val === 'number') {
            if (val >= 1700 && val <= 2100) timeKey = key
            else valKey = key
          } else if (typeof val === 'string') {
            nameKey = key
          }
        })

        const timeFrames = [...new Set(data.map((item) => item[timeKey]))].sort((a, b) => a - b)
        const categories = [...new Set(data.map((item) => item[nameKey]))]

        option.baseOption = {
          timeline: {
            show: true,
            autoPlay: true,
            loop: false,
            playInterval: 1000,
            realtime: true,
            data: timeFrames.map(String),
            bottom: '2%',
            left: '10%',
            right: '10%',
            label: { color: textColor, fontSize: 10 },
            checkpointStyle: { color: primaryColor, borderWidth: 2 },
            controlStyle: {
              showPlayBtn: false,
              showNextBtn: true,
              showPrevBtn: true,
              itemSize: 20,
              color: textColor,
            },
            lineStyle: {
              color: borderColor, // Mengikuti --color-border (Zinc/Forest)
              width: 2,
            },
          },
          grid: {
            top: '10%',
            left: '5%',
            right: '10%',
            bottom: '80px',
            containLabel: true,
          },
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: timeFrames.map(String),
            boundaryGap: false,
          },
          yAxis: { type: 'value', splitLine: { lineStyle: { opacity: 0.1 } } },

          series: categories.map((cat) => ({
            name: String(cat),
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 3 },
            // endLabel: {
            //   show: true,
            //   formatter: (params: any) => `${params.seriesName}: ${params.value.toLocaleString()}`,
            //   fontWeight: 'bold',
            //   distance: 10,
            // },
            labelLayout: { moveOverlap: 'shiftY' },
            emphasis: { focus: 'series' },
          })),
        }

        option.options = timeFrames.map((currentTime) => {
          return {
            series: categories.map((cat) => {
              const cumulativeData = data
                .filter((item) => item[nameKey] === cat && item[timeKey] <= currentTime)
                .sort((a, b) => a[timeKey] - b[timeKey])
                .map((item) => item[valKey])

              return { data: cumulativeData }
            }),
          }
        })

        return option
      }
      default:
        console.warn(`[handleLineCategory] Type '${widgetType}' belum dihandle. Fallback ke basic.`)
        return option
    }
  }
  private static handleBarCategory(widgetType: string, data: any[], option: any): any {
    const safeData = Array.isArray(data) ? data : []
    const primaryColor = this.getCSSVar('--color-primary') || '#18181b'
    const mutedColor = this.getCSSVar('--color-muted') || '#f4f4f5'
    const borderColor = this.getCSSVar('--color-border') || '#e4e4e7'
    const textColor = this.getCSSVar('--color-muted-foreground') || '#71717a'
    const isHorizontal = widgetType === 'bar_horizontal' || widgetType === 'bar_race'
    switch (widgetType) {
      case 'bar': {
        ;((option.xAxis = {
          type: 'category',
          data: data.map((obj) => obj.label),
        }),
          (option.yAxis = {
            type: 'value',
          }),
          (option.series[0].data = data.map((obj) => parseInt(obj.value))))
        option.series[0].backgroundStyle = {
          color: mutedColor,
          opacity: 0.2,
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        }
        option.series[0].itemStyle = {
          color: primaryColor,
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        }
        return option
      }
      case 'bar_horizontal': {
        ;((option.yAxis = {
          type: 'category',
          data: data.map((obj) => obj.label),
        }),
          (option.xAxis = {
            type: 'value',
          }),
          (option.series[0].data = data.map((obj) => parseInt(obj.value))))
        option.series[0].backgroundStyle = {
          color: mutedColor,
          opacity: 0.2,
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        }
        option.series[0].itemStyle = {
          color: primaryColor,
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        }
        return option
      }
      case 'bar_stacked': {
        option.xAxis = data.find((x) => x.type === 'category')
        option.yAxis = {
          type: 'value',
        }
        option.series = data.filter((x) => x.type === 'bar')
        return option
      }
      case 'bar_large': {
        const header = data[0]
        option.dataset = [{ source: data }]
        option.xAxis = {
          type: 'category',
          axisTick: { alignWithLabel: true },
          axisLabel: { hideOverlap: true },
        }
        option.yAxis = {
          type: 'value',
          splitLine: { lineStyle: { color: mutedColor } }, //
        }
        option.series = [
          {
            type: 'bar',
            large: true,
            largeThreshold: 400,
            progressive: 2000,
            itemStyle: {
              color: primaryColor,
              borderRadius: 0,
            },
            encode: {
              x: header[1],
              y: header[0],
            },
            emphasis: {
              itemStyle: { color: primaryColor, opacity: 0.8 },
            },
          },
        ]
        option.dataZoom = [
          {
            type: 'inside',
            start: 0,
            end: 20,
          },
          {
            type: 'slider',
            bottom: 10,
            height: 20,
            borderColor: 'transparent',
            handleStyle: { color: primaryColor },
          },
        ]
        option.tooltip = {
          trigger: 'axis',
          confine: true,
          axisPointer: { type: 'shadow' },
        }
        return option
      }
      case 'bar_race': {
        const sample = data[0]
        const keys = Object.keys(sample)

        let valKey = '',
          nameKey = '',
          timeKey = ''

        keys.forEach((key) => {
          const value = sample[key]
          if (typeof value === 'number') {
            if (value >= 1700 && value <= 2100) timeKey = key
            else valKey = key
          } else if (typeof value === 'string') {
            nameKey = key
          }
        })
        if (!timeKey)
          timeKey =
            keys.find(
              (k) => k.toLowerCase().includes('year') || k.toLowerCase().includes('time')
            ) || keys[2]
        if (!valKey) valKey = keys[0]
        if (!nameKey) nameKey = keys[1]
        const timeFrames = [...new Set(data.map((item) => item[timeKey]))].sort()
        option.baseOption = {
          timeline: {
            show: true,
            autoPlay: true,
            playInterval: 800,
            loop: false,
            data: timeFrames.map(String),
            bottom: '0%',
            left: '5%',
            right: '5%',
            padding: [0, 0, 10, 0],
            lineStyle: { color: mutedColor, width: 1 },
            label: {
              color: textColor,
              fontSize: 10,
              emphasis: {
                color: primaryColor,
                fontWeight: 'bold',
              },
            },
            itemStyle: { color: mutedColor },
            checkpointStyle: {
              color: primaryColor,
              borderColor: 'white',
              borderWidth: 2,
            },
            controlStyle: {
              showPlayBtn: false,
              showNextBtn: true,
              showPrevBtn: true,
              itemSize: 18,
              color: textColor,
              borderColor: textColor,
              position: 'left',
            },
            emphasis: {
              itemStyle: { color: primaryColor },
              controlStyle: { color: primaryColor, borderColor: primaryColor },
            },
          },
          grid: { top: '5%', left: '3%', right: '15%', bottom: '65px', containLabel: true },
          xAxis: {
            type: 'value',
            max: 'dataMax',
            splitLine: { lineStyle: { color: mutedColor, opacity: 0.1 } },
          },
          yAxis: {
            type: 'category',
            inverse: true,
            animationDuration: 300,
            animationDurationUpdate: 300,
          },
          series: [
            {
              type: 'bar',
              realtimeSort: true,

              encode: { x: valKey, y: nameKey },
              itemStyle: {
                color: primaryColor,
                borderRadius: [0, 4, 4, 0],
              },
              label: {
                show: true,
                position: 'right',
                valueAnimation: true,
                fontWeight: 'bold',
                fontFamily: 'inherit',
              },
            },
          ],
        }

        option.options = timeFrames.map((time) => ({
          dataset: {
            source: data.filter((item) => item[timeKey] === time),
          },
        }))
        return option
      }
      default:
        console.warn(`[handleBarCategory] Type '${widgetType}' belum dihandle. Fallback ke basic.`)
        return option
    }
  }
}
