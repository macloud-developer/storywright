<script lang="ts">
	import { tick } from 'svelte';
	import type { TestEntry, ReportSummary, TypeFilter } from './lib/types.js';
	import { entryKey } from './lib/types.js';
	import Header from './components/Header.svelte';
	import Dashboard from './components/Dashboard.svelte';
	import Sidebar from './components/Sidebar.svelte';
	import DiffCardList from './components/DiffCardList.svelte';

	let { summary }: { summary: ReportSummary } = $props();

	let search = $state('');
	let typeFilter: TypeFilter = $state('all');
	let browserFilter: Set<string> = $state(new Set());
	let activeKey = $state('');
	let scrollToKey = $state('');
	let viewedSet = $state(new Set<string>());

	const filteredEntries = $derived.by(() => {
		let results = summary.entries;

		if (search) {
			const q = search.toLowerCase();
			results = results.filter(
				(f) =>
					f.story.toLowerCase().includes(q) ||
					f.variant.toLowerCase().includes(q),
			);
		}

		if (typeFilter !== 'all') {
			results = results.filter((f) => f.type === typeFilter);
		}

		if (browserFilter.size > 0) {
			results = results.filter((f) => browserFilter.has(f.browser));
		}

		return results;
	});

	function handleSidebarSelect(entry: TestEntry, _index: number) {
		const key = entryKey(entry);
		// Reset first so re-clicking the same entry still triggers scroll
		scrollToKey = '';
		tick().then(() => {
			scrollToKey = key;
			activeKey = key;
		});
	}

	function handleVisibleChange(key: string) {
		activeKey = key;
	}

	function handleViewedChange(key: string, viewed: boolean) {
		const next = new Set(viewedSet);
		if (viewed) {
			next.add(key);
		} else {
			next.delete(key);
		}
		viewedSet = next;
	}
</script>

<div class="app">
	<Header timestamp={summary.timestamp} />
	<Dashboard {summary} />
	<div class="layout">
		<Sidebar
			entries={filteredEntries}
			browsers={summary.browsers}
			bind:search
			bind:typeFilter
			bind:browserFilter
			activeId={activeKey}
			onSelect={handleSidebarSelect}
		/>
		<main class="main-content">
			{#if filteredEntries.length === 0}
				<div class="empty-state">
					{#if summary.entries.length === 0}
						<p class="all-passed">All tests passed!</p>
					{:else}
						<p>No matching results</p>
					{/if}
				</div>
			{:else}
				<DiffCardList
					entries={filteredEntries}
					{viewedSet}
					{scrollToKey}
					onViewedChange={handleViewedChange}
					onVisibleChange={handleVisibleChange}
				/>
			{/if}
		</main>
	</div>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	:global(html) {
		/* Light theme (default) */
		--color-bg-primary: #ffffff;
		--color-bg-secondary: #f6f8fa;
		--color-bg-tertiary: #eaeef2;
		--color-fg-default: #1f2328;
		--color-fg-muted: #656d76;
		--color-border-default: #d0d7de;
		--color-accent: #0969da;
		--color-accent-subtle: #ddf4ff;
		--color-success: #1a7f37;
		--color-success-subtle: #dafbe1;
		--color-danger: #cf222e;
		--color-danger-subtle: #ffebe9;
	}
	:global([data-theme='dark']) {
		--color-bg-primary: #0d1117;
		--color-bg-secondary: #161b22;
		--color-bg-tertiary: #21262d;
		--color-fg-default: #e6edf3;
		--color-fg-muted: #8b949e;
		--color-border-default: #30363d;
		--color-accent: #58a6ff;
		--color-accent-subtle: #0d2744;
		--color-success: #3fb950;
		--color-success-subtle: #0d2b1a;
		--color-danger: #f85149;
		--color-danger-subtle: #3b1219;
	}
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
		color: var(--color-fg-default);
		background: var(--color-bg-primary);
		-webkit-font-smoothing: antialiased;
	}
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}
	.layout {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
	.main-content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		color: var(--color-fg-muted);
		font-size: 1.1rem;
	}
	.all-passed {
		color: var(--color-success);
		font-weight: 600;
		font-size: 1.25rem;
	}
</style>
