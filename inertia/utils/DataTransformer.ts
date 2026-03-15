export class DataTransformer {
  static transform(categoryType: string, widgetType: string, rawData: any, baseOptions: any = {}): any {
    try {
      let finalOptions = JSON.parse(JSON.stringify(baseOptions));
      const safeData = rawData || [];

      switch (categoryType) {
        case 'line':
          return this.handleLineCategory(widgetType, safeData, finalOptions);
        default:
          console.warn(`[DataTransformer] Category '${categoryType}' belum dihandle.`);
          return finalOptions;
      }
    } catch (error) {
      console.error(`[DataTransformer] Transformasi gagal untuk tipe ${widgetType}:`, error);
      return baseOptions; // Fail-safe: kembalikan UI ke konfigurasi kosong
    }
  }

  private static handleLineCategory(widgetType: string, data: any, option: any): any {
    // ==========================================
    // 1. DEFENSIVE INITIALIZATION (Enterprise Guard)
    // Mencegah error "Cannot read properties of undefined"
    // ==========================================
    option.xAxis = option.xAxis || { type: 'category' };
    option.yAxis = option.yAxis || { type: 'value' };
    option.series = Array.isArray(option.series) && option.series.length > 0 
      ? option.series 
      : [{}];

    const safeData = Array.isArray(data) ? data : [];

    // ==========================================
    // 2. DATA MAPPING & SPECIALIZATION
    // ==========================================
    switch (widgetType) {
      case 'line_smooth': {
        const labels = safeData.map((d: any) => d.label || d._id || d.name || '-');
        const vals = safeData.map((d: any) => Number(d.value) || 0);
        
        // Gunakan properti secara spesifik agar konfigurasi Blueprint tidak tertimpa
        if (Array.isArray(option.xAxis)) option.xAxis[0].data = labels;
        else option.xAxis.data = labels;
        
        option.series[0] = {
          ...option.series[0],
          type: 'line',
          smooth: true, // Wajib untuk tipe ini
          data: vals
        };
        return option;
      }

      case 'line_stacked': {
        // Mengurai array campuran (Series Object & xAxis Metadata) dari Registry
        const seriesItems = safeData.filter((d: any) => d.name && d.data);
        const axisItem = safeData.find((d: any) => d.xAxis);

        // Map data ke xAxis
        if (axisItem) {
          if (Array.isArray(option.xAxis)) option.xAxis[0].data = axisItem.xAxis;
          else option.xAxis.data = axisItem.xAxis;
        }

        // Map Legend
        option.legend = option.legend || {};
        option.legend.data = seriesItems.map((d: any) => d.name);

        // Konstruksi ulang seluruh array series agar menjadi Stacked Area
        option.series = seriesItems.map((item: any) => ({
          name: item.name,
          type: 'line',
          stack: 'Total', // Identifier wajib ECharts untuk menumpuk (stack) garis
          areaStyle: {}, 
          emphasis: { focus: 'series' },
          data: Array.isArray(item.data) ? item.data : []
        }));
        return option;
      }

      case 'line_area_large': {
        const labels = safeData.map((d: any) => d.label || d._id || '-');
        const vals = safeData.map((d: any) => Number(d.value) || 0);

        if (Array.isArray(option.xAxis)) option.xAxis[0].data = labels;
        else option.xAxis.data = labels;

        option.series[0] = {
          ...option.series[0],
          type: 'line',
          areaStyle: { opacity: 0.2 },
          sampling: 'lttb', // Proteksi LTTB (Wajib untuk big data)
          data: vals
        };
        return option;
      }

      case 'line_multi_x': {
        const seriesItems = safeData.filter((d: any) => d.name && d.data);

        // Jika xAxis memiliki lebih dari 1 sumbu (Array), kita suntikkan datanya masing-masing
        if (Array.isArray(option.xAxis)) {
          option.xAxis.forEach((element: any, index: number) => {
            element.data = seriesItems[index]?.axisPointer || [];
          });
        }

        option.series = seriesItems.map((item: any) => ({
          name: item.name,
          type: 'line',
          data: Array.isArray(item.data) ? item.data : []
        }));
        return option;
      }

      case 'line_race': {
        if (safeData.length < 2) return option;

        const header = safeData[0];
        const firstDataRow = safeData[1];
        let valIdx = -1, timeIdx = -1, catIdx = -1;

        firstDataRow.forEach((cell: any, i: number) => {
          const val = Number(cell);
          const isNum = !isNaN(val);
          
          if (isNum) {
            // Deteksi waktu: Angka 4 digit antara 1700-2100 biasanya adalah tahun
            if (val >= 1700 && val <= 2100) timeIdx = i;
            // Selain itu dianggap sebagai nilai metrik (Income/Value/Amount)
            else valIdx = i;
          } else {
            // Data string dianggap sebagai kategori (Country/Brand/Category)
            catIdx = i;
          }
        });

        // Fallback jika deteksi otomatis gagal (asumsi urutan standar)
        const finalValIdx = valIdx !== -1 ? valIdx : 0;
        const finalCatIdx = catIdx !== -1 ? catIdx : 1;
        const finalTimeIdx = timeIdx !== -1 ? timeIdx : 2;

        const valName = header[finalValIdx];
        const catName = header[finalCatIdx];
        const timeName = header[finalTimeIdx];

        // 2. SORTING KRONOLOGIS (Wajib agar garis tidak berantakan)
        const sortedData = [
          header,
          ...safeData.slice(1).sort((a, b) => Number(a[finalTimeIdx]) - Number(b[finalTimeIdx]))
        ];

        const categories = Array.from(new Set(sortedData.slice(1).map(row => row[finalCatIdx])));

        // 3. KONFIGURASI DASAR (Responsive Grid)
        option.grid = { 
          top: '10%', 
          left: '3%', 
          right: '140px', // Ruang lebar untuk endLabel di Desktop/Tablet
          bottom: '5%', 
          containLabel: true 
        };
        option.xAxis = { type: 'category', nameLocation: 'middle' };
        option.yAxis = { type: 'value' };
        option.tooltip = { trigger: 'axis', order: 'valueDesc' };

        // 4. DATASET & TRANSFORM
        option.dataset = [{ id: 'dataset_raw', source: sortedData }];

        const datasetWithFilters: any[] = [];
        const seriesList: any[] = [];

        categories.forEach((cat: any) => {
          const datasetId = `ds_${cat}`;
          
          datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'dataset_raw',
            transform: {
              type: 'filter',
              config: { dimension: catName, '=': cat }
            }
          });

          seriesList.push({
            type: 'line',
            datasetId: datasetId,
            name: String(cat),
            showSymbol: false,
            smooth: true,
            lineStyle: { width: 3 },
            endLabel: {
              show: true,
              // Formatter dinamis menggunakan index hasil deteksi
              formatter: (p: any) => `${p.value[finalCatIdx]}: ${p.value[finalValIdx].toLocaleString()}`,
              fontWeight: 'bold',
              distance: 15
            },
            labelLayout: { moveOverlap: 'shiftY' },
            emphasis: { focus: 'series' },
            encode: {
              x: timeName,
              y: valName,
              label: [catName, valName],
              itemName: timeName,
              tooltip: [valName]
            }
          });
        });

        option.dataset.push(...datasetWithFilters);
        option.series = seriesList;

        // 5. RACING ANIMATION LOGIC (Ultra Slow & Linear)
        // Durasi panjang tanpa interval menciptakan efek pertumbuhan garis progresif
        option.animationDuration = 15000; // 15 Detik untuk "Race" yang dramatis
        option.animationDurationUpdate = 2000;
        option.animationEasing = 'linear'; // Wajib linear agar kecepatan konstan
        option.animationEasingUpdate = 'linear';

        return option;
      }

      default:
        console.warn(`[handleLineCategory] Type '${widgetType}' belum dihandle. Fallback ke basic.`);
        return option;
    }
  }
}