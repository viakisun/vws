<script lang="ts">
  import { Chart, registerables } from 'chart.js'
  import { onMount } from 'svelte'

  // Chart.js 등록
  Chart.register(...registerables)

  interface Props {
    monthlyStats?: any[]
    height?: string
  }

  let { monthlyStats = [], height = '400px' }: Props = $props()

  let chart: Chart | null = null
  const chartId = `monthly-trend-${Math.random().toString(36).substr(2, 9)}`

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

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyStats.map((stat) => stat.monthDisplay),
        datasets: [
          {
            label: '수입',
            data: monthlyStats.map((stat) => stat.totalIncome),
            borderColor: '#10B981', // 녹색 (수입)
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
          {
            label: '지출',
            data: monthlyStats.map((stat) => stat.totalExpense),
            borderColor: '#EF4444', // 빨간색 (지출)
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#EF4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
          {
            label: '순 현금흐름',
            data: monthlyStats.map((stat) => stat.netFlow),
            borderColor: '#3B82F6', // 파란색 (순현금흐름)
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '최근 6개월 자금 현황',
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          legend: {
            position: 'top' as const,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y
                return `${context.dataset.label}: ${formatCurrency(value)}`
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value as number)
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
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
    if (monthlyStats && monthlyStats.length > 0) {
      const canvas = document.getElementById(chartId) as HTMLCanvasElement
      if (canvas) {
        createChart(canvas)
      }
    }
  })
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
  <div class="mb-4">
    <h3 class="text-lg font-medium text-gray-900">최근 6개월 자금 현황</h3>
    <p class="text-sm text-gray-500">월별 수입, 지출, 순 현금흐름 추이</p>
  </div>

  {#if monthlyStats && monthlyStats.length > 0}
    <div class="relative" style:height>
      <canvas id={chartId}></canvas>
    </div>
  {:else}
    <div class="flex items-center justify-center h-64 text-gray-500">
      <div class="text-center">
        <p class="text-lg font-medium">데이터가 없습니다</p>
        <p class="text-sm">거래 내역을 추가하면 차트가 표시됩니다.</p>
      </div>
    </div>
  {/if}
</div>
