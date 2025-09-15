<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeModal from '$lib/components/ui/ThemeModal.svelte';
	import { 
		UploadIcon, 
		DownloadIcon, 
		FileSpreadsheetIcon, 
		CheckCircleIcon, 
		XCircleIcon,
		AlertCircleIcon,
		CalendarIcon
	} from 'lucide-svelte';

	let showUploadModal = $state(false);
	let selectedFile = $state<File | null>(null);
	let selectedYear = $state(new Date().getFullYear());
	let selectedMonth = $state(new Date().getMonth() + 1);
	let isUploading = $state(false);
	let uploadResult = $state<any>(null);
	let showResultModal = $state(false);

	// 월 옵션 생성
	const monthOptions = Array.from({ length: 12 }, (_, i) => ({
		value: i + 1,
		label: `${i + 1}월`
	}));

	// 연도 옵션 생성 (현재 연도 기준 ±2년)
	const yearOptions = Array.from({ length: 5 }, (_, i) => {
		const year = new Date().getFullYear() - 2 + i;
		return { value: year, label: `${year}년` };
	});

	// 파일 선택 처리
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// 파일 확장자 검증
			if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
				alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
				target.value = '';
				return;
			}
			
			selectedFile = file;
		}
	}

	// 템플릿 다운로드
	async function downloadTemplate() {
		try {
			const response = await fetch(`/api/salary/payslips/template?year=${selectedYear}&month=${selectedMonth}`);
			
			if (!response.ok) {
				throw new Error('템플릿 다운로드에 실패했습니다.');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `payslip_template_${selectedYear}_${selectedMonth}.xlsx`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('템플릿 다운로드 실패:', error);
			alert('템플릿 다운로드에 실패했습니다.');
		}
	}

	// 파일 업로드
	async function uploadFile() {
		if (!selectedFile) {
			alert('파일을 선택해주세요.');
			return;
		}

		isUploading = true;
		
		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('period', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`);

			const response = await fetch('/api/salary/payslips/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			
			if (result.success) {
				uploadResult = result;
				showResultModal = true;
				showUploadModal = false;
				selectedFile = null;
			} else {
				alert(`업로드 실패: ${result.error}`);
			}
		} catch (error) {
			console.error('업로드 실패:', error);
			alert('업로드 중 오류가 발생했습니다.');
		} finally {
			isUploading = false;
		}
	}

	// 모달 닫기
	function closeUploadModal() {
		showUploadModal = false;
		selectedFile = null;
	}

	function closeResultModal() {
		showResultModal = false;
		uploadResult = null;
	}
</script>

<!-- 업로드 버튼 -->
<ThemeButton onclick={() => showUploadModal = true} class="bg-green-600 hover:bg-green-700">
	<UploadIcon size={16} class="mr-2" />
	엑셀 일괄 업로드
</ThemeButton>

<!-- 업로드 모달 -->
<ThemeModal bind:open={showUploadModal} size="lg">
	<div class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-gray-900">급여명세서 엑셀 업로드</h2>
			<button
				onclick={closeUploadModal}
				class="p-2 text-gray-400 hover:text-gray-600"
			>
				<XCircleIcon size={20} />
			</button>
		</div>

		<div class="space-y-6">
			<!-- 기간 선택 -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
					<CalendarIcon size={20} class="mr-2" />
					급여 기간 선택
				</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="upload-year" class="block text-sm font-medium text-blue-700 mb-2">연도</label>
						<select
							id="upload-year"
							bind:value={selectedYear}
							class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each yearOptions as year}
								<option value={year.value}>{year.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="upload-month" class="block text-sm font-medium text-blue-700 mb-2">월</label>
						<select
							id="upload-month"
							bind:value={selectedMonth}
							class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each monthOptions as month}
								<option value={month.value}>{month.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- 템플릿 다운로드 -->
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<h3 class="text-lg font-semibold text-amber-800 mb-3 flex items-center">
					<FileSpreadsheetIcon size={20} class="mr-2" />
					엑셀 템플릿 다운로드
				</h3>
				<p class="text-amber-700 mb-3">
					업로드 전에 먼저 템플릿을 다운로드하여 급여 데이터를 입력하세요.
				</p>
				<ThemeButton 
					onclick={downloadTemplate} 
					variant="outline" 
					class="border-amber-300 text-amber-700 hover:bg-amber-100"
				>
					<DownloadIcon size={16} class="mr-2" />
					템플릿 다운로드
				</ThemeButton>
			</div>

			<!-- 파일 업로드 -->
			<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
				<h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
					<UploadIcon size={20} class="mr-2" />
					엑셀 파일 업로드
				</h3>
				<div class="space-y-4">
					<div>
						<label for="file-upload" class="block text-sm font-medium text-gray-700 mb-2">
							파일 선택
						</label>
						<input
							id="file-upload"
							type="file"
							accept=".xlsx,.xls"
							onchange={handleFileSelect}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					{#if selectedFile}
						<div class="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
							<CheckCircleIcon size={20} class="text-green-600 mr-2" />
							<span class="text-green-700 font-medium">{selectedFile.name}</span>
						</div>
					{/if}

					<div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
						<div class="flex items-start">
							<AlertCircleIcon size={20} class="text-yellow-600 mr-2 mt-0.5" />
							<div class="text-yellow-700 text-sm">
								<p class="font-medium mb-1">주의사항:</p>
								<ul class="list-disc list-inside space-y-1">
									<li>템플릿의 형식을 그대로 유지해주세요</li>
									<li>숫자만 입력하고 콤마나 원화 표시는 제외해주세요</li>
									<li>기존 급여명세서가 있으면 덮어쓰기됩니다</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 액션 버튼 -->
			<div class="flex justify-end space-x-3">
				<ThemeButton variant="outline" onclick={closeUploadModal}>
					취소
				</ThemeButton>
				<ThemeButton 
					onclick={uploadFile} 
					disabled={!selectedFile || isUploading}
					class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
				>
					{#if isUploading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
						업로드 중...
					{:else}
						<UploadIcon size={16} class="mr-2" />
						업로드
					{/if}
				</ThemeButton>
			</div>
		</div>
	</div>
</ThemeModal>

<!-- 결과 모달 -->
<ThemeModal bind:open={showResultModal} size="xl">
	<div class="p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-gray-900">업로드 결과</h2>
			<button
				onclick={closeResultModal}
				class="p-2 text-gray-400 hover:text-gray-600"
			>
				<XCircleIcon size={20} />
			</button>
		</div>

		{#if uploadResult}
			<div class="space-y-6">
				<!-- 요약 정보 -->
				<div class="grid grid-cols-3 gap-4">
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
						<CheckCircleIcon size={32} class="text-green-600 mx-auto mb-2" />
						<div class="text-2xl font-bold text-green-700">{uploadResult.results.success}</div>
						<div class="text-sm text-green-600">성공</div>
					</div>
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
						<XCircleIcon size={32} class="text-red-600 mx-auto mb-2" />
						<div class="text-2xl font-bold text-red-700">{uploadResult.results.failed}</div>
						<div class="text-sm text-red-600">실패</div>
					</div>
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
						<FileSpreadsheetIcon size={32} class="text-blue-600 mx-auto mb-2" />
						<div class="text-2xl font-bold text-blue-700">{uploadResult.results.success + uploadResult.results.failed}</div>
						<div class="text-sm text-blue-600">총 처리</div>
					</div>
				</div>

				<!-- 오류 목록 -->
				{#if uploadResult.results.errors.length > 0}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<h3 class="text-lg font-semibold text-red-800 mb-3">오류 목록</h3>
						<div class="max-h-40 overflow-y-auto">
							{#each uploadResult.results.errors as error}
								<div class="text-sm text-red-700 py-1">{error}</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- 상세 결과 -->
				{#if uploadResult.results.details.length > 0}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h3 class="text-lg font-semibold text-gray-800 mb-3">상세 결과</h3>
						<div class="max-h-60 overflow-y-auto">
							<table class="min-w-full text-sm">
								<thead class="bg-gray-100">
									<tr>
										<th class="px-3 py-2 text-left">행</th>
										<th class="px-3 py-2 text-left">사번</th>
										<th class="px-3 py-2 text-left">성명</th>
										<th class="px-3 py-2 text-left">상태</th>
										<th class="px-3 py-2 text-left">지급총액</th>
										<th class="px-3 py-2 text-left">실지급액</th>
									</tr>
								</thead>
								<tbody>
									{#each uploadResult.results.details as detail}
										<tr class="border-t">
											<td class="px-3 py-2">{detail.row}</td>
											<td class="px-3 py-2">{detail.employeeId}</td>
											<td class="px-3 py-2">{detail.name}</td>
											<td class="px-3 py-2">
												{#if detail.status === 'success'}
													<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">성공</span>
												{:else}
													<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">실패</span>
												{/if}
											</td>
											<td class="px-3 py-2">
												{#if detail.totalPayments}
													{new Intl.NumberFormat('ko-KR').format(detail.totalPayments)}원
												{/if}
											</td>
											<td class="px-3 py-2">
												{#if detail.netSalary}
													{new Intl.NumberFormat('ko-KR').format(detail.netSalary)}원
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- 액션 버튼 -->
				<div class="flex justify-end">
					<ThemeButton onclick={closeResultModal} class="bg-blue-600 hover:bg-blue-700">
						확인
					</ThemeButton>
				</div>
			</div>
		{/if}
	</div>
</ThemeModal>
