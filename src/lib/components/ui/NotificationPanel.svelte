<script lang="ts">
	import { notifications, markAsRead, markAllAsRead, deleteNotification, type Notification } from '$lib/stores/notifications';
	import Badge from './Badge.svelte';

	let { isOpen = $bindable(false) } = $props<{ isOpen?: boolean }>();

	let unreadCount = $derived($notifications.filter(n => !n.read).length);

	function handleNotificationClick(notification: Notification) {
		if (!notification.read) {
			markAsRead(notification.id);
		}
		if (notification.actionUrl) {
			window.location.href = notification.actionUrl;
		}
	}

	function getNotificationIcon(type: string) {
		switch (type) {
			case 'success':
				return `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>`;
			case 'warning':
				return `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
				</svg>`;
			case 'error':
				return `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>`;
			default:
				return `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>`;
		}
	}

	function formatTimestamp(timestamp: string) {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (minutes < 60) {
			return `${minutes}분 전`;
		} else if (hours < 24) {
			return `${hours}시간 전`;
		} else {
			return `${days}일 전`;
		}
	}
</script>

<!-- 알림 버튼 -->
<div class="relative">
	<button
		onclick={() => isOpen = !isOpen}
		class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
		aria-label="알림"
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
		</svg>
		{#if unreadCount > 0}
			<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	<!-- 알림 패널 -->
	{#if isOpen}
		<div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
			<div class="p-4 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<h3 class="text-lg font-semibold">알림</h3>
					<div class="flex space-x-2">
						{#if unreadCount > 0}
							<button
								onclick={markAllAsRead}
								class="text-sm text-blue-600 hover:text-blue-800"
							>
								모두 읽음
							</button>
						{/if}
						<button
							onclick={() => isOpen = false}
							class="text-gray-400 hover:text-gray-600"
							aria-label="닫기"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>

			<div class="max-h-96 overflow-y-auto">
				{#if $notifications.length === 0}
					<div class="p-8 text-center text-gray-500">
						<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
						</svg>
						<p>새로운 알림이 없습니다</p>
					</div>
				{:else}
					{#each $notifications as notification}
						<div 
							class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors {notification.read ? 'opacity-60' : ''}"
							onclick={() => handleNotificationClick(notification)}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNotificationClick(notification)}
							role="button"
							tabindex="0"
						>
							<div class="flex items-start space-x-3">
								<div class="flex-shrink-0 mt-1">
									{@html getNotificationIcon(notification.type)}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex justify-between items-start">
										<h4 class="text-sm font-medium text-gray-900 truncate">
											{notification.title}
										</h4>
										<div class="flex items-center space-x-2 ml-2">
											{#if !notification.read}
												<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
											{/if}
											<button
												onclick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
												class="text-gray-400 hover:text-gray-600"
												aria-label="삭제"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
												</svg>
											</button>
										</div>
									</div>
									<p class="text-sm text-gray-600 mt-1">
										{notification.message}
									</p>
									<div class="flex justify-between items-center mt-2">
										<span class="text-xs text-gray-400">
											{formatTimestamp(notification.timestamp)}
										</span>
										{#if notification.actionText}
											<span class="text-xs text-blue-600 font-medium">
												{notification.actionText}
											</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			{#if $notifications.length > 0}
				<div class="p-3 border-t border-gray-200 text-center">
					<a href="/notifications" class="text-sm text-blue-600 hover:text-blue-800">
						모든 알림 보기
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- 클릭 외부 영역 감지 -->
{#if isOpen}
	<div 
		class="fixed inset-0 z-40" 
		onclick={() => isOpen = false}
		onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		role="button"
		tabindex="-1"
		aria-label="알림 패널 닫기"
	></div>
{/if}
