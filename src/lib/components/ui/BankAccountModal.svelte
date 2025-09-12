<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BankAccount } from '$lib/stores/funds';

	const dispatch = createEventDispatcher();

	let { 
		isOpen = $bindable(false),
		account = null
	} = $props<{ 
		isOpen?: boolean;
		account?: BankAccount | null;
	}>();

	let formData = $state({
		name: '',
		balance: 0,
		accountNumber: '',
		bankName: '',
		accountType: 'checking' as 'checking' | 'savings' | 'foreign'
	});

	const accountTypes = [
		{ value: 'checking', label: '당좌계좌' },
		{ value: 'savings', label: '예금계좌' },
		{ value: 'foreign', label: '외화계좌' }
	];

	function initializeForm() {
		if (account) {
			formData = {
				name: account.name,
				balance: account.balance,
				accountNumber: account.accountNumber,
				bankName: account.bankName || '',
				accountType: account.accountType || 'checking'
			};
		} else {
			formData = {
				name: '',
				balance: 0,
				accountNumber: '',
				bankName: '',
				accountType: 'checking'
			};
		}
	}

	function handleSubmit() {
		if (!formData.name || !formData.accountNumber || !formData.bankName) {
			alert('모든 필수 항목을 입력해주세요.');
			return;
		}

		const accountData = {
			...formData,
			balance: Number(formData.balance),
			id: account?.id || `account-${Date.now()}`,
			updatedAt: new Date().toISOString()
		};

		dispatch('submit', accountData);
		closeModal();
	}

	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	function resetForm() {
		formData = {
			name: '',
			balance: 0,
			accountNumber: '',
			bankName: '',
			accountType: 'checking'
		};
	}

	$effect(() => {
		if (isOpen) {
			initializeForm();
		} else {
			resetForm();
		}
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/40" role="button" tabindex="0" onclick={closeModal} onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeModal()}></div>
		<div class="relative w-full max-w-2xl mx-4 rounded-xl bg-white shadow-lg border border-gray-200" role="dialog" aria-modal="true">
			<div class="p-6">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-xl font-semibold">{account ? '계좌 수정' : '계좌 추가'}</h2>
					<button 
						onclick={closeModal}
						class="text-gray-400 hover:text-gray-600"
						aria-label="닫기"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<!-- 계좌명 -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							계좌명 *
						</label>
						<input
							id="name"
							type="text"
							bind:value={formData.name}
							placeholder="예: 주거래계좌, 예금계좌"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<!-- 은행명 -->
					<div>
						<label for="bankName" class="block text-sm font-medium text-gray-700 mb-1">
							은행명 *
						</label>
						<input
							id="bankName"
							type="text"
							bind:value={formData.bankName}
							placeholder="예: 국민은행, 신한은행"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<!-- 계좌번호 -->
					<div>
						<label for="accountNumber" class="block text-sm font-medium text-gray-700 mb-1">
							계좌번호 *
						</label>
						<input
							id="accountNumber"
							type="text"
							bind:value={formData.accountNumber}
							placeholder="예: 123-456-789"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<!-- 계좌 유형 -->
					<div>
						<label for="accountType" class="block text-sm font-medium text-gray-700 mb-1">
							계좌 유형
						</label>
						<select
							id="accountType"
							bind:value={formData.accountType}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each accountTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>

					<!-- 현재 잔고 -->
					<div>
						<label for="balance" class="block text-sm font-medium text-gray-700 mb-1">
							현재 잔고
						</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">₩</span>
							<input
								id="balance"
								type="number"
								bind:value={formData.balance}
								placeholder="0"
								min="0"
								class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<!-- 버튼 -->
					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onclick={closeModal}
							class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
						>
							취소
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							{account ? '수정' : '추가'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
