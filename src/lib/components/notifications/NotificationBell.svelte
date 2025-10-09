<script lang="ts">
	import { onMount } from 'svelte'
	import { BellIcon, CheckIcon, XIcon, Trash2Icon } from 'lucide-svelte'
	import { goto } from '$app/navigation'
	import type { Notification } from '$lib/planner/services/notification.service'

	let showDropdown = $state(false)
	let notifications = $state<Notification[]>([])
	let unreadCount = $state(0)
	let loading = $state(false)

	// Load notifications
	async function loadNotifications() {
		try {
			const res = await fetch('/api/notifications?limit=10')
			if (res.ok) {
				const data = await res.json()
				notifications = data.data || []
			}
		} catch (e) {
			console.error('Failed to load notifications:', e)
		}
	}

	// Load unread count
	async function loadUnreadCount() {
		try {
			const res = await fetch('/api/notifications/unread-count')
			if (res.ok) {
				const data = await res.json()
				unreadCount = data.data.count
			}
		} catch (e) {
			console.error('Failed to load unread count:', e)
		}
	}

	// Mark as read
	async function markAsRead(notificationId: number) {
		try {
			await fetch(`/api/notifications/${notificationId}`, {
				method: 'PATCH',
			})
			await loadNotifications()
			await loadUnreadCount()
		} catch (e) {
			console.error('Failed to mark notification as read:', e)
		}
	}

	// Mark all as read
	async function markAllAsRead() {
		try {
			loading = true
			await fetch('/api/notifications', {
				method: 'PATCH',
			})
			await loadNotifications()
			await loadUnreadCount()
		} catch (e) {
			console.error('Failed to mark all as read:', e)
		} finally {
			loading = false
		}
	}

	// Delete notification
	async function deleteNotification(notificationId: number, event: Event) {
		event.stopPropagation()
		try {
			await fetch(`/api/notifications/${notificationId}`, {
				method: 'DELETE',
			})
			await loadNotifications()
			await loadUnreadCount()
		} catch (e) {
			console.error('Failed to delete notification:', e)
		}
	}

	// Handle notification click
	function handleNotificationClick(notification: Notification) {
		// Mark as read
		if (!notification.is_read) {
			markAsRead(notification.id)
		}

		// Navigate to action URL
		if (notification.action_url) {
			showDropdown = false
			goto(notification.action_url)
		}
	}

	// Toggle dropdown
	function toggleDropdown() {
		showDropdown = !showDropdown
		if (showDropdown) {
			loadNotifications()
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement
		if (!target.closest('.notification-bell-container')) {
			showDropdown = false
		}
	}

	// Poll for notifications every 30 seconds
	onMount(() => {
		loadUnreadCount()

		const interval = setInterval(() => {
			loadUnreadCount()
		}, 30000) // 30 seconds

		document.addEventListener('click', handleClickOutside)

		return () => {
			clearInterval(interval)
			document.removeEventListener('click', handleClickOutside)
		}
	})

	// Format time ago
	function formatTimeAgo(dateStr: string): string {
		const date = new Date(dateStr)
		const now = new Date()
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

		if (seconds < 60) return '방금 전'
		if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
		if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`
		return date.toLocaleDateString('ko-KR')
	}

	// Get notification icon/color based on type
	function getNotificationStyle(type: string): { color: string; bgColor: string } {
		switch (type) {
			case 'mention':
				return { color: 'var(--color-primary)', bgColor: 'var(--color-primary-light)' }
			case 'assignment':
				return { color: 'var(--color-purple)', bgColor: 'var(--color-purple-light)' }
			case 'reply':
				return { color: 'var(--color-blue)', bgColor: 'var(--color-blue-light)' }
			case 'status_change':
				return { color: 'var(--color-green)', bgColor: 'var(--color-green-light)' }
			default:
				return { color: 'var(--color-text-secondary)', bgColor: 'var(--color-surface-secondary)' }
		}
	}
</script>

<div class="notification-bell-container relative">
	<!-- Bell Button -->
	<button
		onclick={toggleDropdown}
		class="relative p-2 rounded-lg transition hover:opacity-70"
		style:background={showDropdown ? 'var(--color-surface-secondary)' : 'transparent'}
		aria-label="알림"
	>
		<BellIcon size={20} style="color: var(--color-text-primary);" />
		{#if unreadCount > 0}
			<span
				class="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold rounded-full"
				style:background="var(--color-error)"
				style:color="white"
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	<!-- Dropdown -->
	{#if showDropdown}
		<div
			class="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-hidden rounded-lg shadow-xl border z-50"
			style:background="var(--color-surface)"
			style:border-color="var(--color-border)"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between px-4 py-3 border-b"
				style:border-color="var(--color-border)"
			>
				<h3 class="text-sm font-semibold" style:color="var(--color-text-primary)">알림</h3>
				{#if unreadCount > 0}
					<button
						onclick={markAllAsRead}
						disabled={loading}
						class="text-xs font-medium hover:opacity-70 transition"
						style:color="var(--color-primary)"
					>
						<CheckIcon size={14} class="inline" />
						모두 읽음
					</button>
				{/if}
			</div>

			<!-- Notifications List -->
			<div class="overflow-y-auto max-h-96">
				{#if notifications.length === 0}
					<div class="py-12 text-center">
						<BellIcon size={32} class="mx-auto mb-2 opacity-30" style="color: var(--color-text-tertiary);" />
						<p class="text-sm" style:color="var(--color-text-tertiary)">알림이 없습니다</p>
					</div>
				{:else}
					{#each notifications as notification}
						{@const style = getNotificationStyle(notification.type)}
						<div
							class="w-full px-4 py-3 border-b transition relative"
							style:background={notification.is_read ? 'transparent' : 'var(--color-surface-secondary)'}
							style:border-color="var(--color-border-light)"
						>
							<div class="flex gap-3">
								<!-- Type indicator -->
								<div
									class="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
									style:background={notification.is_read ? 'transparent' : style.color}
								></div>

								<!-- Content (clickable) -->
								<button
									onclick={() => handleNotificationClick(notification)}
									class="flex-1 min-w-0 text-left hover:opacity-70 transition"
								>
									<p
										class="text-sm font-medium mb-1"
										style:color="var(--color-text-primary)"
									>
										{notification.title}
									</p>
									<p
										class="text-xs mb-1 line-clamp-2"
										style:color="var(--color-text-secondary)"
									>
										{notification.message}
									</p>
									<p class="text-xs" style:color="var(--color-text-tertiary)">
										{formatTimeAgo(notification.created_at)}
									</p>
								</button>

								<!-- Delete button -->
								<button
									onclick={(e) => deleteNotification(notification.id, e)}
									class="flex-shrink-0 p-1 rounded hover:opacity-70 transition"
									style:color="var(--color-text-tertiary)"
									aria-label="삭제"
								>
									<XIcon size={14} />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if notifications.length > 0}
				<div
					class="px-4 py-3 text-center border-t"
					style:border-color="var(--color-border)"
				>
					<a
						href="/notifications"
						class="text-sm font-medium hover:opacity-70 transition"
						style:color="var(--color-primary)"
						onclick={() => { showDropdown = false }}
					>
						모든 알림 보기
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
