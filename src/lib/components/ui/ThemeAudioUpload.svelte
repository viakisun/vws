<script lang="ts">
	// Props
	interface Props {
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (audioUrl: string) => void;
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

	// Get audio upload classes
	function getAudioUploadClasses(): string {
		const baseClasses = 'theme-audioupload';
		const sizeClass = `theme-audioupload-${size}`;
		const variantClass = `theme-audioupload-${variant}`;
		const disabledClass = disabled ? 'theme-audioupload-disabled' : '';
		const dragOverClass = isDragOver ? 'theme-audioupload-dragover' : '';

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
		
		if (file && file.type.startsWith('audio/')) {
			uploadAudio(file);
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
		if (file && file.type.startsWith('audio/')) {
			uploadAudio(file);
		}
	}

	// Handle click
	function handleClick() {
		if (!disabled && !isUploading) {
			const input = document.getElementById('audio-input') as HTMLInputElement;
			input?.click();
		}
	}

	// Upload audio
	function uploadAudio(file: File) {
		isUploading = true;
		
		// Create a FileReader to convert the file to a data URL
		const reader = new FileReader();
		reader.onload = (e) => {
			const audioUrl = e.target?.result as string;
			value = audioUrl;
			if (onchange) {
				onchange(audioUrl);
			}
			isUploading = false;
		};
		reader.onerror = () => {
			isUploading = false;
		};
		reader.readAsDataURL(file);
	}

	// Remove audio
	function removeAudio() {
		value = '';
		if (onchange) {
			onchange('');
		}
	}

	// Get audio preview style
	function getAudioPreviewStyle(): string {
		return `background-image: url(${value});`;
	}
</script>

<div
	class={getAudioUploadClasses()}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	{...restProps}
>
	<input
		id="audio-input"
		type="file"
		accept="audio/*"
		{disabled}
		onchange={handleFileChange}
		style="display: none;"
		aria-label="Audio upload"
	/>

	{#if value}
		<div class="theme-audioupload-preview">
			<audio
				src={value}
				controls
				class="theme-audioupload-audio"
				onclick={(e) => e.stopPropagation()}
			></audio>
			
			<div class="theme-audioupload-overlay">
				<button
					class="theme-audioupload-remove"
					onclick={(e) => { e.stopPropagation(); removeAudio(); }}
					{disabled}
					aria-label="Remove audio"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="theme-audioupload-content">
			{#if isUploading}
				<div class="theme-audioupload-spinner">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60">
							<animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;60 0;0 60" repeatCount="indefinite"/>
							<animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-60;-60" repeatCount="indefinite"/>
						</circle>
					</svg>
				</div>
			{:else}
				<div class="theme-audioupload-icon" style="color: {getColor()};">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
					</svg>
				</div>
			{/if}

			<div class="theme-audioupload-text">
				<div class="theme-audioupload-title">
					{isUploading ? 'Uploading...' : 'Drop audio here or click to upload'}
				</div>
				<div class="theme-audioupload-subtitle">
					{isUploading ? 'Please wait' : 'Select an audio file'}
				</div>
			</div>
		</div>
	{/if}

	{#if children}
		<div class="theme-audioupload-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-audioupload {
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

	.theme-audioupload:hover:not(.theme-audioupload-disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.theme-audioupload-dragover {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		transform: scale(1.02);
	}

	.theme-audioupload-preview {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.theme-audioupload-audio {
		width: 100%;
		max-width: 400px;
		height: 40px;
		border-radius: 8px;
	}

	.theme-audioupload-overlay {
		position: absolute;
		top: 8px;
		right: 8px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.theme-audioupload:hover .theme-audioupload-overlay {
		opacity: 1;
	}

	.theme-audioupload-remove {
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

	.theme-audioupload-remove:hover {
		background: var(--color-error-hover);
		transform: scale(1.1);
	}

	.theme-audioupload-remove:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-audioupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-audioupload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;
		padding: 24px;
	}

	.theme-audioupload-icon {
		font-size: 48px;
		line-height: 1;
	}

	.theme-audioupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-audioupload-spinner {
		font-size: 48px;
		line-height: 1;
		color: var(--color-primary);
	}

	.theme-audioupload-spinner svg {
		width: 48px;
		height: 48px;
		animation: spin 1s linear infinite;
	}

	.theme-audioupload-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.theme-audioupload-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-audioupload-subtitle {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.theme-audioupload-children {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	}

	/* Sizes */
	.theme-audioupload-sm {
		aspect-ratio: 4/3;
	}

	.theme-audioupload-sm .theme-audioupload-icon {
		font-size: 32px;
	}

	.theme-audioupload-sm .theme-audioupload-icon svg {
		width: 32px;
		height: 32px;
	}

	.theme-audioupload-sm .theme-audioupload-spinner {
		font-size: 32px;
	}

	.theme-audioupload-sm .theme-audioupload-spinner svg {
		width: 32px;
		height: 32px;
	}

	.theme-audioupload-sm .theme-audioupload-title {
		font-size: 14px;
	}

	.theme-audioupload-sm .theme-audioupload-subtitle {
		font-size: 12px;
	}

	.theme-audioupload-sm .theme-audioupload-remove {
		width: 32px;
		height: 32px;
	}

	.theme-audioupload-sm .theme-audioupload-remove svg {
		width: 16px;
		height: 16px;
	}

	.theme-audioupload-md {
		aspect-ratio: 16/9;
	}

	.theme-audioupload-md .theme-audioupload-icon {
		font-size: 48px;
	}

	.theme-audioupload-md .theme-audioupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-audioupload-md .theme-audioupload-spinner {
		font-size: 48px;
	}

	.theme-audioupload-md .theme-audioupload-spinner svg {
		width: 48px;
		height: 48px;
	}

	.theme-audioupload-md .theme-audioupload-title {
		font-size: 16px;
	}

	.theme-audioupload-md .theme-audioupload-subtitle {
		font-size: 14px;
	}

	.theme-audioupload-md .theme-audioupload-remove {
		width: 40px;
		height: 40px;
	}

	.theme-audioupload-md .theme-audioupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-audioupload-lg {
		aspect-ratio: 16/9;
	}

	.theme-audioupload-lg .theme-audioupload-icon {
		font-size: 64px;
	}

	.theme-audioupload-lg .theme-audioupload-icon svg {
		width: 64px;
		height: 64px;
	}

	.theme-audioupload-lg .theme-audioupload-spinner {
		font-size: 64px;
	}

	.theme-audioupload-lg .theme-audioupload-spinner svg {
		width: 64px;
		height: 64px;
	}

	.theme-audioupload-lg .theme-audioupload-title {
		font-size: 18px;
	}

	.theme-audioupload-lg .theme-audioupload-subtitle {
		font-size: 16px;
	}

	.theme-audioupload-lg .theme-audioupload-remove {
		width: 48px;
		height: 48px;
	}

	.theme-audioupload-lg .theme-audioupload-remove svg {
		width: 24px;
		height: 24px;
	}

	.theme-audioupload-xl {
		aspect-ratio: 16/9;
	}

	.theme-audioupload-xl .theme-audioupload-icon {
		font-size: 80px;
	}

	.theme-audioupload-xl .theme-audioupload-icon svg {
		width: 80px;
		height: 80px;
	}

	.theme-audioupload-xl .theme-audioupload-spinner {
		font-size: 80px;
	}

	.theme-audioupload-xl .theme-audioupload-spinner svg {
		width: 80px;
		height: 80px;
	}

	.theme-audioupload-xl .theme-audioupload-title {
		font-size: 20px;
	}

	.theme-audioupload-xl .theme-audioupload-subtitle {
		font-size: 18px;
	}

	.theme-audioupload-xl .theme-audioupload-remove {
		width: 56px;
		height: 56px;
	}

	.theme-audioupload-xl .theme-audioupload-remove svg {
		width: 28px;
		height: 28px;
	}

	/* States */
	.theme-audioupload-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-audioupload-disabled:hover {
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
		.theme-audioupload {
			aspect-ratio: 4/3;
		}

		.theme-audioupload-content {
			padding: 16px;
			gap: 12px;
		}

		.theme-audioupload-icon {
			font-size: 40px;
		}

		.theme-audioupload-icon svg {
			width: 40px;
			height: 40px;
		}

		.theme-audioupload-spinner {
			font-size: 40px;
		}

		.theme-audioupload-spinner svg {
			width: 40px;
			height: 40px;
		}

		.theme-audioupload-title {
			font-size: 15px;
		}

		.theme-audioupload-subtitle {
			font-size: 13px;
		}

		.theme-audioupload-remove {
			width: 36px;
			height: 36px;
		}

		.theme-audioupload-remove svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
