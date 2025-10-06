<script lang="ts">
  import ThemeBadge from '$lib/components/ui/ThemeBadge.svelte'
  import ThemeButton from '$lib/components/ui/ThemeButton.svelte'
  import ThemeCard from '$lib/components/ui/ThemeCard.svelte'
  import type { Customer } from '$lib/sales/types'
  import { keyOf } from '$lib/utils/keyOf'
  import {
    BuildingIcon,
    CalendarIcon,
    CreditCardIcon,
    EditIcon,
    EyeIcon,
    PlusIcon,
    TrashIcon,
    UsersIcon,
  } from '@lucide/svelte'

  let {
    customers = [],
    selectedType = 'all',
    getStatusColor,
    getStatusLabel,
    getTypeLabel,
    onView,
    onEdit,
    onDelete,
    onAdd,
    onTypeChange,
  }: {
    customers: Customer[]
    selectedType?: string
    getStatusColor: (status: string) => string
    getStatusLabel: (status: string) => string
    getTypeLabel: (type: string) => string
    onView: (customer: Customer) => void
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
    onAdd: () => void
    onTypeChange: (type: string) => void
  } = $props()
</script>

<ThemeCard class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-lg font-semibold" style:color="var(--color-text)">거래처 목록</h3>
    <div class="flex items-center gap-2">
      <select
        value={selectedType}
        onchange={(e) => onTypeChange(e.currentTarget.value)}
        class="px-3 py-2 border rounded-md text-sm"
        style:background="var(--color-surface)"
        style:border-color="var(--color-border)"
        style:color="var(--color-text)"
      >
        <option value="all">전체</option>
        <option value="customer">고객</option>
        <option value="supplier">공급업체</option>
        <option value="both">고객/공급업체</option>
      </select>
      <ThemeButton variant="primary" size="sm" onclick={onAdd}>
        <PlusIcon class="w-4 h-4" />
        거래처 추가
      </ThemeButton>
    </div>
  </div>

  <div class="space-y-4">
    {#each customers as customer, i (keyOf(customer, i))}
      <div
        class="flex items-center justify-between p-4 rounded-lg border"
        style:border-color="var(--color-border)"
        style:background="var(--color-surface-elevated)"
      >
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <BuildingIcon size={20} style="color: var(--color-primary);" />
            <h4 class="font-medium" style:color="var(--color-text)">{customer.name}</h4>
            <ThemeBadge variant={getStatusColor(customer.status) as any}>
              {getStatusLabel(customer.status)}
            </ThemeBadge>
            <ThemeBadge variant="info">
              {getTypeLabel(customer.type)}
            </ThemeBadge>
          </div>
          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
            style:color="var(--color-text-secondary)"
          >
            <div class="flex items-center gap-2">
              <UsersIcon size={16} />
              {customer.contact_person}
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon size={16} />
              {customer.contact_phone}
            </div>
            <div class="flex items-center gap-2">
              <CreditCardIcon size={16} />
              {customer.payment_terms}일
            </div>
          </div>
          {#if customer.industry}
            <p class="text-sm mt-2" style:color="var(--color-text-secondary)">
              업종: {customer.industry}
            </p>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <ThemeButton variant="ghost" size="sm" onclick={() => onView(customer)}>
            <EyeIcon size={16} />
          </ThemeButton>
          <ThemeButton variant="ghost" size="sm" onclick={() => onEdit(customer)}>
            <EditIcon size={16} />
          </ThemeButton>
          <ThemeButton variant="ghost" size="sm" onclick={() => onDelete(customer)}>
            <TrashIcon size={16} />
          </ThemeButton>
        </div>
      </div>
    {/each}
  </div>
</ThemeCard>
