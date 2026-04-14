<script lang="ts">
	import type { TestEntry } from '../lib/types.js';
	import { photo } from '../lib/icons.js';

	type Tab = 'expected' | 'actual' | 'diff';

	let {
		entry,
		activeTab: externalTab,
		onTabChange,
	}: {
		entry: TestEntry;
		activeTab?: Tab;
		onTabChange?: (tab: Tab) => void;
	} = $props();

	const defaultTab: Tab = $derived(entry.type === 'new' ? 'actual' : 'diff');
	const currentTab: Tab = $derived(externalTab ?? defaultTab);

	const tabs: { key: Tab; label: string }[] = [
		{ key: 'expected', label: 'Expected' },
		{ key: 'actual', label: 'Actual' },
		{ key: 'diff', label: 'Diff' },
	];

	function isDisabled(tab: Tab): boolean {
		if (entry.type === 'new') {
			return tab === 'expected' || tab === 'diff';
		}
		return false;
	}

</script>

<div class="image-tabs">
	<div class="tabs" role="tablist">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={currentTab === tab.key}
				disabled={isDisabled(tab.key)}
				onclick={() => onTabChange?.(tab.key)}
				role="tab"
				aria-selected={currentTab === tab.key}
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="image-container">
		{#each tabs as tab (tab.key)}
			{@const src = entry[tab.key] || ''}
			{@const isActive = currentTab === tab.key}
			{@const isNewPlaceholder = entry.type === 'new' && tab.key !== 'actual'}
			<div class="image-panel" class:hidden={!isActive}>
				{#if isNewPlaceholder}
					<div class="no-image">
						{@html photo}
						<p>New story — no baseline exists yet.</p>
						<p class="hint">Run with <code>--update-snapshots</code> to create baseline</p>
					</div>
				{:else if src}
					<img src={src} alt={tab.label} />
				{:else}
					<div class="no-image">
						{@html photo}
						<p>No image available</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.tabs {
		display: flex;
		border-bottom: 1px solid var(--color-border-default);
	}
	.tab {
		padding: 8px 16px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--color-fg-muted);
		font-family: inherit;
		transition: color 0.15s, border-color 0.15s;
	}
	.tab:hover:not(:disabled) {
		color: var(--color-fg-default);
	}
	.tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
		font-weight: 600;
	}
	.tab:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.image-container {
		background: var(--color-bg-tertiary);
	}
	.image-panel.hidden {
		display: none;
	}
	.image-container img {
		display: block;
		max-width: 100%;
	}
	.no-image {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: var(--color-fg-muted);
		gap: 8px;
	}
	.no-image p {
		margin: 0;
		font-size: 0.9rem;
	}
	.hint {
		font-size: 0.8rem !important;
		opacity: 0.7;
	}
	.hint code {
		background: var(--color-bg-secondary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.8rem;
	}
</style>
