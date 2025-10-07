<script lang="ts">
  import { Chart, registerables } from 'chart.js'
  import { onMount } from 'svelte'

  // Chart.js 등록
  Chart.register(...registerables)

  interface Props {
    categoryStats?: any[]
    height?: string
  }

  const { categoryStats = [], height = '400px' }: Props = $props()

  let chart: Chart | null = null
  const chartId = `category-spending-${Math.random().toString(36).substr(2, 9)}`

  onMount(() => {
    // 컴포넌트 마운트 시에는 차트를 생성하지 않음
    // 데이터가 준비되면 $effect에서 처리

    return () => {
      // 컴포넌트 언마운트 시 차트 정리
      if (chart) {
        chart.destroy()
        chart = null
      }
    }
  })

  function createChart(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 기존 차트 제거
    if (chart) {
      chart.destroy()
      chart = null
    }

    // 캔버스 정리
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 색상 팔레트 (더 다양하고 구분하기 쉬운 색상)
    const colorPalette = [
      '#3B82F6', // 파란색
      '#EF4444', // 빨간색
      '#10B981', // 녹색
      '#F59E0B', // 주황색
      '#8B5CF6', // 보라색
      '#EC4899', // 분홍색
      '#06B6D4', // 청록색
      '#84CC16', // 라임색
      '#F97316', // 진한 주황색
      '#6366F1', // 남색
    ]

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryStats.map((cat) => cat.name),
        datasets: [
          {
            data: categoryStats.map((cat) => cat.amount),
            backgroundColor: categoryStats.map((cat, index) => {
              // 특정 카테고리별 고정 색상
              const categoryColors: Record<string, string> = {
                급여: '#EF4444', // 빨간색
                임대료: '#F59E0B', // 주황색
                공과금: '#10B981', // 녹색
                마케팅: '#8B5CF6', // 보라색
                기타지출: '#6B7280', // 회색
                기타수입: '#3B82F6', // 파란색
                매출: '#10B981', // 녹색
                계좌이체: '#EC4899', // 분홍색
              }

              return categoryColors[cat.name] || colorPalette[index % colorPalette.length]
            }),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '카테고리별 지출 분석',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            position: 'right' as const,
            labels: {
              usePointStyle: true,
              padding: 20,
              generateLabels: function (chart) {
                const data = chart.data
                if (data.labels && data.datasets) {
                  return data.labels.map((label, index) => {
                    const value = data.datasets[0].data[index] as number
                    const percentage = categoryStats[index]?.percentage || 0

                    // 카테고리별 고정 색상 적용
                    const categoryColors: Record<string, string> = {
                      급여: '#EF4444', // 빨간색
                      임대료: '#F59E0B', // 주황색
                      공과금: '#10B981', // 녹색
                      마케팅: '#8B5CF6', // 보라색
                      기타지출: '#6B7280', // 회색
                      기타수입: '#3B82F6', // 파란색
                      매출: '#10B981', // 녹색
                      계좌이체: '#EC4899', // 분홍색
                    }

                    const categoryName = String(label)
                    const color =
                      categoryColors[categoryName] || colorPalette[index % colorPalette.length]

                    return {
                      text: `${label} (${percentage.toFixed(1)}%)`,
                      fillStyle: color,
                      strokeStyle: data.datasets[0].borderColor as string,
                      lineWidth: data.datasets[0].borderWidth as number,
                      pointStyle: 'circle',
                      hidden: false,
                      index: index,
                    }
                  })
                }
                return []
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed
                const percentage = categoryStats[context.dataIndex]?.percentage || 0
                return [
                  `${context.label}: ${formatCurrency(value)}`,
                  `비율: ${percentage.toFixed(1)}%`,
                ]
              },
            },
          },
        },
        cutout: '50%',
      },
    })
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 데이터 변경 시 차트 업데이트
  $effect(() => {
    if (categoryStats && categoryStats.length > 0) {
      const canvas = document.getElementById(chartId) as HTMLCanvasElement
      if (canvas) {
        createChart(canvas)
      }
    }
  })
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
  <div class="mb-4">
    <h3 class="text-lg font-medium text-gray-900">카테고리별 지출 분석</h3>
    <p class="text-sm text-gray-500">최근 6개월간 카테고리별 지출 비율</p>
  </div>

  {#if categoryStats && categoryStats.length > 0}
    <div class="relative" style:height>
      <canvas id={chartId}></canvas>
    </div>

    <!-- 카테고리별 상세 정보 -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each categoryStats.slice(0, 6) as category, index}
        {@const categoryColors = {
          급여: '#EF4444', // 빨간색
          임대료: '#F59E0B', // 주황색
          공과금: '#10B981', // 녹색
          마케팅: '#8B5CF6', // 보라색
          기타지출: '#6B7280', // 회색
          기타수입: '#3B82F6', // 파란색
          매출: '#10B981', // 녹색
          계좌이체: '#EC4899', // 분홍색
        }}
        {@const colorPalette = [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#6366F1',
        ]}
        {@const categoryColor =
          categoryColors[category.name] || colorPalette[index % colorPalette.length]}
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <div class="w-4 h-4 rounded-full mr-3" style:background-color={categoryColor}></div>
            <span class="font-medium text-gray-900">{category.name}</span>
          </div>
          <div class="text-right">
            <div class="font-semibold text-gray-900">{formatCurrency(category.amount)}</div>
            <div class="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex items-center justify-center h-64 text-gray-500">
      <div class="text-center">
        <p class="text-lg font-medium">지출 데이터가 없습니다</p>
        <p class="text-sm">지출 거래 내역을 추가하면 차트가 표시됩니다.</p>
      </div>
    </div>
  {/if}
</div>
