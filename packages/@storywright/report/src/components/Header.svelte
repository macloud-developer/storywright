<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';

	let { timestamp }: { timestamp: string } = $props();

	const formatted = $derived(new Date(timestamp).toLocaleString());
</script>

<header class="header">
	<h1 class="title">Storywright Report</h1>
	<div class="header-right">
		<span class="timestamp">{formatted}</span>
		<ThemeToggle />
	</div>
</header>

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 24px;
		border-bottom: 1px solid var(--color-border-default);
		background: var(--color-bg-primary);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-fg-default);
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.timestamp {
		font-size: 0.8rem;
		color: var(--color-fg-muted);
	}
</style>
