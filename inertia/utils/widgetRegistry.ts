import { WidgetConfigBuilder } from '~/utils/WidgetConfigBuilder.ts';

export const WidgetRegistry = {
  // ==========================================
  // 1. KATEGORI UTAMA (ROUTER)
  // ==========================================
  categories: {
    'simple': { name: 'Tabel & Labels', icon: 'fa-solid fa-chart-simple', color: 'text-orange-500', bg: 'bg-orange-100' },
    'line': { name: 'Line Charts', icon: 'fa-solid fa-chart-line', color: 'text-blue-600', bg: 'bg-blue-50' },
    'bar': { name: 'Bar Charts', icon: 'fa-solid fa-chart-bar', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'pie': { name: 'Pie & Donut', icon: 'fa-solid fa-chart-pie', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    'scatter': { name: 'Scatter & Plot', icon: 'fa-solid fa-braille', color: 'text-lime-600', bg: 'bg-lime-200' },
    'radar': { name: 'Radar & Gauge', icon: 'fa-solid fa-compass', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    'flow': { name: 'Tree & Flow', icon: 'fa-solid fa-project-diagram', color: 'text-purple-600', bg: 'bg-purple-100' },
    '3d': { name: '3D Visualization', icon: 'fa-solid fa-cubes', color: 'text-rose-500', bg: 'bg-rose-100' },
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
        type: 'simple_table', width: 'half', title: 'Data Tabel', icon: 'fa-solid fa-table',
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
        type: 'label', width: 'quarter', title: 'Total Revenue', icon: 'fa-solid fa-tag',
        echartsOptions: {},
        data_config: WidgetConfigBuilder.staticData([{ label: 'Revenue', value: 1500000, trend: '+5.2%' }]),
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
        type: 'line_smooth', width: 'half', title: 'Smooth Trend', icon: 'fa-solid fa-bezier-curve',
        echartsOptions: { series: [{ type: 'line', smooth: true }], xAxis: { boundaryGap: false } },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Mon', value: 150 }, { label: 'Tue', value: 230 }, { label: 'Wed', value: 224 }
        ]),
      },
    },
    line_stacked: {
      name: 'Stacked Area Line',
      icon: 'fa-solid fa-layer-group',
      category: 'line',
      desc: 'Akumulasi total dengan format area',
      defaultConfig: {
        type: 'line_stacked', width: 'half', title: 'Stacked Growth', icon: 'fa-solid fa-layer-group',
        echartsOptions: { tooltip: { trigger: 'axis' } }, // Area dan stack akan disuntikkan via Transformer
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Email', data: [120, 132, 101, 134, 90] },
          { name: 'Direct', data: [320, 332, 301, 334, 390] },
          { xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] } // Metadata sumbu X
        ]),
      },
    },
    line_area_large: {
      name: 'Large Scale Area',
      icon: 'fa-solid fa-mountain',
      category: 'line',
      desc: 'Dioptimalkan untuk jutaan data (LTTB)',
      defaultConfig: {
        type: 'line_area_large', width: 'full', title: 'Big Data View', icon: 'fa-solid fa-chart-area',
        echartsOptions: {
          dataZoom: [{ type: 'inside' }, { type: 'slider' }],
          series: [{ type: 'line', areaStyle: { opacity: 0.2 }, sampling: 'lttb' }]
        },
        data_config: WidgetConfigBuilder.staticData([
          { label: '00:00', value: 10 }, { label: '04:00', value: 50 },
          { label: '08:00', value: 120 }, { label: '12:00', value: 300 }
        ]),
      },
    },
    line_multi_x: {
      name: 'Dual Axis Comparison',
      icon: 'fa-solid fa-arrows-alt-h',
      category: 'line',
      desc: 'Komparasi dengan dua sumbu X (Atas/Bawah)',
      defaultConfig: {
        type: 'line_multi_x', width: 'half', title: 'YOY Comparison', icon: 'fa-solid fa-arrows-alt-h',
        echartsOptions: { xAxis: [{ type: 'category' }, { type: 'category' }] }, // Blueprint Multi-X
        data_config: WidgetConfigBuilder.staticData([
          { name: '2015', data: [2.6, 5.9, 9.0, 26.4], axisPointer: ['Jan', 'Feb', 'Mar', 'Apr'] },
          { name: '2016', data: [3.9, 5.9, 11.1, 18.7], axisPointer: ['Jan', 'Feb', 'Mar', 'Apr'] }
        ]),
      },
    },
    line_race: {
      name: 'Line Race',
      icon: 'fa-solid fa-running',
      category: 'line',
      desc: 'Balapan garis beranimasi secara live',
      defaultConfig: {
        type: 'line_race', width: 'full', title: 'Live Race', icon: 'fa-solid fa-running',
        echartsOptions: { animationDuration: 10000, dataset: { source: [] } },
        data_config: WidgetConfigBuilder.staticData([
          ["Income", "Country", "Year"],
          [1263, "Australia", 1950], [1678, "Canada", 1950], [704, "China", 1950], [1358, "Germany", 1950], [1248, "Japan", 1950],
          [1551, "Australia", 1955], [1734, "Canada", 1955], [1015, "China", 1955], [1584, "Germany", 1955], [1482, "Japan", 1955],
          [1659, "Australia", 1960], [1993, "Canada", 1960], [1437, "China", 1960], [1784, "Germany", 1960], [1937, "Japan", 1960],
          [1769, "Australia", 1965], [2167, "Canada", 1965], [1859, "China", 1965], [1876, "Germany", 1965], [2261, "Japan", 1965],
          [1987, "Australia", 1970], [2292, "Canada", 1970], [2132, "China", 1970], [2063, "Germany", 1970], [2807, "Japan", 1970],
          [2238, "Australia", 1975], [2538, "Canada", 1975], [2398, "China", 1975], [2204, "Germany", 1975], [3395, "Japan", 1975],
          [2383, "Australia", 1980], [2602, "Canada", 1980], [2647, "China", 1980], [2316, "Germany", 1980], [3932, "Japan", 1980],
          [2657, "Australia", 1985], [2835, "Canada", 1985], [2975, "China", 1985], [2407, "Germany", 1985], [4332, "Japan", 1985],
          [2926, "Australia", 1990], [3108, "Canada", 1990], [3381, "China", 1990], [2557, "Germany", 1990], [4571, "Japan", 1990],
          [3220, "Australia", 1995], [3251, "Canada", 1995], [3995, "China", 1995], [2678, "Germany", 1995], [5134, "Japan", 1995]
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
        type: 'bar', width: 'half', title: 'Sales Performance', icon: 'fa-solid fa-chart-bar',
        echartsOptions: { series: [{ type: 'bar', itemStyle: { borderRadius: [4, 4, 0, 0] } }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Q1', value: 450 }, { label: 'Q2', value: 320 }, { label: 'Q3', value: 600 }
        ]),
      },
    },
    bar_horizontal: {
      name: 'Horizontal Bar',
      icon: 'fa-solid fa-align-left',
      category: 'bar',
      desc: 'Sangat baik untuk nama kategori yang panjang',
      defaultConfig: {
        type: 'bar_horizontal', width: 'half', title: 'Top Regions', icon: 'fa-solid fa-align-left',
        echartsOptions: { 
          xAxis: { type: 'value' }, yAxis: { type: 'category' }, // Putar sumbu
          series: [{ type: 'bar', itemStyle: { borderRadius: [0, 4, 4, 0] } }] 
        },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'DKI Jakarta', value: 1200 }, { label: 'Jawa Timur', value: 950 }
        ]),
      },
    },
    bar_stacked: {
      name: 'Stacked Bar',
      icon: 'fa-solid fa-cubes',
      category: 'bar',
      desc: 'Grafik batang bertumpuk',
      defaultConfig: {
        type: 'bar_stacked', width: 'half', title: 'Product Mix', icon: 'fa-solid fa-cubes',
        echartsOptions: { tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } } },
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Retail', data: [120, 132, 101] },
          { name: 'Wholesale', data: [220, 182, 191] },
          { xAxis: ['Jan', 'Feb', 'Mar'] }
        ]),
      },
    },
    bar_race: {
      name: 'Bar Racing',
      icon: 'fa-solid fa-flag-checkered',
      category: 'bar',
      desc: 'Peringkat balap realtime antar kategori',
      defaultConfig: {
        type: 'bar_race', width: 'half', title: 'Top Performers', icon: 'fa-solid fa-flag-checkered',
        echartsOptions: {
          yAxis: { inverse: true },
          series: [{ type: 'bar', realtimeSort: true, label: { show: true, position: 'right' } }]
        },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Agent A', value: 85 }, { label: 'Agent B', value: 112 }, { label: 'Agent C', value: 94 }
        ]),
      },
    },
    bar_large: {
      name: 'Massive Bar Data',
      icon: 'fa-solid fa-chart-column',
      category: 'bar',
      desc: 'Dioptimalkan untuk ribuan batang',
      defaultConfig: {
        type: 'bar_large', width: 'full', title: 'High Density Bar', icon: 'fa-solid fa-chart-column',
        echartsOptions: { series: [{ type: 'bar', large: true, largeThreshold: 400 }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Item 1', value: 10 }, { label: 'Item 2', value: 50 }, { label: 'Item 3', value: 20 }
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
        type: 'pie_donut', width: 'quarter', title: 'Market Share', icon: 'fa-solid fa-circle-notch',
        echartsOptions: { series: [{ type: 'pie', radius: ['40%', '70%'] }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'Desktop', value: 70 }, { label: 'Mobile', value: 30 }
        ]),
      },
    },
    pie_rose: {
      name: 'Nightingale Rose',
      icon: 'fa-solid fa-fan',
      category: 'pie',
      desc: 'Pie dengan radius yang bervariasi',
      defaultConfig: {
        type: 'pie_rose', width: 'half', title: 'Risk Factors', icon: 'fa-solid fa-fan',
        echartsOptions: { series: [{ type: 'pie', roseType: 'radius', radius: [20, 100] }] },
        data_config: WidgetConfigBuilder.staticData([
          { label: 'High', value: 40 }, { label: 'Medium', value: 30 }, { label: 'Low', value: 20 }
        ]),
      },
    },
    sunburst: {
      name: 'Sunburst',
      icon: 'fa-solid fa-certificate',
      category: 'pie',
      desc: 'Visualisasi hierarki bersarang',
      defaultConfig: {
        type: 'sunburst', width: 'half', title: 'Organization Hierarchy', icon: 'fa-solid fa-certificate',
        echartsOptions: { series: [{ type: 'sunburst', radius: [0, '90%'] }] },
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Direksi', children: [{ name: 'IT', value: 15 }, { name: 'HR', value: 10 }] }
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
        type: 'scatter', width: 'half', title: 'Korelasi Harga', icon: 'fa-solid fa-braille',
        echartsOptions: { xAxis: { type: 'value' }, yAxis: { type: 'value' } },
        data_config: WidgetConfigBuilder.staticData([
          { value: [10, 250], label: 'Produk A' }, { value: [20, 300], label: 'Produk B' }
        ]),
      },
    },
    radar: {
      name: 'Radar Chart',
      icon: 'fa-solid fa-compass',
      category: 'radar',
      desc: 'Visualisasi metrik multidimensi',
      defaultConfig: {
        type: 'radar', width: 'half', title: 'Skill Matrix', icon: 'fa-solid fa-compass',
        echartsOptions: { radar: { indicator: [] }, series: [{ type: 'radar' }] },
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Team A', value: [80, 90, 70, 85, 60] },
          { indicators: [{ name: 'Sales', max: 100 }, { name: 'Support', max: 100 }] }
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
        type: 'tree', width: 'full', title: 'Sistem Cabang', icon: 'fa-solid fa-sitemap',
        echartsOptions: { series: [{ type: 'tree', orient: 'horizontal' }] },
        data_config: WidgetConfigBuilder.staticData([
          { name: 'Pusat', children: [{ name: 'Cabang A', value: 100 }, { name: 'Cabang B', value: 200 }] }
        ]),
      },
    },
    sankey: {
      name: 'Sankey Diagram',
      icon: 'fa-solid fa-water',
      category: 'flow',
      desc: 'Aliran energi atau keuangan',
      defaultConfig: {
        type: 'sankey', width: 'full', title: 'Cash Flow', icon: 'fa-solid fa-water',
        echartsOptions: { series: [{ type: 'sankey', emphasis: { focus: 'adjacency' } }] },
        data_config: WidgetConfigBuilder.staticData([
          { nodes: [{ name: 'Income' }, { name: 'Taxes' }, { name: 'Profit' }] },
          { links: [{ source: 'Income', target: 'Taxes', value: 20 }, { source: 'Income', target: 'Profit', value: 80 }] }
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
        type: 'line3d_ortho', width: 'half', title: 'Sensor 3D', icon: 'fa-solid fa-cube',
        echartsOptions: {
          grid3D: { viewControl: { projection: 'orthographic', autoRotate: true } },
          xAxis3D: { type: 'category' }, yAxis3D: { type: 'category' }, zAxis3D: { type: 'value' },
        },
        data_config: WidgetConfigBuilder.staticData([
          { x: 'Senin', y: 'Mesin A', z: 45 }, { x: 'Selasa', y: 'Mesin A', z: 50 }
        ]),
      },
    },
    bar3d: {
      name: '3D Bar Chart',
      icon: 'fa-solid fa-cubes',
      category: '3d',
      desc: 'Batang 3D untuk perbandingan ekstra',
      defaultConfig: {
        type: 'bar3d', width: 'half', title: 'Volume Matrix', icon: 'fa-solid fa-cubes',
        echartsOptions: {
          grid3D: { viewControl: { autoRotate: false } },
          xAxis3D: { type: 'category' }, yAxis3D: { type: 'category' }, zAxis3D: { type: 'value' },
        },
        data_config: WidgetConfigBuilder.staticData([
          { x: 'Jan', y: 'Produk X', z: 120 }, { x: 'Feb', y: 'Produk X', z: 150 }
        ]),
      },
    },
    surface3d: {
      name: '3D Surface',
      icon: 'fa-solid fa-water',
      category: '3d',
      desc: 'Permukaan 3D gelombang (Mathematical)',
      defaultConfig: {
        type: 'surface3d', width: 'full', title: 'Heat Surface', icon: 'fa-solid fa-water',
        echartsOptions: {
          grid3D: {}, xAxis3D: { type: 'value' }, yAxis3D: { type: 'value' }, zAxis3D: { type: 'value' }
        },
        data_config: WidgetConfigBuilder.staticData([
          { value: [-1, -1, 0.5] }, { value: [-1, 0, 0.8] }, { value: [0, 0, 1.2] } // Format XYZ Array
        ]),
      },
    }
  }
};