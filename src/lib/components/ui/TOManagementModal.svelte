<script lang="ts">
	import ThemeModal from './ThemeModal.svelte';
	import ThemeButton from './ThemeButton.svelte';
	import ThemeInput from './ThemeInput.svelte';
	import { PlusIcon, TrashIcon } from 'lucide-svelte';

	interface TeamTO {
		teamName: string;
		to: number;
	}

	interface Props {
		open: boolean;
		teamTOs: TeamTO[];
		loading?: boolean;
		onclose: () => void;
		onsave: (teamTOs: TeamTO[]) => void;
	}

	let { open, teamTOs, loading = false, onclose, onsave }: Props = $props();

	// 로컬 상태로 T/O 데이터 관리
	let localTeamTOs = $state<TeamTO[]>([]);

	// 모달이 열릴 때 데이터 초기화
	$effect(() => {
		if (open) {
			localTeamTOs = [...teamTOs];
		}
	});

	// 새 팀 추가
	function addTeam() {
		localTeamTOs = [...localTeamTOs, { teamName: '', to: 0 }];
	}

	// 팀 삭제
	function removeTeam(index: number) {
		localTeamTOs = localTeamTOs.filter((_, i) => i !== index);
	}

	// 팀명 변경
	function updateTeamName(index: number, teamName: string) {
		localTeamTOs[index].teamName = teamName;
	}

	// T/O 변경
	function updateTO(index: number, to: number) {
		localTeamTOs[index].to = to;
	}

	// 저장
	function handleSave() {
		onsave(localTeamTOs);
	}

	// 닫기
	function handleClose() {
		onclose();
	}
</script>

<ThemeModal {open} onclose={handleClose} size="lg">
	<div class="space-y-4">
		<div class="mb-6">
			<h2 class="text-xl font-semibold" style="color: var(--color-text);">T/O 관리</h2>
		</div>
		<div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
			각 팀의 정원(T/O)을 설정하세요. 0으로 설정하면 현재 인원이 최대 인원으로 간주됩니다.
		</div>

		<div class="space-y-3">
			{#each localTeamTOs as teamTO, index}
				<div class="flex items-center gap-3 p-3 border rounded-lg" style="border-color: var(--color-border);">
					<div class="flex-1">
						<ThemeInput
							value={teamTO.teamName}
							oninput={(e) => updateTeamName(index, (e.target as HTMLInputElement).value)}
							placeholder="팀명"
							class="mb-2"
						/>
						<ThemeInput
							type="number"
							value={teamTO.to.toString()}
							oninput={(e) => updateTO(index, parseInt((e.target as HTMLInputElement).value) || 0)}
							placeholder="T/O"
						/>
					</div>
					<ThemeButton
						variant="ghost"
						size="sm"
						onclick={() => removeTeam(index)}
						class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
					>
						<TrashIcon size={16} />
					</ThemeButton>
				</div>
			{/each}
		</div>

		<ThemeButton
			variant="secondary"
			onclick={addTeam}
			class="w-full"
		>
			<PlusIcon size={16} class="mr-2" />
			팀 추가
		</ThemeButton>
	</div>

	<div class="flex justify-end gap-3 mt-6 pt-4 border-t" style="border-color: var(--color-border);">
		<ThemeButton variant="ghost" onclick={handleClose}>
			취소
		</ThemeButton>
		<ThemeButton onclick={handleSave} {loading}>
			{loading ? '저장 중...' : '저장'}
		</ThemeButton>
	</div>
</ThemeModal>
