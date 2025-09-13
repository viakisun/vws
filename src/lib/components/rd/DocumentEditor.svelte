<script lang="ts">
	import ThemeCard from '$lib/components/ui/ThemeCard.svelte';
	import ThemeButton from '$lib/components/ui/ThemeButton.svelte';
	import ThemeInput from '$lib/components/ui/ThemeInput.svelte';
	import ThemeSelect from '$lib/components/ui/ThemeSelect.svelte';
	import { SaveIcon, DownloadIcon, UploadIcon, FileTextIcon } from 'lucide-svelte';

	interface DocumentField {
		id: string;
		label: string;
		type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect';
		required: boolean;
		options?: string[];
		placeholder?: string;
		value?: any;
	}

	interface DocumentTemplate {
		id: string;
		name: string;
		category: string;
		fields: DocumentField[];
	}

	let {
		template,
		projectId,
		onSave,
		onCancel
	} = $props<{
		template: DocumentTemplate;
		projectId: string;
		onSave: (data: any) => void;
		onCancel: () => void;
	}>();

	let formData = $state<Record<string, any>>({});
	let isDraft = $state(true);

	// 폼 데이터 초기화
	$effect(() => {
		if (template) {
			const initialData: Record<string, any> = {};
			template.fields.forEach((field: DocumentField) => {
				initialData[field.id] = field.value || '';
			});
			formData = initialData;
		}
	});

	function handleSave() {
		onSave({
			...formData,
			projectId,
			templateId: template.id,
			status: isDraft ? 'draft' : 'submitted'
		});
	}

	function handleExport() {
		// PDF 또는 Word 문서로 내보내기
		const content = generateDocumentContent();
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${template.name}_${new Date().toISOString().split('T')[0]}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function generateDocumentContent(): string {
		let content = `${template.name}\n`;
		content += '='.repeat(template.name.length) + '\n\n';
		
		template.fields.forEach((field: DocumentField) => {
			content += `${field.label}: ${formData[field.id] || ''}\n`;
		});
		
		return content;
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			// 파일 내용을 읽어서 폼에 채우기
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				// 간단한 파싱 로직 (실제로는 더 정교한 파싱 필요)
				console.log('파일 내용:', content);
			};
			reader.readAsText(file);
		}
	}
</script>

<ThemeCard class="p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold" style="color: var(--color-text);">{template.name}</h3>
			<p class="text-sm" style="color: var(--color-text-secondary);">프로젝트: {projectId}</p>
		</div>
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-2 cursor-pointer">
				<input 
					type="checkbox" 
					bind:checked={isDraft}
					class="rounded"
				/>
				<span class="text-sm" style="color: var(--color-text-secondary);">임시저장</span>
			</label>
		</div>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
		{#each template.fields as field}
			<div>
				<label for={field.id} class="block text-sm font-medium mb-2" style="color: var(--color-text);">
					{field.label}
					{#if field.required}
						<span class="text-red-500 ml-1">*</span>
					{/if}
				</label>
				
				{#if field.type === 'textarea'}
					<textarea
						id={field.id}
						bind:value={formData[field.id]}
						placeholder={field.placeholder}
						required={field.required}
						rows="4"
						class="w-full px-3 py-2 border rounded-md resize-none"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
					></textarea>
				{:else if field.type === 'select'}
					<select
						id={field.id}
						bind:value={formData[field.id]}
						required={field.required}
						class="w-full px-3 py-2 border rounded-md"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="">{field.placeholder || '선택하세요'}</option>
						{#each field.options || [] as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				{:else if field.type === 'multiselect'}
					<div class="space-y-2">
						{#each field.options || [] as option}
							<label class="flex items-center gap-2">
								<input 
									type="checkbox" 
									value={option}
									bind:group={formData[field.id]}
									class="rounded"
								/>
								<span class="text-sm" style="color: var(--color-text);">{option}</span>
							</label>
						{/each}
					</div>
				{:else}
					<input
						id={field.id}
						type={field.type}
						bind:value={formData[field.id]}
						placeholder={field.placeholder}
						required={field.required}
						class="w-full px-3 py-2 border rounded-md"
						style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);"
					/>
				{/if}
			</div>
		{/each}

		<div class="flex items-center justify-between pt-6 border-t" style="border-color: var(--color-border);">
			<div class="flex items-center gap-2">
				<label class="flex items-center gap-2 cursor-pointer">
					<UploadIcon size={16} style="color: var(--color-text-secondary);" />
					<span class="text-sm" style="color: var(--color-text-secondary);">파일 업로드</span>
					<input
						type="file"
						accept=".txt,.doc,.docx,.pdf"
						onchange={handleFileUpload}
						class="hidden"
					/>
				</label>
				<ThemeButton variant="ghost" size="sm" onclick={handleExport}>
					<DownloadIcon size={16} class="mr-1" />
					내보내기
				</ThemeButton>
			</div>
			
			<div class="flex items-center gap-2">
				<ThemeButton variant="secondary" onclick={onCancel}>
					취소
				</ThemeButton>
				<ThemeButton variant="primary" onclick={handleSave}>
					<SaveIcon size={16} class="mr-2" />
					{isDraft ? '임시저장' : '제출'}
				</ThemeButton>
			</div>
		</div>
	</form>
</ThemeCard>
