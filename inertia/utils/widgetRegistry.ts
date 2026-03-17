import { WidgetConfigBuilder } from '~/utils/WidgetConfigBuilder.ts'

export const WidgetRegistry = {
  // ==========================================
  // 1. KATEGORI UTAMA (ROUTER)
  // ==========================================
  categories: {
    'simple': {
      name: 'Tabel & Labels',
      icon: 'fa-solid fa-chart-simple',
      color: 'text-orange-500',
      bg: 'bg-orange-100',
    },
    'line': {
      name: 'Line Charts',
      icon: 'fa-solid fa-chart-line',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    'bar': {
      name: 'Bar Charts',
      icon: 'fa-solid fa-chart-bar',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    'pie': {
      name: 'Pie & Donut',
      icon: 'fa-solid fa-chart-pie',
      color: 'text-yellow-500',
      bg: 'bg-yellow-100',
    },
    'scatter': {
      name: 'Scatter & Plot',
      icon: 'fa-solid fa-braille',
      color: 'text-lime-600',
      bg: 'bg-lime-200',
    },
    'radar': {
      name: 'Radar & Gauge',
      icon: 'fa-solid fa-compass',
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
    },
    'flow': {
      name: 'Tree & Flow',
      icon: 'fa-solid fa-project-diagram',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    '3d': {
      name: '3D Visualization',
      icon: 'fa-solid fa-cubes',
      color: 'text-rose-500',
      bg: 'bg-rose-100',
    },
  },

  // ==========================================
  // 2. REGISTRY WIDGET (FULL LOAD)
  // ==========================================
  widgets: {
    // ----------------------------------------
    // CATEGORY: SIMPLE
    // ----------------------------------------
    simple_table: {
      name: 'Table',
      icon: 'fa-solid fa-table',
      category: 'simple',
      desc: 'Tampilan data tabular standar enterprise',
      defaultConfig: {
        type: 'simple_table',
        width: 'half',
        title: 'Data Tabel',
        icon: 'fa-solid fa-table',
        echartsOptions: {}, // Tidak digunakan untuk kategori simple
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Susu UHT 1L', category: 'Dairy', stock: 5, unit: 'Box', status: 'critical' },
          { name: 'Biji Kopi Arabika', category: 'Coffee', stock: 25, unit: 'Kg', status: 'safe' },
        ]),
      },
    },
    label: {
      name: 'Label KPI',
      icon: 'fa-solid fa-tag',
      category: 'simple',
      desc: 'Indikator performa utama',
      defaultConfig: {
        type: 'label',
        width: 'quarter',
        title: 'Total Revenue',
        icon: 'fa-solid fa-tag',
        echartsOptions: {},
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Revenue', value: 1500000, trend: '+5.2%' },
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: LINE
    // ----------------------------------------
    line_smooth: {
      name: 'Smoothed Line',
      icon: 'fa-solid fa-bezier-curve',
      category: 'line',
      desc: 'Grafik garis kurva halus untuk tren',
      defaultConfig: {
        type: 'line_smooth',
        width: 'half',
        title: 'Smooth Trend',
        icon: 'fa-solid fa-bezier-curve',
        echartsOptions: { series: [{ type: 'line', smooth: true }], xAxis: { boundaryGap: false } },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Mon', value: 150 },
          { label: 'Tue', value: 230 },
          { label: 'Wed', value: 224 },
        ]),
      },
    },
    line_stacked: {
      name: 'Stacked Area Line',
      icon: 'fa-solid fa-layer-group',
      category: 'line',
      desc: 'Akumulasi total dengan format area',
      defaultConfig: {
        type: 'line_stacked',
        width: 'half',
        title: 'Stacked Growth',
        icon: 'fa-solid fa-layer-group',
        echartsOptions: { tooltip: { trigger: 'axis' } }, // Area dan stack akan disuntikkan via Transformer
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Email', data: [120, 132, 101, 134, 90] },
          { name: 'Direct', data: [320, 332, 301, 334, 390] },
          { xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }, // Metadata sumbu X
        ]),
      },
    },
    line_area_large: {
      name: 'Large Scale Area',
      icon: 'fa-solid fa-mountain',
      category: 'line',
      desc: 'Dioptimalkan untuk jutaan data (LTTB)',
      defaultConfig: {
        type: 'line_area_large',
        width: 'full',
        title: 'Big Data View',
        icon: 'fa-solid fa-chart-area',
        echartsOptions: {
          dataZoom: [{ type: 'inside' }, { type: 'slider' }],
          series: [{ type: 'line', areaStyle: { opacity: 0.2 }, sampling: 'lttb' }],
        },
        data_config: WidgetConfigBuilder.staticData([
          { label: '00:00', value: 10 },
          { label: '04:00', value: 50 },
          { label: '08:00', value: 120 },
          { label: '12:00', value: 300 },
        ]),
      },
    },
    line_multi_x: {
      name: 'Dual Axis Comparison',
      icon: 'fa-solid fa-arrows-alt-h',
      category: 'line',
      desc: 'Komparasi dengan dua sumbu X (Atas/Bawah)',
      defaultConfig: {
        type: 'line_multi_x',
        width: 'half',
        title: 'YOY Comparison',
        icon: 'fa-solid fa-arrows-alt-h',
        echartsOptions: { xAxis: [{ type: 'category' }, { type: 'category' }] }, // Blueprint Multi-X
        data_config: WidgetConfigBuilder.staticData([
          { name: '2015', data: [2.6, 5.9, 9.0, 26.4], axisPointer: ['Jan', 'Feb', 'Mar', 'Apr'] },
          { name: '2016', data: [3.9, 5.9, 11.1, 18.7], axisPointer: ['Jan', 'Feb', 'Mar', 'Apr'] },
        ]),
      },
    },
    line_race: {
      name: 'Line Race',
      icon: 'fa-solid fa-running',
      category: 'line',
      desc: 'Balapan garis beranimasi secara live',
      defaultConfig: {
        type: 'line_race',
        width: 'full',
        title: 'Live Race',
        icon: 'fa-solid fa-running',
        echartsOptions: { animationDuration: 10000, dataset: { source: [] } },
        data_config: WidgetConfigBuilder.staticData([
          { year: 1950, brand: 'Australia', value: 1263 },
          { year: 1950, brand: 'Canada', value: 1678 },
          { year: 1950, brand: 'China', value: 704 },
          { year: 1950, brand: 'Germany', value: 1358 },
          { year: 1950, brand: 'Japan', value: 1248 },
          { year: 1955, brand: 'Australia', value: 1551 },
          { year: 1955, brand: 'Canada', value: 1734 },
          { year: 1955, brand: 'China', value: 1015 },
          { year: 1955, brand: 'Germany', value: 1584 },
          { year: 1955, brand: 'Japan', value: 1482 },
          { year: 1960, brand: 'Australia', value: 1659 },
          { year: 1960, brand: 'Canada', value: 1993 },
          { year: 1960, brand: 'China', value: 1437 },
          { year: 1960, brand: 'Germany', value: 1784 },
          { year: 1960, brand: 'Japan', value: 1937 },
          { year: 1965, brand: 'Australia', value: 1769 },
          { year: 1965, brand: 'Canada', value: 2167 },
          { year: 1965, brand: 'China', value: 1859 },
          { year: 1965, brand: 'Germany', value: 1876 },
          { year: 1965, brand: 'Japan', value: 2261 },
          { year: 1970, brand: 'Australia', value: 1987 },
          { year: 1970, brand: 'Canada', value: 2292 },
          { year: 1970, brand: 'China', value: 2132 },
          { year: 1970, brand: 'Germany', value: 2063 },
          { year: 1970, brand: 'Japan', value: 2807 },
          { year: 1975, brand: 'Australia', value: 2238 },
          { year: 1975, brand: 'Canada', value: 2538 },
          { year: 1975, brand: 'China', value: 2398 },
          { year: 1975, brand: 'Germany', value: 2204 },
          { year: 1975, brand: 'Japan', value: 3395 },
          { year: 1980, brand: 'Australia', value: 2383 },
          { year: 1980, brand: 'Canada', value: 2602 },
          { year: 1980, brand: 'China', value: 2647 },
          { year: 1980, brand: 'Germany', value: 2316 },
          { year: 1980, brand: 'Japan', value: 3932 },
          { year: 1985, brand: 'Australia', value: 2657 },
          { year: 1985, brand: 'Canada', value: 2835 },
          { year: 1985, brand: 'China', value: 2975 },
          { year: 1985, brand: 'Germany', value: 2407 },
          { year: 1985, brand: 'Japan', value: 4332 },
          { year: 1990, brand: 'Australia', value: 2926 },
          { year: 1990, brand: 'Canada', value: 3108 },
          { year: 1990, brand: 'China', value: 3381 },
          { year: 1990, brand: 'Germany', value: 2557 },
          { year: 1990, brand: 'Japan', value: 4571 },
          { year: 1995, brand: 'Australia', value: 3220 },
          { year: 1995, brand: 'Canada', value: 3251 },
          { year: 1995, brand: 'China', value: 3995 },
          { year: 1995, brand: 'Germany', value: 2678 },
          { year: 1995, brand: 'Japan', value: 5134 },
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: BAR
    // ----------------------------------------
    bar: {
      name: 'Standard Bar',
      icon: 'fa-solid fa-chart-bar',
      category: 'bar',
      desc: 'Grafik batang vertikal perbandingan',
      defaultConfig: {
        type: 'bar',
        width: 'half',
        title: 'Sales Performance',
        icon: 'fa-solid fa-chart-bar',
        echartsOptions: { series: [{ label: { show: true }, type: 'bar', itemStyle: {} }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Q1', value: 450 },
          { label: 'Q2', value: 320 },
          { label: 'Q3', value: 600 },
        ]),
      },
    },
    bar_horizontal: {
      name: 'Horizontal Bar',
      icon: 'fa-solid fa-align-left',
      category: 'bar',
      desc: 'Sangat baik untuk nama kategori yang panjang',
      defaultConfig: {
        type: 'bar_horizontal',
        width: 'half',
        title: 'Top Regions',
        icon: 'fa-solid fa-align-left',
        echartsOptions: {
          xAxis: { type: 'value' },
          yAxis: { type: 'category' },
          series: [{ type: 'bar', itemStyle: {} }],
        },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'DKI Jakarta', value: 1200 },
          { label: 'Jawa Timur', value: 950 },
        ]),
      },
    },
    bar_stacked: {
      name: 'Stacked Bar',
      icon: 'fa-solid fa-cubes',
      category: 'bar',
      desc: 'Grafik batang bertumpuk',
      defaultConfig: {
        type: 'bar_stacked',
        width: 'half',
        title: 'Product Mix',
        icon: 'fa-solid fa-cubes',
        echartsOptions: {
          series: [{ itemStyle: {} }],
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        },
        data_config: WidgetConfigBuilder.staticData([
          {
            barWidth: '60%',
            label: { show: true },
            type: 'bar',
            stack: 'total',
            name: 'Retail',
            data: [120, 132, 101],
          },
          {
            barWidth: '60%',
            label: { show: true },
            type: 'bar',
            stack: 'total',
            name: 'Wholesale',
            data: [220, 182, 191],
          },
          { type: 'category', data: ['Jan', 'Feb', 'Mar'] },
        ]),
      },
    },
    bar_race: {
      name: 'Bar Racing',
      icon: 'fa-solid fa-flag-checkered',
      category: 'bar',
      desc: 'Peringkat balap realtime antar kategori',
      defaultConfig: {
        type: 'bar_race',
        width: 'half',
        title: 'Top Performers',
        icon: 'fa-solid fa-flag-checkered',
        echartsOptions: {
          yAxis: { inverse: true },
          series: [{ type: 'bar', realtimeSort: true, label: { show: true, position: 'right' } }],
        },
        data_config: WidgetConfigBuilder.staticData([
          { year: 2020, name: 'Alpha', amount: 450 },
          { year: 2020, name: 'Beta', amount: 520 },
          { year: 2020, name: 'Gamma', amount: 310 },
          { year: 2020, name: 'Delta', amount: 640 },
          { year: 2020, name: 'Epsilon', amount: 290 },
          { year: 2020, name: 'Zeta', amount: 410 },
          { year: 2020, name: 'Eta', amount: 380 },
          { year: 2020, name: 'Theta', amount: 590 },
          { year: 2020, name: 'Iota', amount: 250 },
          { year: 2020, name: 'Kappa', amount: 470 },

          { year: 2021, name: 'Alpha', amount: 890 },
          { year: 2021, name: 'Beta', amount: 710 },
          { year: 2021, name: 'Gamma', amount: 950 },
          { year: 2021, name: 'Delta', amount: 820 },
          { year: 2021, name: 'Epsilon', amount: 600 },
          { year: 2021, name: 'Zeta', amount: 780 },
          { year: 2021, name: 'Eta', amount: 1100 },
          { year: 2021, name: 'Theta', amount: 920 },
          { year: 2021, name: 'Iota', amount: 540 },
          { year: 2021, name: 'Kappa', amount: 830 },

          { year: 2022, name: 'Alpha', amount: 1200 },
          { year: 2022, name: 'Beta', amount: 1450 },
          { year: 2022, name: 'Gamma', amount: 1100 },
          { year: 2022, name: 'Delta', amount: 1300 },
          { year: 2022, name: 'Epsilon', amount: 1600 },
          { year: 2022, name: 'Zeta', amount: 1250 },
          { year: 2022, name: 'Eta', amount: 1400 },
          { year: 2022, name: 'Theta', amount: 1150 },
          { year: 2022, name: 'Iota', amount: 1350 },
          { year: 2022, name: 'Kappa', amount: 1500 },

          { year: 2023, name: 'Alpha', amount: 2100 },
          { year: 2023, name: 'Beta', amount: 1900 },
          { year: 2023, name: 'Gamma', amount: 2400 },
          { year: 2023, name: 'Delta', amount: 1800 },
          { year: 2023, name: 'Epsilon', amount: 2200 },
          { year: 2023, name: 'Zeta', amount: 2600 },
          { year: 2023, name: 'Eta', amount: 2050 },
          { year: 2023, name: 'Theta', amount: 2350 },
          { year: 2023, name: 'Iota', amount: 1950 },
          { year: 2023, name: 'Kappa', amount: 2500 },

          { year: 2024, name: 'Alpha', amount: 3500 },
          { year: 2024, name: 'Beta', amount: 3100 },
          { year: 2024, name: 'Gamma', amount: 2800 },
          { year: 2024, name: 'Delta', amount: 4200 },
          { year: 2024, name: 'Epsilon', amount: 3300 },
          { year: 2024, name: 'Zeta', amount: 3600 },
          { year: 2024, name: 'Eta', amount: 3900 },
          { year: 2024, name: 'Theta', amount: 4500 },
          { year: 2024, name: 'Iota', amount: 3700 },
          { year: 2024, name: 'Kappa', amount: 4100 },
        ]),
      },
    },
    bar_large: {
      name: 'Massive Bar Data',
      icon: 'fa-solid fa-chart-column',
      category: 'bar',
      desc: 'Dioptimalkan untuk ribuan batang',
      defaultConfig: {
        type: 'bar_large',
        width: 'full',
        title: 'High Density Bar',
        icon: 'fa-solid fa-chart-column',
        echartsOptions: {
          grid: { bottom: 90 },
          dataZoom: [{ type: 'inside' }, { type: 'slider' }],
          series: [{ type: 'bar', large: true, largeThreshold: 400 }],
        },
        data_config: WidgetConfigBuilder.staticData([
          ['Amount', 'Timestamp', 'Category'],
          [1200, '2024-01-01', 'TRX-001'],
          [3400, '2024-01-02', 'TRX-002'],
          [2100, '2024-01-03', 'TRX-003'],
          [5600, '2024-01-04', 'TRX-004'],
          [4300, '2024-01-05', 'TRX-005'],
          [1100, '2024-01-06', 'TRX-006'],
          [7800, '2024-01-07', 'TRX-007'],
          [3200, '2024-01-08', 'TRX-008'],
          [5100, '2024-01-09', 'TRX-009'],
          [2300, '2024-01-10', 'TRX-010'],
          [4500, '2025-05-15', 'TRX-500'],
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: PIE
    // ----------------------------------------
    pie_donut: {
      name: 'Donut Chart',
      icon: 'fa-solid fa-circle-notch',
      category: 'pie',
      desc: 'Menampilkan porsi dengan style cincin',
      defaultConfig: {
        type: 'pie_donut',
        width: 'quarter',
        title: 'Market Share',
        icon: 'fa-solid fa-circle-notch',
        echartsOptions: { series: [{ type: 'pie', radius: ['40%', '70%'] }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Desktop', value: 70 },
          { label: 'Mobile', value: 30 },
        ]),
      },
    },
    pie_rose: {
      name: 'Nightingale Rose',
      icon: 'fa-solid fa-fan',
      category: 'pie',
      desc: 'Pie dengan radius yang bervariasi',
      defaultConfig: {
        type: 'pie_rose',
        width: 'half',
        title: 'Risk Factors',
        icon: 'fa-solid fa-fan',
        echartsOptions: { series: [{ type: 'pie', roseType: 'radius', radius: [20, 100] }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'High', value: 40 },
          { label: 'Medium', value: 30 },
          { label: 'Low', value: 20 },
        ]),
      },
    },
    sunburst: {
      name: 'Sunburst',
      icon: 'fa-solid fa-certificate',
      category: 'pie',
      desc: 'Visualisasi hierarki bersarang',
      defaultConfig: {
        type: 'sunburst',
        width: 'half',
        title: 'Organization Hierarchy',
        icon: 'fa-solid fa-certificate',
        echartsOptions: { series: [{ type: 'sunburst', radius: [0, '90%'] }] },
        data_config: WidgetConfigBuilder.staticData([
          {
            name: 'Direksi',
            children: [
              { name: 'IT', value: 15 },
              { name: 'HR', value: 10 },
            ],
          },
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: SCATTER & RADAR
    // ----------------------------------------
    scatter: {
      name: 'Scatter Plot',
      icon: 'fa-solid fa-braille',
      category: 'scatter',
      desc: 'Mencari korelasi dan distribusi data',
      defaultConfig: {
        type: 'scatter',
        width: 'half',
        title: 'Korelasi Harga',
        icon: 'fa-solid fa-braille',
        echartsOptions: { xAxis: { type: 'value' }, yAxis: { type: 'value' } },
        data_config: WidgetConfigBuilder.staticData([
          { value: [10, 250], label: 'Produk A' },
          { value: [20, 300], label: 'Produk B' },
        ]),
      },
    },
    radar: {
      name: 'Radar Chart',
      icon: 'fa-solid fa-compass',
      category: 'radar',
      desc: 'Visualisasi metrik multidimensi',
      defaultConfig: {
        type: 'radar',
        width: 'half',
        title: 'Skill Matrix',
        icon: 'fa-solid fa-compass',
        echartsOptions: { radar: { indicator: [] }, series: [{ type: 'radar' }] },
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Team A', value: [80, 90, 70, 85, 60] },
          {
            indicators: [
              { name: 'Sales', max: 100 },
              { name: 'Support', max: 100 },
            ],
          },
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: FLOW & TREE
    // ----------------------------------------
    tree: {
      name: 'Tree Diagram',
      icon: 'fa-solid fa-sitemap',
      category: 'flow',
      desc: 'Struktur data dari akar ke daun',
      defaultConfig: {
        type: 'tree',
        width: 'full',
        title: 'Sistem Cabang',
        icon: 'fa-solid fa-sitemap',
        echartsOptions: { series: [{ type: 'tree', orient: 'horizontal' }] },
        data_config: WidgetConfigBuilder.staticData([
          {
            name: 'Pusat',
            children: [
              { name: 'Cabang A', value: 100 },
              { name: 'Cabang B', value: 200 },
            ],
          },
        ]),
      },
    },
    sankey: {
      name: 'Sankey Diagram',
      icon: 'fa-solid fa-water',
      category: 'flow',
      desc: 'Aliran energi atau keuangan',
      defaultConfig: {
        type: 'sankey',
        width: 'full',
        title: 'Cash Flow',
        icon: 'fa-solid fa-water',
        echartsOptions: { series: [{ type: 'sankey', emphasis: { focus: 'adjacency' } }] },
        data_config: WidgetConfigBuilder.staticData([
          { nodes: [{ name: 'Income' }, { name: 'Taxes' }, { name: 'Profit' }] },
          {
            links: [
              { source: 'Income', target: 'Taxes', value: 20 },
              { source: 'Income', target: 'Profit', value: 80 },
            ],
          },
        ]),
      },
    },

    // ----------------------------------------
    // CATEGORY: 3D (WEBGL)
    // ----------------------------------------
    line3d_ortho: {
      name: '3D Ortho Line',
      icon: 'fa-solid fa-cube',
      category: '3d',
      desc: 'Garis 3D proyeksi ortografis',
      defaultConfig: {
        type: 'line3d_ortho',
        width: 'half',
        title: 'Sensor 3D',
        icon: 'fa-solid fa-cube',
        echartsOptions: {
          grid3D: { viewControl: { projection: 'orthographic', autoRotate: true } },
          xAxis3D: { type: 'category' },
          yAxis3D: { type: 'category' },
          zAxis3D: { type: 'value' },
        },
        data_config: WidgetConfigBuilder.staticData([
          { x: 'Senin', y: 'Mesin A', z: 45 },
          { x: 'Selasa', y: 'Mesin A', z: 50 },
        ]),
      },
    },
    bar3d: {
      name: '3D Bar Chart',
      icon: 'fa-solid fa-cubes',
      category: '3d',
      desc: 'Batang 3D untuk perbandingan ekstra',
      defaultConfig: {
        type: 'bar3d',
        width: 'half',
        title: 'Volume Matrix',
        icon: 'fa-solid fa-cubes',
        echartsOptions: {
          grid3D: { viewControl: { autoRotate: false } },
          xAxis3D: { type: 'category' },
          yAxis3D: { type: 'category' },
          zAxis3D: { type: 'value' },
        },
        data_config: WidgetConfigBuilder.staticData([
          { x: 'Jan', y: 'Produk X', z: 120 },
          { x: 'Feb', y: 'Produk X', z: 150 },
        ]),
      },
    },
    surface3d: {
      name: '3D Surface',
      icon: 'fa-solid fa-water',
      category: '3d',
      desc: 'Permukaan 3D gelombang (Mathematical)',
      defaultConfig: {
        type: 'surface3d',
        width: 'full',
        title: 'Heat Surface',
        icon: 'fa-solid fa-water',
        echartsOptions: {
          grid3D: {},
          xAxis3D: { type: 'value' },
          yAxis3D: { type: 'value' },
          zAxis3D: { type: 'value' },
        },
        data_config: WidgetConfigBuilder.staticData([
          { value: [-1, -1, 0.5] },
          { value: [-1, 0, 0.8] },
          { value: [0, 0, 1.2] }, // Format XYZ Array
        ]),
      },
    },
  },
}
