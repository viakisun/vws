<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { formatKRW } from '$lib/utils/format';
	import { expenseDocsStore, updateExpenseStatus, expenseHistories, addExpenseHistory } from '$lib/stores/rnd';

	let status = '' as '' | '대기' | '승인' | '반려';
	let query = '';
	let selectedId: string | null = null;

	$: all = $expenseDocsStore;
	$: filtered = all.filter((d) => (status ? d.status === status : true) && (query ? d.title.includes(query) || d.id.includes(query) : true));
	$: selected = all.find((d) => d.id === selectedId);

	let reason = '';
	function approve() {
		if (selected) {
			updateExpenseStatus(selected.id, '승인');
			addExpenseHistory(selected.id, '승인', reason || undefined);
			reason = '';
		}
	}
	function reject() {
		if (selected) {
			updateExpenseStatus(selected.id, '반려');
			addExpenseHistory(selected.id, '반려', reason || undefined);
			reason = '';
		}
	}
</script>

<Card header="R&D 비용 증빙 문서">
	<div class="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
		<input class="w-full sm:w-64 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="문서 검색" bind:value={query} />
		<select class="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm" bind:value={status}>
			<option value=''>상태: 전체</option>
			<option value='대기'>대기</option>
			<option value='승인'>승인</option>
			<option value='반려'>반려</option>
		</select>
	</div>
	<div class="overflow-auto">
		<table class="min-w-full text-sm">
			<thead class="bg-gray-50 text-left text-gray-600">
				<tr>
					<th class="px-3 py-2">문서번호</th>
					<th class="px-3 py-2">제목</th>
					<th class="px-3 py-2">분류</th>
					<th class="px-3 py-2">분기</th>
					<th class="px-3 py-2">금액</th>
					<th class="px-3 py-2">첨부</th>
					<th class="px-3 py-2">상태</th>
				</tr>
			</thead>
			<tbody class="divide-y">
				{#each filtered as d}
					<tr class="hover:bg-gray-50 cursor-pointer" on:click={() => (selectedId = d.id)}>
						<td class="px-3 py-2">{d.id}</td>
						<td class="px-3 py-2">{d.title}</td>
						<td class="px-3 py-2">{d.category}</td>
						<td class="px-3 py-2">{d.quarter}Q</td>
						<td class="px-3 py-2">{d.amountKRW ? formatKRW(d.amountKRW) : '-'}</td>
						<td class="px-3 py-2">{d.attachments}</td>
						<td class="px-3 py-2">
							<Badge color={d.status === '대기' ? 'yellow' : d.status === '반려' ? 'red' : 'green'}>{d.status}</Badge>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Card>

<Modal open={!!selected} title={selected?.title ?? ''} onClose={() => (selectedId = null)}>
	{#if selected}
		<div class="space-y-3 text-sm">
			<div class="flex items-center justify-between">
				<Badge color={selected.status === '대기' ? 'yellow' : selected.status === '반려' ? 'red' : 'green'}>{selected.status}</Badge>
				<div>{selected.quarter}Q · {selected.category}</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<div class="text-caption">금액</div>
					<div class="font-semibold">{selected.amountKRW ? formatKRW(selected.amountKRW) : '-'}</div>
				</div>
				<div>
					<div class="text-caption">첨부</div>
					<div class="font-semibold">{selected.attachments}개</div>
				</div>
				<div class="col-span-2">
					<div class="text-caption">결재선</div>
					<div>{selected.appRoute.join(' → ')}</div>
				</div>
			</div>
			<div>
				<div class="text-caption mb-1">결재 이력</div>
				{#if $expenseHistories[selected.id]?.length}
					<ul class="space-y-1">
						{#each $expenseHistories[selected.id] as h}
							<li class="flex items-center justify-between">
								<span>{new Date(h.at).toLocaleString('ko-KR')}</span>
								<Badge color={h.status === '반려' ? 'red' : h.status === '대기' ? 'yellow' : 'green'}>{h.status}</Badge>
							</li>
							{#if h.reason}
								<div class="text-xs text-gray-500">사유: {h.reason}</div>
							{/if}
						{/each}
					</ul>
				{:else}
					<div class="text-xs text-gray-500">이력이 없습니다</div>
				{/if}
			</div>
			{#if selected.status === '대기'}
				<div class="pt-2 flex items-center gap-2">
					<input class="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm" placeholder="사유(선택)" bind:value={reason} />
					<button class="px-3 py-1.5 rounded-md bg-success text-white hover:brightness-95" on:click={approve}>승인</button>
					<button class="px-3 py-1.5 rounded-md bg-danger text-white hover:brightness-95" on:click={reject}>반려</button>
				</div>
			{/if}
		</div>
	{/if}
</Modal>

