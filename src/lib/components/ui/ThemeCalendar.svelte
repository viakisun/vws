<script lang="ts">
	// Props
	interface Props {
		value?: Date;
		min?: Date;
		max?: Date;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		class?: string;
		onchange?: (date: Date) => void;
		children?: any;
	}

	let {
		value = new Date(),
		min,
		max,
		disabled = false,
		size = 'md',
		variant = 'default',
		class: className = '',
		onchange,
		children,
		...restProps
	}: Props = $props();

	// State
	let currentMonth = $state(value.getMonth());
	let currentYear = $state(value.getFullYear());

	// Get calendar classes
	function getCalendarClasses(): string {
		const baseClasses = 'theme-calendar';
		const sizeClass = `theme-calendar-${size}`;
		const variantClass = `theme-calendar-${variant}`;
		const disabledClass = disabled ? 'theme-calendar-disabled' : '';

		return [baseClasses, sizeClass, variantClass, disabledClass, className].filter(Boolean).join(' ');
	}

	// Get day classes
	function getDayClasses(day: Date): string {
		const baseClasses = 'theme-calendar-day';
		const sizeClass = `theme-calendar-day-${size}`;
		const variantClass = `theme-calendar-day-${variant}`;
		const todayClass = isToday(day) ? 'theme-calendar-day-today' : '';
		const selectedClass = isSelected(day) ? 'theme-calendar-day-selected' : '';
		const disabledClass = isDisabled(day) ? 'theme-calendar-day-disabled' : '';

		return [baseClasses, sizeClass, variantClass, todayClass, selectedClass, disabledClass].filter(Boolean).join(' ');
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

	// Check if date is today
	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	// Check if date is selected
	function isSelected(date: Date): boolean {
		return value && date.toDateString() === value.toDateString();
	}

	// Check if date is disabled
	function isDisabled(date: Date): boolean {
		if (disabled) return true;
		if (min && date < min) return true;
		if (max && date > max) return true;
		return false;
	}

	// Get month name
	function getMonthName(month: number): string {
		const months = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];
		return months[month];
	}

	// Get days in month
	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	// Get first day of month
	function getFirstDayOfMonth(year: number, month: number): number {
		return new Date(year, month, 1).getDay();
	}

	// Generate calendar days
	function generateCalendarDays(): Date[] {
		const days: Date[] = [];
		const daysInMonth = getDaysInMonth(currentYear, currentMonth);
		const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(new Date(currentYear, currentMonth, -firstDay + i + 1));
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(currentYear, currentMonth, day));
		}

		// Add empty cells to complete the grid
		const remainingCells = 42 - days.length; // 6 rows × 7 days
		for (let i = 1; i <= remainingCells; i++) {
			days.push(new Date(currentYear, currentMonth, daysInMonth + i));
		}

		return days;
	}

	// Handle day click
	function handleDayClick(day: Date) {
		if (isDisabled(day)) return;
		
		value = day;
		if (onchange) {
			onchange(day);
		}
	}

	// Handle previous month
	function handlePrevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	// Handle next month
	function handleNextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}

	// Handle previous year
	function handlePrevYear() {
		currentYear--;
	}

	// Handle next year
	function handleNextYear() {
		currentYear++;
	}
</script>

<div class={getCalendarClasses()} {...restProps}>
	<div class="theme-calendar-header">
		<button class="theme-calendar-nav" onclick={handlePrevYear} {disabled}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
			</svg>
		</button>
		
		<button class="theme-calendar-nav" onclick={handlePrevMonth} {disabled}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</button>

		<div class="theme-calendar-title">
			{getMonthName(currentMonth)} {currentYear}
		</div>

		<button class="theme-calendar-nav" onclick={handleNextMonth} {disabled}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 18l6-6-6-6"/>
			</svg>
		</button>

		<button class="theme-calendar-nav" onclick={handleNextYear} {disabled}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
			</svg>
		</button>
	</div>

	<div class="theme-calendar-weekdays">
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as weekday}
			<div class="theme-calendar-weekday">{weekday}</div>
		{/each}
	</div>

	<div class="theme-calendar-days">
		{#each generateCalendarDays() as day}
			<button
				class={getDayClasses(day)}
				onclick={() => handleDayClick(day)}
				disabled={isDisabled(day)}
				aria-label={day.toDateString()}
			>
				{day.getDate()}
			</button>
		{/each}
	</div>

	{#if children}
		<div class="theme-calendar-content">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.theme-calendar {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 16px;
		width: 100%;
		max-width: 320px;
	}

	.theme-calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.theme-calendar-nav {
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-text-secondary);
	}

	.theme-calendar-nav:hover:not(:disabled) {
		background: var(--color-border);
		color: var(--color-text);
	}

	.theme-calendar-nav:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-calendar-nav:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.theme-calendar-nav svg {
		width: 16px;
		height: 16px;
	}

	.theme-calendar-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
		flex: 1;
		margin: 0 8px;
	}

	.theme-calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		margin-bottom: 8px;
	}

	.theme-calendar-weekday {
		text-align: center;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-secondary);
		padding: 8px 4px;
	}

	.theme-calendar-days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.theme-calendar-day {
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 14px;
		color: var(--color-text);
	}

	.theme-calendar-day:hover:not(:disabled) {
		background: var(--color-border);
	}

	.theme-calendar-day:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.theme-calendar-day:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.theme-calendar-day-today {
		background: var(--color-primary-light);
		color: var(--color-primary);
		font-weight: 600;
	}

	.theme-calendar-day-selected {
		background: var(--color-primary);
		color: white;
		font-weight: 600;
	}

	.theme-calendar-day-selected:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.theme-calendar-content {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--color-border);
	}

	/* Sizes */
	.theme-calendar-sm {
		max-width: 280px;
		padding: 12px;
	}

	.theme-calendar-sm .theme-calendar-nav {
		width: 28px;
		height: 28px;
	}

	.theme-calendar-sm .theme-calendar-nav svg {
		width: 14px;
		height: 14px;
	}

	.theme-calendar-sm .theme-calendar-title {
		font-size: 14px;
	}

	.theme-calendar-sm .theme-calendar-weekday {
		font-size: 11px;
		padding: 6px 2px;
	}

	.theme-calendar-sm .theme-calendar-day {
		width: 28px;
		height: 28px;
		font-size: 12px;
	}

	.theme-calendar-lg {
		max-width: 360px;
		padding: 20px;
	}

	.theme-calendar-lg .theme-calendar-nav {
		width: 36px;
		height: 36px;
	}

	.theme-calendar-lg .theme-calendar-nav svg {
		width: 18px;
		height: 18px;
	}

	.theme-calendar-lg .theme-calendar-title {
		font-size: 18px;
	}

	.theme-calendar-lg .theme-calendar-weekday {
		font-size: 13px;
		padding: 10px 6px;
	}

	.theme-calendar-lg .theme-calendar-day {
		width: 36px;
		height: 36px;
		font-size: 16px;
	}

	.theme-calendar-xl {
		max-width: 400px;
		padding: 24px;
	}

	.theme-calendar-xl .theme-calendar-nav {
		width: 40px;
		height: 40px;
	}

	.theme-calendar-xl .theme-calendar-nav svg {
		width: 20px;
		height: 20px;
	}

	.theme-calendar-xl .theme-calendar-title {
		font-size: 20px;
	}

	.theme-calendar-xl .theme-calendar-weekday {
		font-size: 14px;
		padding: 12px 8px;
	}

	.theme-calendar-xl .theme-calendar-day {
		width: 40px;
		height: 40px;
		font-size: 18px;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.theme-calendar {
			max-width: 100%;
			padding: 12px;
		}

		.theme-calendar-nav {
			width: 28px;
			height: 28px;
		}

		.theme-calendar-nav svg {
			width: 14px;
			height: 14px;
		}

		.theme-calendar-title {
			font-size: 14px;
		}

		.theme-calendar-weekday {
			font-size: 11px;
			padding: 6px 2px;
		}

		.theme-calendar-day {
			width: 28px;
			height: 28px;
			font-size: 12px;
		}
	}
</style>
