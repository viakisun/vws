<script lang="ts">
	let { error, status } = $props<{ error: Error & { message?: string }, status: number }>();
</script>

<div class="min-h-[50vh] flex flex-col items-center justify-center text-center gap-3">
	<div class="text-2xl font-semibold">문제가 발생했습니다</div>
	<div class="text-caption">{status} · {error?.message ?? '알 수 없는 오류'}</div>
	<a class="mt-2 px-4 py-2 rounded-md bg-primary text-white hover:brightness-95" href="/">홈으로</a>
</div>
