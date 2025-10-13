<script lang="ts">
  import type { Customer } from '$lib/types/crm'
  import { CrmDocumentType } from '$lib/constants/crm'
  import { EditIcon, TrashIcon, EyeIcon, BuildingIcon, DownloadIcon, UploadIcon } from 'lucide-svelte'
  import ThemeBadge from '../ui/ThemeBadge.svelte'

  interface Props {
    customers: Customer[]
    onEdit: (customerId: string) => void
    onDelete: (customerId: string) => void
    onView: (customerId: string) => void
    onDownloadDocument?: (customerId: string, type: CrmDocumentType) => void
    onUploadDocument?: (customerId: string, type: CrmDocumentType) => void
  }

  const { customers, onEdit, onDelete, onView, onDownloadDocument, onUploadDocument }: Props = $props()

  function formatCurrency(amount: number): string {
    if (amount === 0) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function getStatusColor(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'prospect':
        return 'warning'
      case 'churned':
        return 'error'
      default:
        return 'default'
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'prospect':
        return '잠재고객'
      case 'churned':
        return '이탈'
      default:
        return status
    }
  }
</script>

<div class="overflow-x-auto">
  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          회사명
        </th>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          대표자
        </th>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          사업자번호
        </th>
        <th
          class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          상태
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          문서
        </th>
        <th
          class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
        >
          액션
        </th>
      </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {#each customers as customer (customer.id)}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <BuildingIcon class="w-4 h-4 text-gray-400" />
              <div>
                <p class="font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
                {#if customer.businessEntityType}
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {customer.businessEntityType === 'individual'
                      ? '개인'
                      : customer.businessEntityType === 'corporation'
                        ? '법인'
                        : customer.businessEntityType === 'nonprofit'
                          ? '비영리'
                          : customer.businessEntityType === 'public'
                            ? '공공'
                            : customer.businessEntityType === 'cooperative'
                              ? '협동조합'
                              : customer.businessEntityType === 'foreign'
                                ? '외국기업'
                                : customer.businessEntityType}
                  </p>
                {/if}
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
            {customer.representativeName || '-'}
          </td>
          <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
            {customer.businessNumber || '-'}
          </td>
          <td class="px-4 py-3">
            <ThemeBadge variant={getStatusColor(customer.status)}>
              {getStatusLabel(customer.status)}
            </ThemeBadge>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center justify-center gap-2">
              <!-- 사업자등록증 -->
              {#if customer.businessRegistrationS3Key}
                <button
                  type="button"
                  onclick={() => onDownloadDocument?.(customer.id, CrmDocumentType.BUSINESS_REGISTRATION)}
                  title="사업자등록증 다운로드"
                  class="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <DownloadIcon class="w-4 h-4" />
                  <span>사업자</span>
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => onUploadDocument?.(customer.id, CrmDocumentType.BUSINESS_REGISTRATION)}
                  title="사업자등록증 업로드"
                  class="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 rounded transition-colors"
                >
                  <UploadIcon class="w-4 h-4" />
                  <span>사업자</span>
                </button>
              {/if}

              <!-- 통장사본 -->
              {#if customer.bankAccountS3Key}
                <button
                  type="button"
                  onclick={() => onDownloadDocument?.(customer.id, CrmDocumentType.BANK_ACCOUNT)}
                  title="통장사본 다운로드"
                  class="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <DownloadIcon class="w-4 h-4" />
                  <span>통장</span>
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => onUploadDocument?.(customer.id, CrmDocumentType.BANK_ACCOUNT)}
                  title="통장사본 업로드"
                  class="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 rounded transition-colors"
                >
                  <UploadIcon class="w-4 h-4" />
                  <span>통장</span>
                </button>
              {/if}
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center justify-center gap-2">
              <button
                type="button"
                onclick={() => onView(customer.id)}
                class="p-1.5 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="상세보기"
              >
                <EyeIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                onclick={() => onEdit(customer.id)}
                class="p-1.5 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                title="편집"
              >
                <EditIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                onclick={() => onDelete(customer.id)}
                class="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="삭제"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if customers.length === 0}
    <div class="text-center py-12 text-gray-500 dark:text-gray-400">
      <BuildingIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>등록된 고객이 없습니다</p>
    </div>
  {/if}
</div>
