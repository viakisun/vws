<script lang="ts">
	// Props
	interface Props {
		value?: Date;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		format?: '12h' | '24h';
		class?: string;
		onchange?: (date: Date) => void;
		children?: any;
	}

	let {
		value = new Date(),
		disabled = false,
		size = 'md',
		variant = 'default',
		format = '12h',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// State
	let hours = $state(value.getHours());
	let minutes = $state(value.getMinutes());
	let seconds = $state(value.getSeconds());
	let isAM = $state(hours < 12);

	// Get time picker classes
	function getTimePickerClasses(): string {
		const baseClasses = 'theme-timepicker';
		const sizeClass = `theme-timepicker-${size}`;
		const variantClass = `theme-timepicker-${variant}`;
		const disabledClass = disabled ? 'theme-timepicker-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, className].filter(Boolean).join(' ');
	}

	// Get input classes
	function getInputClasses(): string {
		const baseClasses = 'theme-timepicker-input';
		const sizeClass = `theme-timepicker-input-${size}`;
		const variantClass = `theme-timepicker-input-${variant}`;
		const disabledClass = disabled ? 'theme-timepicker-input-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass].filter(Boolean).join(' ');
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

	// Format time
	function formatTime(): string {
		if (format === '24h') {
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		} else {
			const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
			const ampm = isAM ? 'AM' : 'PM';
			return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
		}
	}

	// Handle hours change
	function handleHoursChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newHours = parseInt(target.value);
		
		if (!isNaN(newHours) && newHours >= 0 && newHours <= 23) {
			hours = newHours;
			updateValue();
		}
	}

	// Handle minutes change
	function handleMinutesChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newMinutes = parseInt(target.value);
		
		if (!isNaN(newMinutes) && newMinutes >= 0 && newMinutes <= 59) {
			minutes = newMinutes;
			updateValue();
		}
	}

	// Handle seconds change
	function handleSecondsChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newSeconds = parseInt(target.value);
		
		if (!isNaN(newSeconds) && newSeconds >= 0 && newSeconds <= 59) {
			seconds = newSeconds;
			updateValue();
		}
	}

	// Handle AM/PM toggle
	function handleAMPMToggle() {
		isAM = !isAM;
		updateValue();
	}

	// Update value
	function updateValue() {
		let newHours = hours;
		
		if (format === '12h') {
			if (isAM && hours === 12) {
				newHours = 0;
			} else if (!isAM && hours < 12) {
				newHours = hours + 12;
			}
		}
		
		const newValue = new Date(value);
		newValue.setHours(newHours, minutes, seconds);
		
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
	}

	// Generate hours options
	function generateHoursOptions(): number[] {
		if (format === '24h') {
			return Array.from({ length: 24 }, (_, i) => i);
		} else {
			return Array.from({ length: 12 }, (_, i) => i + 1);
		}
	}

	// Generate minutes options
	function generateMinutesOptions(): number[] {
		return Array.from({ length: 60 }, (_, i) => i);
	}

	// Generate seconds options
	function generateSecondsOptions(): number[] {
		return Array.from({ length: 60 }, (_, i) => i);
	}

	// Update state when value changes
	$effect(() => {
		if (value) {
			hours = value.getHours();
			minutes = value.getMinutes();
			seconds = value.getSeconds();
			isAM = hours < 12;
		}
	});
</script>

<div class={getTimePickerClasses()} {...restProps}>
	<div class="theme-timepicker-inputs">
		<div class="theme-timepicker-group">
			<label class="theme-timepicker-label">Hours</label>
			<select
				class={getInputClasses()}
				{disabled}
				value={format === '12h' ? (hours === 0 ? 12 : hours > 12 ? hours - 12 : hours) : hours}
				onchange={handleHoursChange}
			>
				{#each generateHoursOptions() as hour}
					<option value={hour}>{hour.toString().padStart(2, '0')}</option>
				{/each}
			</select>
		</div>

		<div class="theme-timepicker-separator">:</div>

		<div class="theme-timepicker-group">
			<label class="theme-timepicker-label">Minutes</label>
			<select
				class={getInputClasses()}
				{disabled}
				value={minutes}
				onchange={handleMinutesChange}
			>
				{#each generateMinutesOptions() as minute}
					<option value={minute}>{minute.toString().padStart(2, '0')}</option>
				{/each}
			</select>
		</div>

		{#if format === '12h'}
			<div class="theme-timepicker-separator"></div>
			
			<div class="theme-timepicker-group">
				<label class="theme-timepicker-label">AM/PM</label>
				<button
					class="theme-timepicker-ampm"
					onclick={handleAMPMToggle}
					{disabled}
					style="background: {isAM ? getColor() : 'var(--color-border)'}; color: {isAM ? 'white' : 'var(--color-text)'};"
				>
					{isAM ? 'AM' : 'PM'}
				</button>
			</div>
		{/if}
	</div>

	<div class="theme-timepicker-display">
		{formatTime()}
	</div>

	{#if children}
		<div class="theme-timepicker-content">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-timepicker {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.theme-timepicker-inputs {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.theme-timepicker-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.theme-timepicker-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-align: center;
	}

	.theme-timepicker-input {
		padding: 8px 12px;
		background: var(--color-input-background);
		border: 1px solid var(--color-input-border);
		border-radius: 8px;
		font-size: 14px;
		color: var(--color-text);
		transition: all 0.2s ease;
		font-family: inherit;
		cursor: pointer;
		appearance: none;
		background-image: none;
	}

	.theme-timepicker-input:focus {
		outline: none;
		border-color: var(--color-input-focus);
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	.theme-timepicker-input option {
		background: var(--color-surface);
		color: var(--color-text);
		padding: 8px 12px;
	}

	.theme-timepicker-separator {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		height: 40px;
	}

	.theme-timepicker-ampm {
		padding: 8px 16px;
		background: var(--color-border);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
	}

	.theme-timepicker-ampm:hover:not(:disabled) {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.theme-timepicker-ampm:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-timepicker-ampm:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.theme-timepicker-display {
		text-align: center;
		font-size: 24px;
		font-weight: 600;
		color: var(--color-text);
		padding: 16px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		font-family: 'Courier New', monospace;
	}

	.theme-timepicker-content {
		margin-top: 8px;
	}

	/* Sizes */
	.theme-timepicker-sm .theme-timepicker-input {
		padding: 6px 10px;
		font-size: 12px;
	}

	.theme-timepicker-sm .theme-timepicker-ampm {
		padding: 6px 12px;
		font-size: 12px;
		min-width: 50px;
	}

	.theme-timepicker-sm .theme-timepicker-display {
		font-size: 20px;
		padding: 12px;
	}

	.theme-timepicker-sm .theme-timepicker-separator {
		font-size: 16px;
		height: 32px;
	}

	.theme-timepicker-md .theme-timepicker-input {
		padding: 8px 12px;
		font-size: 14px;
	}

	.theme-timepicker-md .theme-timepicker-ampm {
		padding: 8px 16px;
		font-size: 14px;
		min-width: 60px;
	}

	.theme-timepicker-md .theme-timepicker-display {
		font-size: 24px;
		padding: 16px;
	}

	.theme-timepicker-md .theme-timepicker-separator {
		font-size: 18px;
		height: 40px;
	}

	.theme-timepicker-lg .theme-timepicker-input {
		padding: 10px 14px;
		font-size: 16px;
	}

	.theme-timepicker-lg .theme-timepicker-ampm {
		padding: 10px 20px;
		font-size: 16px;
		min-width: 70px;
	}

	.theme-timepicker-lg .theme-timepicker-display {
		font-size: 28px;
		padding: 20px;
	}

	.theme-timepicker-lg .theme-timepicker-separator {
		font-size: 20px;
		height: 48px;
	}

	.theme-timepicker-xl .theme-timepicker-input {
		padding: 12px 16px;
		font-size: 18px;
	}

	.theme-timepicker-xl .theme-timepicker-ampm {
		padding: 12px 24px;
		font-size: 18px;
		min-width: 80px;
	}

	.theme-timepicker-xl .theme-timepicker-display {
		font-size: 32px;
		padding: 24px;
	}

	.theme-timepicker-xl .theme-timepicker-separator {
		font-size: 22px;
		height: 56px;
	}

	/* States */
	.theme-timepicker-disabled .theme-timepicker-input {
		background: var(--color-border-light);
		color: var(--color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.theme-timepicker-disabled .theme-timepicker-ampm {
		cursor: not-allowed;
	}

	.theme-timepicker-disabled .theme-timepicker-display {
		opacity: 0.6;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-timepicker-inputs {
			flex-wrap: wrap;
			gap: 8px;
		}

		.theme-timepicker-sm .theme-timepicker-input {
			padding: 4px 8px;
			font-size: 11px;
		}

		.theme-timepicker-sm .theme-timepicker-ampm {
			padding: 4px 10px;
			font-size: 11px;
			min-width: 45px;
		}

		.theme-timepicker-sm .theme-timepicker-display {
			font-size: 18px;
			padding: 10px;
		}

		.theme-timepicker-sm .theme-timepicker-separator {
			font-size: 14px;
			height: 28px;
		}

		.theme-timepicker-md .theme-timepicker-input {
			padding: 6px 10px;
			font-size: 13px;
		}

		.theme-timepicker-md .theme-timepicker-ampm {
			padding: 6px 14px;
			font-size: 13px;
			min-width: 55px;
		}

		.theme-timepicker-md .theme-timepicker-display {
			font-size: 22px;
			padding: 14px;
		}

		.theme-timepicker-md .theme-timepicker-separator {
			font-size: 16px;
			height: 36px;
		}

		.theme-timepicker-lg .theme-timepicker-input {
			padding: 8px 12px;
			font-size: 15px;
		}

		.theme-timepicker-lg .theme-timepicker-ampm {
			padding: 8px 18px;
			font-size: 15px;
			min-width: 65px;
		}

		.theme-timepicker-lg .theme-timepicker-display {
			font-size: 26px;
			padding: 18px;
		}

		.theme-timepicker-lg .theme-timepicker-separator {
			font-size: 18px;
			height: 44px;
		}

		.theme-timepicker-xl .theme-timepicker-input {
			padding: 10px 14px;
			font-size: 17px;
		}

		.theme-timepicker-xl .theme-timepicker-ampm {
			padding: 10px 22px;
			font-size: 17px;
			min-width: 75px;
		}

		.theme-timepicker-xl .theme-timepicker-display {
			font-size: 30px;
			padding: 22px;
		}

		.theme-timepicker-xl .theme-timepicker-separator {
			font-size: 20px;
			height: 52px;
		}
	}
</style>
