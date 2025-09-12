<script lang="ts">
	// Props
	interface Props {
		value?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (videoUrl: string) => void;
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

	// Get video upload classes
	function getVideoUploadClasses(): string {
		const baseClasses = 'theme-videoupload';
		const sizeClass = `theme-videoupload-${size}`;
		const variantClass = `theme-videoupload-${variant}`;
		const disabledClass = disabled ? 'theme-videoupload-disabled' : '';
		const dragOverClass = isDragOver ? 'theme-videoupload-dragover' : '';

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
		
		if (file && file.type.startsWith('video/')) {
			uploadVideo(file);
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
		if (file && file.type.startsWith('video/')) {
			uploadVideo(file);
		}
	}

	// Handle click
	function handleClick() {
		if (!disabled && !isUploading) {
			const input = document.getElementById('video-input') as HTMLInputElement;
			input?.click();
		}
	}

	// Upload video
	function uploadVideo(file: File) {
		isUploading = true;
		
		// Create a FileReader to convert the file to a data URL
		const reader = new FileReader();
		reader.onload = (e) => {
			const videoUrl = e.target?.result as string;
			value = videoUrl;
			if (onchange) {
				onchange(videoUrl);
			}
			isUploading = false;
		};
		reader.onerror = () => {
			isUploading = false;
		};
		reader.readAsDataURL(file);
	}

	// Remove video
	function removeVideo() {
		value = '';
		if (onchange) {
			onchange('');
		}
	}

	// Get video preview style
	function getVideoPreviewStyle(): string {
		return `background-image: url(${value});`;
	}
</script>

<div
	class={getVideoUploadClasses()}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	{...restProps}
>
	<input
		id="video-input"
		type="file"
		accept="video/*"
		{disabled}
		onchange={handleFileChange}
		style="display: none;"
		aria-label="Video upload"
	/>

	{#if value}
		<div class="theme-videoupload-preview">
			<video
				src={value}
				controls
				class="theme-videoupload-video"
				onclick={(e) => e.stopPropagation()}
			></video>
			
			<div class="theme-videoupload-overlay">
				<button
					class="theme-videoupload-remove"
					onclick={(e) => { e.stopPropagation(); removeVideo(); }}
					{disabled}
					aria-label="Remove video"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{:else}
		<div class="theme-videoupload-content">
			{#if isUploading}
				<div class="theme-videoupload-spinner">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60">
							<animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;60 0;0 60" repeatCount="indefinite"/>
							<animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-60;-60" repeatCount="indefinite"/>
						</circle>
					</svg>
				</div>
			{:else}
				<div class="theme-videoupload-icon" style="color: {getColor()};">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="23 7 16 12 23 17 23 7"/>
						<rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
					</svg>
				</div>
			{/if}

			<div class="theme-videoupload-text">
				<div class="theme-videoupload-title">
					{isUploading ? 'Uploading...' : 'Drop video here or click to upload'}
				</div>
				<div class="theme-videoupload-subtitle">
					{isUploading ? 'Please wait' : 'Select a video file'}
				</div>
			</div>
		</div>
	{/if}

	{#if children}
		<div class="theme-videoupload-children">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-videoupload {
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

	.theme-videoupload:hover:not(.theme-videoupload-disabled) {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.theme-videoupload-dragover {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
		transform: scale(1.02);
	}

	.theme-videoupload-preview {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.theme-videoupload-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 10px;
	}

	.theme-videoupload-overlay {
		position: absolute;
		top: 8px;
		right: 8px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.theme-videoupload:hover .theme-videoupload-overlay {
		opacity: 1;
	}

	.theme-videoupload-remove {
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

	.theme-videoupload-remove:hover {
		background: var(--color-error-hover);
		transform: scale(1.1);
	}

	.theme-videoupload-remove:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-videoupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-videoupload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;
		padding: 24px;
	}

	.theme-videoupload-icon {
		font-size: 48px;
		line-height: 1;
	}

	.theme-videoupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-videoupload-spinner {
		font-size: 48px;
		line-height: 1;
		color: var(--color-primary);
	}

	.theme-videoupload-spinner svg {
		width: 48px;
		height: 48px;
		animation: spin 1s linear infinite;
	}

	.theme-videoupload-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.theme-videoupload-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	.theme-videoupload-subtitle {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.theme-videoupload-children {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	}

	/* Sizes */
	.theme-videoupload-sm {
		aspect-ratio: 4/3;
	}

	.theme-videoupload-sm .theme-videoupload-icon {
		font-size: 32px;
	}

	.theme-videoupload-sm .theme-videoupload-icon svg {
		width: 32px;
		height: 32px;
	}

	.theme-videoupload-sm .theme-videoupload-spinner {
		font-size: 32px;
	}

	.theme-videoupload-sm .theme-videoupload-spinner svg {
		width: 32px;
		height: 32px;
	}

	.theme-videoupload-sm .theme-videoupload-title {
		font-size: 14px;
	}

	.theme-videoupload-sm .theme-videoupload-subtitle {
		font-size: 12px;
	}

	.theme-videoupload-sm .theme-videoupload-remove {
		width: 32px;
		height: 32px;
	}

	.theme-videoupload-sm .theme-videoupload-remove svg {
		width: 16px;
		height: 16px;
	}

	.theme-videoupload-md {
		aspect-ratio: 16/9;
	}

	.theme-videoupload-md .theme-videoupload-icon {
		font-size: 48px;
	}

	.theme-videoupload-md .theme-videoupload-icon svg {
		width: 48px;
		height: 48px;
	}

	.theme-videoupload-md .theme-videoupload-spinner {
		font-size: 48px;
	}

	.theme-videoupload-md .theme-videoupload-spinner svg {
		width: 48px;
		height: 48px;
	}

	.theme-videoupload-md .theme-videoupload-title {
		font-size: 16px;
	}

	.theme-videoupload-md .theme-videoupload-subtitle {
		font-size: 14px;
	}

	.theme-videoupload-md .theme-videoupload-remove {
		width: 40px;
		height: 40px;
	}

	.theme-videoupload-md .theme-videoupload-remove svg {
		width: 20px;
		height: 20px;
	}

	.theme-videoupload-lg {
		aspect-ratio: 16/9;
	}

	.theme-videoupload-lg .theme-videoupload-icon {
		font-size: 64px;
	}

	.theme-videoupload-lg .theme-videoupload-icon svg {
		width: 64px;
		height: 64px;
	}

	.theme-videoupload-lg .theme-videoupload-spinner {
		font-size: 64px;
	}

	.theme-videoupload-lg .theme-videoupload-spinner svg {
		width: 64px;
		height: 64px;
	}

	.theme-videoupload-lg .theme-videoupload-title {
		font-size: 18px;
	}

	.theme-videoupload-lg .theme-videoupload-subtitle {
		font-size: 16px;
	}

	.theme-videoupload-lg .theme-videoupload-remove {
		width: 48px;
		height: 48px;
	}

	.theme-videoupload-lg .theme-videoupload-remove svg {
		width: 24px;
		height: 24px;
	}

	.theme-videoupload-xl {
		aspect-ratio: 16/9;
	}

	.theme-videoupload-xl .theme-videoupload-icon {
		font-size: 80px;
	}

	.theme-videoupload-xl .theme-videoupload-icon svg {
		width: 80px;
		height: 80px;
	}

	.theme-videoupload-xl .theme-videoupload-spinner {
		font-size: 80px;
	}

	.theme-videoupload-xl .theme-videoupload-spinner svg {
		width: 80px;
		height: 80px;
	}

	.theme-videoupload-xl .theme-videoupload-title {
		font-size: 20px;
	}

	.theme-videoupload-xl .theme-videoupload-subtitle {
		font-size: 18px;
	}

	.theme-videoupload-xl .theme-videoupload-remove {
		width: 56px;
		height: 56px;
	}

	.theme-videoupload-xl .theme-videoupload-remove svg {
		width: 28px;
		height: 28px;
	}

	/* States */
	.theme-videoupload-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-videoupload-disabled:hover {
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
		.theme-videoupload {
			aspect-ratio: 4/3;
		}

		.theme-videoupload-content {
			padding: 16px;
			gap: 12px;
		}

		.theme-videoupload-icon {
			font-size: 40px;
		}

		.theme-videoupload-icon svg {
			width: 40px;
			height: 40px;
		}

		.theme-videoupload-spinner {
			font-size: 40px;
		}

		.theme-videoupload-spinner svg {
			width: 40px;
			height: 40px;
		}

		.theme-videoupload-title {
			font-size: 15px;
		}

		.theme-videoupload-subtitle {
			font-size: 13px;
		}

		.theme-videoupload-remove {
			width: 36px;
			height: 36px;
		}

		.theme-videoupload-remove svg {
			width: 18px;
			height: 18px;
		}
	}
</style>
