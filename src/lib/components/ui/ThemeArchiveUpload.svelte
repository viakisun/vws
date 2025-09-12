<script lang="ts">
	// Props
	interface Props {
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (archiveUrl: string) => void;
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

	// Get archive upload classes
	function getArchiveUploadClasses(): string {
		const baseClasses = 'theme-archiveupload';
		const sizeClass = `theme-archiveupload-${size}`;
		const variantClass = `theme-archiveupload-${variant}`;
		const disabledClass = disabled ? 'theme-archiveupload-disabled' : '';
		const dragOverClass = isDragOver ? 'theme-archiveupload-dragover' : '';

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
			uploadArchive(file);
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
			uploadArchive(file);
		}
	}

	// Handle click
	function handleClick() {
		if (!disabled && !isUploading) {
			const input = document.getElementById('archive-input') as HTMLInputElement;
			input?.click();
		}
	}

	// Upload archive
	function uploadArchive(file: File) {
		isUploading = true;
		
		// Create a FileReader to convert the file to a data URL
		const reader = new FileReader();
		reader.onload = (e) => {
			const archiveUrl = e.target?.result as string;
			value = archiveUrl;
			if (onchange) {
				onchange(archiveUrl);
			}
			isUploading = false;
		};
		reader.onerror = () => {
			isUploading = false;
		};
		reader.readAsDataURL(file);
	}

	// Remove archive
	function removeArchive() {
		value = '';
		if (onchange) {
			onchange('');
		}
	}

	// Get archive preview style
	function getArchivePreviewStyle(): string {
		return `background-image: url(${value});`;
	}
</script>

<div
	class={getArchiveUploadClasses()}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	{...restProps}
>
	<input
		id="archive-input"
		type="file"
		accept=".zip,.rar,.7z,.tar,.gz"
		{disabled}
		onchange={handleFileChange}
		style="display: none;"
		aria-label="Archive upload"
	/>

	{#if value}
		<div class="theme-archiveupload-preview">
			<div class="theme-archiveupload-archive">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
					<polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
					<line x1="12" y1="22.08" x2="12" y2="12"/>
				</svg>
			</div>
			
			<div class="theme-archiveupload-overlay">
				<button
					class="theme-archiveupload-remove"
					onclick={(e) => { e.stopPropagation(); removeArchive(); }}
					{disabled}
					aria-label="Remove archive"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="theme-archiveupload-content">
			{#if isUploading}
				<div class="theme-archiveupload-spinner">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60">
							<animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;60 0;0 60" repeatCount="indefinite"/>
							<animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-60;-60" repeatCount="indefinite"/>
						</circle>
					</svg>
				</div>
			{:else}
				<div class="theme-archiveupload-icon" style="color: {getColor()};">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
						<polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
						<line x1="12" y1="22.08" x2="12" y2="12"/>
					</svg>
				</div>
			{/if}

			<div class="theme-archiveupload-text">
				<div class="theme-archiveupload-title">
					{isUploading ? 'Uploading...' : 'Drop archive here or click to upload'}
				</div>
				<div class="theme-archiveupload-subtitle">
					{isUploading ? 'Please wait' : 'Select an archive file'}
				</div>
			</div>
		</div>
	{/if}

	{#if children}
		<div class="theme-archiveupload-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-archiveupload {
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

	.theme-archiveupload:hover:not(.theme-archiveupload-disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.theme-archiveupload-dragover {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		transform: scale(1.02);
	}

	.theme-archiveupload-preview {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-archiveupload-archive {
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

	.theme-archiveupload-archive svg {
		width: 60px;
		height: 60px;
	}

	.theme-archiveupload-overlay {
		position: absolute;
		top: 8px;
		right: 8px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.theme-archiveupload:hover .theme-archiveupload-overlay {
		opacity: 1;
	}

	.theme-archiveupload-remove {
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

	.theme-archiveupload-remove:hover {
		background: var(--color-error-hover);
		transform: scale(1.1);
	}

	.theme-archiveupload-remove:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-archiveupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-archiveupload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;
		padding: 24px;
	}

	.theme-archiveupload-icon {
		font-size: 48px;
		line-height: 1;
	}

	.theme-archiveupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-archiveupload-spinner {
		font-size: 48px;
		line-height: 1;
		color: var(--color-primary);
	}

	.theme-archiveupload-spinner svg {
		width: 48px;
		height: 48px;
		animation: spin 1s linear infinite;
	}

	.theme-archiveupload-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.theme-archiveupload-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-archiveupload-subtitle {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.theme-archiveupload-children {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	}

	/* Sizes */
	.theme-archiveupload-sm {
		aspect-ratio: 4/3;
	}

	.theme-archiveupload-sm .theme-archiveupload-icon {
		font-size: 32px;
	}

	.theme-archiveupload-sm .theme-archiveupload-icon svg {
		width: 32px;
		height: 32px;
	}

	.theme-archiveupload-sm .theme-archiveupload-spinner {
		font-size: 32px;
	}

	.theme-archiveupload-sm .theme-archiveupload-spinner svg {
		width: 32px;
		height: 32px;
	}

	.theme-archiveupload-sm .theme-archiveupload-title {
		font-size: 14px;
	}

	.theme-archiveupload-sm .theme-archiveupload-subtitle {
		font-size: 12px;
	}

	.theme-archiveupload-sm .theme-archiveupload-remove {
		width: 32px;
		height: 32px;
	}

	.theme-archiveupload-sm .theme-archiveupload-remove svg {
		width: 16px;
		height: 16px;
	}

	.theme-archiveupload-sm .theme-archiveupload-archive {
		width: 80px;
		height: 80px;
	}

	.theme-archiveupload-sm .theme-archiveupload-archive svg {
		width: 40px;
		height: 40px;
	}

	.theme-archiveupload-md {
		aspect-ratio: 16/9;
	}

	.theme-archiveupload-md .theme-archiveupload-icon {
		font-size: 48px;
	}

	.theme-archiveupload-md .theme-archiveupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-archiveupload-md .theme-archiveupload-spinner {
		font-size: 48px;
	}

	.theme-archiveupload-md .theme-archiveupload-spinner svg {
		width: 48px;
		height: 48px;
	}

	.theme-archiveupload-md .theme-archiveupload-title {
		font-size: 16px;
	}

	.theme-archiveupload-md .theme-archiveupload-subtitle {
		font-size: 14px;
	}

	.theme-archiveupload-md .theme-archiveupload-remove {
		width: 40px;
		height: 40px;
	}

	.theme-archiveupload-md .theme-archiveupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-archiveupload-md .theme-archiveupload-archive {
		width: 120px;
		height: 120px;
	}

	.theme-archiveupload-md .theme-archiveupload-archive svg {
		width: 60px;
		height: 60px;
	}

	.theme-archiveupload-lg {
		aspect-ratio: 16/9;
	}

	.theme-archiveupload-lg .theme-archiveupload-icon {
		font-size: 64px;
	}

	.theme-archiveupload-lg .theme-archiveupload-icon svg {
		width: 64px;
		height: 64px;
	}

	.theme-archiveupload-lg .theme-archiveupload-spinner {
		font-size: 64px;
	}

	.theme-archiveupload-lg .theme-archiveupload-spinner svg {
		width: 64px;
		height: 64px;
	}

	.theme-archiveupload-lg .theme-archiveupload-title {
		font-size: 18px;
	}

	.theme-archiveupload-lg .theme-archiveupload-subtitle {
		font-size: 16px;
	}

	.theme-archiveupload-lg .theme-archiveupload-remove {
		width: 48px;
		height: 48px;
	}

	.theme-archiveupload-lg .theme-archiveupload-remove svg {
		width: 24px;
		height: 24px;
	}

	.theme-archiveupload-lg .theme-archiveupload-archive {
		width: 160px;
		height: 160px;
	}

	.theme-archiveupload-lg .theme-archiveupload-archive svg {
		width: 80px;
		height: 80px;
	}

	.theme-archiveupload-xl {
		aspect-ratio: 16/9;
	}

	.theme-archiveupload-xl .theme-archiveupload-icon {
		font-size: 80px;
	}

	.theme-archiveupload-xl .theme-archiveupload-icon svg {
		width: 80px;
		height: 80px;
	}

	.theme-archiveupload-xl .theme-archiveupload-spinner {
		font-size: 80px;
	}

	.theme-archiveupload-xl .theme-archiveupload-spinner svg {
		width: 80px;
		height: 80px;
	}

	.theme-archiveupload-xl .theme-archiveupload-title {
		font-size: 20px;
	}

	.theme-archiveupload-xl .theme-archiveupload-subtitle {
		font-size: 18px;
	}

	.theme-archiveupload-xl .theme-archiveupload-remove {
		width: 56px;
		height: 56px;
	}

	.theme-archiveupload-xl .theme-archiveupload-remove svg {
		width: 28px;
		height: 28px;
	}

	.theme-archiveupload-xl .theme-archiveupload-archive {
		width: 200px;
		height: 200px;
	}

	.theme-archiveupload-xl .theme-archiveupload-archive svg {
		width: 100px;
		height: 100px;
	}

	/* States */
	.theme-archiveupload-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-archiveupload-disabled:hover {
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
		.theme-archiveupload {
			aspect-ratio: 4/3;
		}

		.theme-archiveupload-content {
			padding: 16px;
			gap: 12px;
		}

		.theme-archiveupload-icon {
			font-size: 40px;
		}

		.theme-archiveupload-icon svg {
			width: 40px;
			height: 40px;
		}

		.theme-archiveupload-spinner {
			font-size: 40px;
		}

		.theme-archiveupload-spinner svg {
			width: 40px;
			height: 40px;
		}

		.theme-archiveupload-title {
			font-size: 15px;
		}

		.theme-archiveupload-subtitle {
			font-size: 13px;
		}

		.theme-archiveupload-remove {
			width: 36px;
			height: 36px;
		}

		.theme-archiveupload-remove svg {
			width: 18px;
			height: 18px;
		}

		.theme-archiveupload-archive {
			width: 100px;
			height: 100px;
		}

		.theme-archiveupload-archive svg {
			width: 50px;
			height: 50px;
		}
	}
</style>
