<script lang="ts">
  type Props = {
    name?: string
    amount?: number
    onNameChange: (name: string) => void
    onAmountChange: (amount: number) => void
  }

  let {
    name = $bindable(''),
    amount = $bindable(0),
    onNameChange,
    onAmountChange,
  }: Props = $props()

  let displayValue = $state(amount ? amount.toLocaleString('ko-KR') : '')

  function handleNameInput(e: Event & { currentTarget: HTMLInputElement }) {
    const newName = e.currentTarget.value
    name = newName
    onNameChange(newName)
  }

  function handleAmountInput(e: Event & { currentTarget: HTMLInputElement }) {
    const value = e.currentTarget.value.replace(/[^0-9]/g, '')
    const newAmount = value === '' ? 0 : Number(value) || 0
    amount = newAmount
    displayValue = value
    onAmountChange(newAmount)
  }

  function handleAmountBlur(e: Event & { currentTarget: HTMLInputElement }) {
    const value = e.currentTarget.value.replace(/[^0-9]/g, '')
    const newAmount = value === '' ? 0 : Number(value) || 0
    amount = newAmount
    displayValue = newAmount.toLocaleString('ko-KR')
    e.currentTarget.value = displayValue
  }
</script>

<div class="flex items-center space-x-2">
  <input
    type="text"
    value={name}
    oninput={handleNameInput}
    class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
  />
  <input
    type="text"
    value={displayValue}
    oninput={handleAmountInput}
    onblur={handleAmountBlur}
    class="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
    placeholder="0"
  />
</div>
