<script lang="ts">
	import type { ReportSummary } from '../lib/types.js';

	let { summary, onClose }: { summary: ReportSummary; onClose: () => void } = $props();

	let showRaw = $state(false);
	let copyLabel = $state('Copy JSON');

	const typeColor: Record<string, string> = {
		pass: 'var(--color-success)',
		diff: 'var(--color-danger)',
		new: 'var(--color-accent)',
	};

	const rawJson = $derived(JSON.stringify(summary, null, 2));

	function downloadJson() {
		const blob = new Blob([rawJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'summary.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	async function copyJson() {
		await navigator.clipboard.writeText(rawJson);
		copyLabel = 'Copied!';
		setTimeout(() => (copyLabel = 'Copy JSON'), 2000);
	}
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Debug panel">
	<div class="panel">
		<div class="panel-header">
			<h2>Debug: summary.json</h2>
			<div class="header-actions">
				<button class="toggle-raw" onclick={() => (showRaw = !showRaw)}>
					{showRaw ? 'Table view' : 'Raw JSON'}
				</button>
				<button class="action-btn" onclick={copyJson}>{copyLabel}</button>
				<button class="action-btn" onclick={downloadJson}>Download</button>
				<button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
			</div>
		</div>

		<div class="meta-row">
			<span>Total: <strong>{summary.total}</strong></span>
			<span>Passed: <strong>{summary.passed}</strong></span>
			<span>Failed: <strong>{summary.failed}</strong></span>
			<span>Skipped: <strong>{summary.skipped}</strong></span>
			<span>Browsers: <strong>{summary.browsers.join(', ')}</strong></span>
			<span>Timestamp: <strong>{summary.timestamp}</strong></span>
		</div>

		{#if showRaw}
			<pre class="raw-json">{JSON.stringify(summary, null, 2)}</pre>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Type</th>
							<th>Story</th>
							<th>Variant</th>
							<th>Browser</th>
							<th>expected</th>
							<th>actual</th>
							<th>diff</th>
						</tr>
					</thead>
					<tbody>
						{#each summary.entries as entry, i}
							<tr>
								<td class="num">{i + 1}</td>
								<td>
									<span class="type-badge" style="color:{typeColor[entry.type] ?? 'inherit'}">
										{entry.type}
									</span>
								</td>
								<td>{entry.story}</td>
								<td>{entry.variant}</td>
								<td>{entry.browser}</td>
								<td class="path">{entry.expected || '—'}</td>
								<td class="path">{entry.actual || '—'}</td>
								<td class="path">{entry.diff || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
	}
	.panel {
		background: var(--color-bg-primary);
		width: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		border-bottom: 1px solid var(--color-border-default);
		background: var(--color-bg-secondary);
		flex-shrink: 0;
	}
	.panel-header h2 {
		font-size: 0.95rem;
		font-weight: 600;
		font-family: 'SFMono-Regular', Consolas, monospace;
		color: var(--color-fg-default);
	}
	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.toggle-raw,
	.action-btn {
		font-size: 0.75rem;
		padding: 4px 10px;
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		background: var(--color-bg-primary);
		color: var(--color-fg-muted);
		cursor: pointer;
	}
	.toggle-raw:hover,
	.action-btn:hover {
		color: var(--color-fg-default);
	}
	.close-btn {
		font-size: 1rem;
		padding: 4px 8px;
		border: none;
		background: none;
		color: var(--color-fg-muted);
		cursor: pointer;
		line-height: 1;
	}
	.close-btn:hover {
		color: var(--color-fg-default);
	}
	.meta-row {
		display: flex;
		gap: 20px;
		padding: 8px 20px;
		font-size: 0.8rem;
		color: var(--color-fg-muted);
		border-bottom: 1px solid var(--color-border-default);
		background: var(--color-bg-secondary);
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	.meta-row strong {
		color: var(--color-fg-default);
	}
	.table-wrap {
		flex: 1;
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.78rem;
	}
	thead {
		position: sticky;
		top: 0;
		background: var(--color-bg-secondary);
		z-index: 1;
	}
	th {
		padding: 6px 12px;
		text-align: left;
		font-weight: 600;
		color: var(--color-fg-muted);
		border-bottom: 1px solid var(--color-border-default);
		white-space: nowrap;
	}
	td {
		padding: 5px 12px;
		border-bottom: 1px solid var(--color-border-default);
		vertical-align: middle;
	}
	tr:hover td {
		background: var(--color-bg-secondary);
	}
	.num {
		color: var(--color-fg-muted);
		text-align: right;
		width: 40px;
	}
	.type-badge {
		font-weight: 600;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.path {
		font-family: 'SFMono-Regular', Consolas, monospace;
		font-size: 0.72rem;
		color: var(--color-fg-muted);
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.raw-json {
		flex: 1;
		overflow: auto;
		padding: 16px 20px;
		font-family: 'SFMono-Regular', Consolas, monospace;
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--color-fg-default);
		white-space: pre;
		margin: 0;
	}
</style>
