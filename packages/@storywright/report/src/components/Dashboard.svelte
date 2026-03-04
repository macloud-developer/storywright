<script lang="ts">
	import type { ReportSummary } from '../lib/types.js';
	import { checkCircle, xCircle, plusCircle } from '../lib/icons.js';

	let { summary }: { summary: ReportSummary } = $props();

	const durationSec = $derived(Math.round(summary.duration / 1000));
	const minutes = $derived(Math.floor(durationSec / 60));
	const seconds = $derived(durationSec % 60);
	const durationStr = $derived(minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);

	const newCount = $derived(summary.entries.filter((f) => f.type === 'new').length);
	const diffCount = $derived(summary.entries.filter((f) => f.type === 'diff').length);
</script>

<div class="dashboard">
	<div class="stats">
		<div class="stat">
			<span class="stat-value">{summary.total}</span>
			<span class="stat-label">Total</span>
		</div>
		<div class="stat stat-passed">
			<span class="stat-icon">{@html checkCircle}</span>
			<span class="stat-value">{summary.passed}</span>
			<span class="stat-label">Passed</span>
		</div>
		<div class="stat stat-failed">
			<span class="stat-icon">{@html xCircle}</span>
			<span class="stat-value">{diffCount}</span>
			<span class="stat-label">Failed</span>
		</div>
		<div class="stat stat-new">
			<span class="stat-icon">{@html plusCircle}</span>
			<span class="stat-value">{newCount}</span>
			<span class="stat-label">New</span>
		</div>
	</div>
	<div class="meta">
		<span class="duration">{durationStr}</span>
		{#each summary.browsers as browser}
			<span class="browser-badge">{browser}</span>
		{/each}
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		border-bottom: 1px solid var(--color-border-default);
		background: var(--color-bg-secondary);
		flex-wrap: wrap;
		gap: 12px;
	}
	.stats {
		display: flex;
		gap: 4px;
	}
	.stat {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-fg-muted);
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-default);
	}
	.stat-value {
		font-weight: 700;
	}
	.stat-label {
		font-weight: 400;
	}
	.stat-passed {
		color: var(--color-success);
	}
	.stat-failed {
		color: var(--color-danger);
	}
	.stat-new {
		color: var(--color-accent);
	}
	.stat-icon {
		display: flex;
		align-items: center;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		color: var(--color-fg-muted);
	}
	.duration {
		font-weight: 500;
	}
	.browser-badge {
		padding: 2px 8px;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		font-size: 0.75rem;
	}
</style>
