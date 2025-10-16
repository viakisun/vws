<script lang="ts">
  import type { CRMContract } from '$lib/types/crm'
  import { EditIcon, TrashIcon, FileTextIcon, DownloadIcon } from 'lucide-svelte'
  import ThemeBadge from '../ui/ThemeBadge.svelte'

  interface Props {
    contracts: CRMContract[]
    contractType: 'revenue' | 'expense'
    title: string
    onEdit?: (contractId: string) => void
    onDelete?: (contractId: string) => void
    onDownload?: (contractId: string) => void
  }

  const { contracts, contractType, title, onEdit, onDelete, onDownload }: Props = $props()

  const filteredContracts = $derived(contracts.filter((c) => c.contractType === contractType))

  const totalAmount = $derived(filteredContracts.reduce((sum, c) => sum + c.totalAmount, 0))

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function getStatusColor(status: string): 'success' | 'default' | 'error' {
    switch (status) {
      case 'active':
        return 'success'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return '진행중'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  function calculateProgress(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    if (now < start) return 0
    if (now > end) return 100
    return ((now - start) / (end - start)) * 100
  }
</script>

<div class="bg-white rounded-lg shadow">
  <!-- 헤더 -->
  <div class="px-6 py-4 border-b border-gray-200">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <div class="text-sm">
        <span class="text-gray-600">{filteredContracts.length}건 /</span>
        <span class="font-bold {contractType === 'revenue' ? 'text-green-600 ' : 'text-red-600 '}">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  </div>

  <!-- 테이블 -->
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            계약명
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            상대방
          </th>
          <th
            class="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            금액
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            기간
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            진행률
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            담당자
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            상태
          </th>
          <th
            class="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
          >
            액션
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each filteredContracts as contract (contract.id)}
          {@const progress = calculateProgress(contract.startDate, contract.endDate)}
          <tr class="hover:bg-gray-50 :bg-gray-700/50 transition-colors">
            <td class="px-4 py-3">
              <div>
                <p class="font-medium text-gray-900 text-sm">
                  {contract.title}
                </p>
                <p class="text-xs text-gray-500">{contract.contractNumber}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
              {contract.contractParty}
            </td>
            <td
              class="px-4 py-3 text-sm text-right font-medium {contractType === 'revenue'
                ? 'text-green-600 '
                : 'text-red-600 '}"
            >
              {formatCurrency(contract.totalAmount)}
            </td>
            <td class="px-4 py-3">
              <div class="text-xs text-gray-600">
                {#if contract.startDate}
                  <p>{contract.startDate.split('T')[0]}</p>
                {/if}
                {#if contract.endDate}
                  <p>~ {contract.endDate.split('T')[0]}</p>
                {:else}
                  <p class="text-yellow-600">종료일 미정</p>
                {/if}
              </div>
            </td>
            <td class="px-4 py-3">
              {#if contract.endDate && contract.status === 'active'}
                <div class="w-full">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-gray-700">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full transition-all"
                      style="width: {Math.min(progress, 100)}%"
                    ></div>
                  </div>
                </div>
              {:else}
                <span class="text-xs text-gray-500">-</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
              {contract.assignedTo || '-'}
            </td>
            <td class="px-4 py-3">
              <ThemeBadge variant={getStatusColor(contract.status)}>
                {getStatusLabel(contract.status)}
              </ThemeBadge>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                {#if contract.contractFileS3Key && onDownload}
                  <button
                    type="button"
                    onclick={() => onDownload?.(contract.id)}
                    class="p-1.5 text-gray-600 hover:text-purple-600 :text-purple-400 transition-colors"
                    title="계약서 다운로드"
                  >
                    <DownloadIcon class="w-4 h-4" />
                  </button>
                {/if}
                {#if onEdit}
                  <button
                    type="button"
                    onclick={() => onEdit?.(contract.id)}
                    class="p-1.5 text-gray-600 hover:text-green-600 :text-green-400 transition-colors"
                    title="편집"
                  >
                    <EditIcon class="w-4 h-4" />
                  </button>
                {/if}
                {#if onDelete}
                  <button
                    type="button"
                    onclick={() => onDelete?.(contract.id)}
                    class="p-1.5 text-gray-600 hover:text-red-600 :text-red-400 transition-colors"
                    title="삭제"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if filteredContracts.length === 0}
    <div class="text-center py-12 text-gray-500">
      <FileTextIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>등록된 계약이 없습니다</p>
    </div>
  {/if}
</div>
