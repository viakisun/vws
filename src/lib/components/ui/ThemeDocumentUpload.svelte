<script lang="ts">
	// Props
	interface Props {
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (documentUrl: string) => void;
		children?: any;
	}

	let {
		value = '',
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// State
	let isDragOver = $state(false);
	let isUploading = $state(false);

	// Get document upload classes
	function getDocumentUploadClasses(): string {
		const baseClasses = 'theme-documentupload';
		const sizeClass = `theme-documentupload-${size}`;
		const variantClass = `theme-documentupload-${variant}`;
		const disabledClass = disabled ? 'theme-documentupload-disabled' : '';
		const dragOverClass = isDragOver ? 'theme-documentupload-dragover' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, dragOverClass, className].filter(Boolean).join(' ');
	}

	// Get color for variant
	function getColor(): string {
		switch (variant) {
			case 'success': return 'var(--color-success)';
			case 'warning': return 'var(--color-warning)';
			case 'error': return 'var(--color-error)';
			case 'info': return 'var(--color-info)';
			default: return 'var(--color-primary)';
		}
	}

	// Handle file change
	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			uploadDocument(file);
		}
	}

	// Handle drag over
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragOver = true;
		}
	}

	// Handle drag leave
	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	// Handle drop
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		if (disabled) return;
		
		const file = event.dataTransfer?.files[0];
		if (file) {
			uploadDocument(file);
		}
	}

	// Handle click
	function handleClick() {
		if (!disabled && !isUploading) {
			const input = document.getElementById('document-input') as HTMLInputElement;
			input?.click();
		}
	}

	// Upload document
	function uploadDocument(file: File) {
		isUploading = true;
		
		// Create a FileReader to convert the file to a data URL
		const reader = new FileReader();
		reader.onload = (e) => {
			const documentUrl = e.target?.result as string;
			value = documentUrl;
			if (onchange) {
				onchange(documentUrl);
			}
			isUploading = false;
		};
		reader.onerror = () => {
			isUploading = false;
		};
		reader.readAsDataURL(file);
	}

	// Remove document
	function removeDocument() {
		value = '';
		if (onchange) {
			onchange('');
		}
	}

	// Get document preview style
	function getDocumentPreviewStyle(): string {
		return `background-image: url(${value});`;
	}
</script>

<div
	class={getDocumentUploadClasses()}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	{...restProps}
>
	<input
		id="document-input"
		type="file"
		accept=".pdf,.doc,.docx,.txt,.rtf"
		{disabled}
		onchange={handleFileChange}
		style="display: none;"
		aria-label="Document upload"
	/>

	{#if value}
		<div class="theme-documentupload-preview">
			<div class="theme-documentupload-document">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
					<polyline points="14,2 14,8 20,8"/>
					<line x1="16" y1="13" x2="8" y2="13"/>
					<line x1="16" y1="17" x2="8" y2="17"/>
					<polyline points="10,9 9,9 8,9"/>
				</svg>
			</div>
			
			<div class="theme-documentupload-overlay">
				<button
					class="theme-documentupload-remove"
					onclick={(e) => { e.stopPropagation(); removeDocument(); }}
					{disabled}
					aria-label="Remove document"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="theme-documentupload-content">
			{#if isUploading}
				<div class="theme-documentupload-spinner">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60">
							<animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;60 0;0 60" repeatCount="indefinite"/>
							<animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-60;-60" repeatCount="indefinite"/>
						</circle>
					</svg>
				</div>
			{:else}
				<div class="theme-documentupload-icon" style="color: {getColor()};">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14,2 14,8 20,8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
						<polyline points="10,9 9,9 8,9"/>
					</svg>
				</div>
			{/if}

			<div class="theme-documentupload-text">
				<div class="theme-documentupload-title">
					{isUploading ? 'Uploading...' : 'Drop document here or click to upload'}
				</div>
				<div class="theme-documentupload-subtitle">
					{isUploading ? 'Please wait' : 'Select a document file'}
				</div>
			</div>
		</div>
	{/if}

	{#if children}
		<div class="theme-documentupload-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-documentupload {
		border: 2px dashed var(--color-border);
		border-radius: 12px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--color-surface);
		position: relative;
		overflow: hidden;
		aspect-ratio: 16/9;
	}

	.theme-documentupload:hover:not(.theme-documentupload-disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.theme-documentupload-dragover {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		transform: scale(1.02);
	}

	.theme-documentupload-preview {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-documentupload-document {
		width: 120px;
		height: 120px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
	}

	.theme-documentupload-document svg {
		width: 60px;
		height: 60px;
	}

	.theme-documentupload-overlay {
		position: absolute;
		top: 8px;
		right: 8px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.theme-documentupload:hover .theme-documentupload-overlay {
		opacity: 1;
	}

	.theme-documentupload-remove {
		width: 40px;
		height: 40px;
		background: var(--color-error);
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		color: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.theme-documentupload-remove:hover {
		background: var(--color-error-hover);
		transform: scale(1.1);
	}

	.theme-documentupload-remove:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-documentupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-documentupload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;
		padding: 24px;
	}

	.theme-documentupload-icon {
		font-size: 48px;
		line-height: 1;
	}

	.theme-documentupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-documentupload-spinner {
		font-size: 48px;
		line-height: 1;
		color: var(--color-primary);
	}

	.theme-documentupload-spinner svg {
		width: 48px;
		height: 48px;
		animation: spin 1s linear infinite;
	}

	.theme-documentupload-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.theme-documentupload-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-documentupload-subtitle {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.theme-documentupload-children {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	}

	/* Sizes */
	.theme-documentupload-sm {
		aspect-ratio: 4/3;
	}

	.theme-documentupload-sm .theme-documentupload-icon {
		font-size: 32px;
	}

	.theme-documentupload-sm .theme-documentupload-icon svg {
		width: 32px;
		height: 32px;
	}

	.theme-documentupload-sm .theme-documentupload-spinner {
		font-size: 32px;
	}

	.theme-documentupload-sm .theme-documentupload-spinner svg {
		width: 32px;
		height: 32px;
	}

	.theme-documentupload-sm .theme-documentupload-title {
		font-size: 14px;
	}

	.theme-documentupload-sm .theme-documentupload-subtitle {
		font-size: 12px;
	}

	.theme-documentupload-sm .theme-documentupload-remove {
		width: 32px;
		height: 32px;
	}

	.theme-documentupload-sm .theme-documentupload-remove svg {
		width: 16px;
		height: 16px;
	}

	.theme-documentupload-sm .theme-documentupload-document {
		width: 80px;
		height: 80px;
	}

	.theme-documentupload-sm .theme-documentupload-document svg {
		width: 40px;
		height: 40px;
	}

	.theme-documentupload-md {
		aspect-ratio: 16/9;
	}

	.theme-documentupload-md .theme-documentupload-icon {
		font-size: 48px;
	}

	.theme-documentupload-md .theme-documentupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-documentupload-md .theme-documentupload-spinner {
		font-size: 48px;
	}

	.theme-documentupload-md .theme-documentupload-spinner svg {
		width: 48px;
		height: 48px;
	}

	.theme-documentupload-md .theme-documentupload-title {
		font-size: 16px;
	}

	.theme-documentupload-md .theme-documentupload-subtitle {
		font-size: 14px;
	}

	.theme-documentupload-md .theme-documentupload-remove {
		width: 40px;
		height: 40px;
	}

	.theme-documentupload-md .theme-documentupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-documentupload-md .theme-documentupload-document {
		width: 120px;
		height: 120px;
	}

	.theme-documentupload-md .theme-documentupload-document svg {
		width: 60px;
		height: 60px;
	}

	.theme-documentupload-lg {
		aspect-ratio: 16/9;
	}

	.theme-documentupload-lg .theme-documentupload-icon {
		font-size: 64px;
	}

	.theme-documentupload-lg .theme-documentupload-icon svg {
		width: 64px;
		height: 64px;
	}

	.theme-documentupload-lg .theme-documentupload-spinner {
		font-size: 64px;
	}

	.theme-documentupload-lg .theme-documentupload-spinner svg {
		width: 64px;
		height: 64px;
	}

	.theme-documentupload-lg .theme-documentupload-title {
		font-size: 18px;
	}

	.theme-documentupload-lg .theme-documentupload-subtitle {
		font-size: 16px;
	}

	.theme-documentupload-lg .theme-documentupload-remove {
		width: 48px;
		height: 48px;
	}

	.theme-documentupload-lg .theme-documentupload-remove svg {
		width: 24px;
		height: 24px;
	}

	.theme-documentupload-lg .theme-documentupload-document {
		width: 160px;
		height: 160px;
	}

	.theme-documentupload-lg .theme-documentupload-document svg {
		width: 80px;
		height: 80px;
	}

	.theme-documentupload-xl {
		aspect-ratio: 16/9;
	}

	.theme-documentupload-xl .theme-documentupload-icon {
		font-size: 80px;
	}

	.theme-documentupload-xl .theme-documentupload-icon svg {
		width: 80px;
		height: 80px;
	}

	.theme-documentupload-xl .theme-documentupload-spinner {
		font-size: 80px;
	}

	.theme-documentupload-xl .theme-documentupload-spinner svg {
		width: 80px;
		height: 80px;
	}

	.theme-documentupload-xl .theme-documentupload-title {
		font-size: 20px;
	}

	.theme-documentupload-xl .theme-documentupload-subtitle {
		font-size: 18px;
	}

	.theme-documentupload-xl .theme-documentupload-remove {
		width: 56px;
		height: 56px;
	}

	.theme-documentupload-xl .theme-documentupload-remove svg {
		width: 28px;
		height: 28px;
	}

	.theme-documentupload-xl .theme-documentupload-document {
		width: 200px;
		height: 200px;
	}

	.theme-documentupload-xl .theme-documentupload-document svg {
		width: 100px;
		height: 100px;
	}

	/* States */
	.theme-documentupload-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-documentupload-disabled:hover {
		border-color: var(--color-border);
		background: var(--color-surface);
		transform: none;
	}

	/* Animations */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-documentupload {
			aspect-ratio: 4/3;
		}

		.theme-documentupload-content {
			padding: 16px;
			gap: 12px;
		}

		.theme-documentupload-icon {
			font-size: 40px;
		}

		.theme-documentupload-icon svg {
			width: 40px;
			height: 40px;
		}

		.theme-documentupload-spinner {
			font-size: 40px;
		}

		.theme-documentupload-spinner svg {
			width: 40px;
			height: 40px;
		}

		.theme-documentupload-title {
			font-size: 15px;
		}

		.theme-documentupload-subtitle {
			font-size: 13px;
		}

		.theme-documentupload-remove {
			width: 36px;
			height: 36px;
		}

		.theme-documentupload-remove svg {
			width: 18px;
			height: 18px;
		}

		.theme-documentupload-document {
			width: 100px;
			height: 100px;
		}

		.theme-documentupload-document svg {
			width: 50px;
			height: 50px;
		}
	}
</style>
