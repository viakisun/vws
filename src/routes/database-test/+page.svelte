<script lang="ts">
	import { onMount } from 'svelte';
	
	let testResult = $state<any>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function testDatabaseConnection() {
		loading = true;
		error = null;
		testResult = null;

		try {
			const response = await fetch('/api/database/test');
			const data = await response.json();
			
			if (data.success) {
				testResult = data;
			} else {
				error = data.error || 'Unknown error';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}

	async function testUsersAPI() {
		loading = true;
		error = null;
		testResult = null;

		try {
			const response = await fetch('/api/database/users');
			const data = await response.json();
			
			if (data.success) {
				testResult = data;
			} else {
				error = data.error || 'Unknown error';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		testDatabaseConnection();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Database Connection Test</h1>
	
	<div class="space-y-4 mb-8">
		<button 
			onclick={testDatabaseConnection}
			disabled={loading}
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
		>
			{loading ? 'Testing...' : 'Test Database Connection'}
		</button>
		
		<button 
			onclick={testUsersAPI}
			disabled={loading}
			class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
		>
			{loading ? 'Testing...' : 'Test Users API'}
		</button>
	</div>

	{#if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			<strong>Error:</strong> {error}
		</div>
	{/if}

	{#if testResult}
		<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
			<strong>Success!</strong> Database connection is working.
		</div>
		
		<div class="bg-gray-100 p-4 rounded">
			<h3 class="font-bold mb-2">Test Result:</h3>
			<pre class="text-sm overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
		</div>
	{/if}
</div>

