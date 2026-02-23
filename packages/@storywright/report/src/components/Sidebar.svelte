<script lang="ts">
	import type { FailureEntry, TypeFilter } from '../lib/types.js';
	import { failureKey } from '../lib/types.js';
	import { magnifyingGlass, xCircle, plusCircle } from '../lib/icons.js';

	let {
		failures,
		search = $bindable(''),
		typeFilter = $bindable<TypeFilter>('all'),
		activeId = '',
		onSelect,
	}: {
		failures: FailureEntry[];
		search: string;
		typeFilter: TypeFilter;
		activeId?: string;
		onSelect?: (failure: FailureEntry, index: number) => void;
	} = $props();
</script>

<aside class="sidebar">
	<div class="search-wrapper">
		<span class="search-icon">{@html magnifyingGlass}</span>
		<input
			type="text"
			class="search-input"
			placeholder="Filter stories..."
			bind:value={search}
		/>
	</div>
	<div class="filter-buttons">
		<button
			class="filter-btn"
			class:active={typeFilter === 'all'}
			onclick={() => (typeFilter = 'all')}
		>All</button>
		<button
			class="filter-btn filter-diff"
			class:active={typeFilter === 'diff'}
			onclick={() => (typeFilter = 'diff')}
		>
			{@html xCircle}
			Diff
		</button>
		<button
			class="filter-btn filter-new"
			class:active={typeFilter === 'new'}
			onclick={() => (typeFilter = 'new')}
		>
			{@html plusCircle}
			New
		</button>
	</div>
	<nav class="failure-list" aria-label="Failure list">
		{#if failures.length === 0}
			<div class="empty">No matches</div>
		{:else}
			{#each failures as failure, i}
				<button
					class="failure-item"
					class:active={activeId === failureKey(failure)}
					onclick={() => onSelect?.(failure, i)}
				>
					<span class="item-icon">
						{#if failure.type === 'new'}
							{@html plusCircle}
						{:else}
							{@html xCircle}
						{/if}
					</span>
					<div class="item-info">
						<span class="item-title">{failure.story}</span>
						<span class="item-meta">
							{failure.variant} · {failure.browser}
							{#if failure.type === 'diff' && failure.diffRatio > 0}
								· {(failure.diffRatio * 100).toFixed(1)}%
							{/if}
						</span>
					</div>
				</button>
			{/each}
		{/if}
	</nav>
</aside>

<style>
	.sidebar {
		width: 280px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--color-border-default);
		background: var(--color-bg-primary);
		height: 100%;
		overflow: hidden;
	}
	.search-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border-bottom: 1px solid var(--color-border-default);
	}
	.search-icon {
		display: flex;
		color: var(--color-fg-muted);
		flex-shrink: 0;
	}
	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 0.85rem;
		font-family: inherit;
		color: var(--color-fg-default);
		outline: none;
	}
	.search-input::placeholder {
		color: var(--color-fg-muted);
	}
	.filter-buttons {
		display: flex;
		gap: 4px;
		padding: 8px 12px;
		border-bottom: 1px solid var(--color-border-default);
	}
	.filter-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border: 1px solid var(--color-border-default);
		border-radius: 20px;
		background: var(--color-bg-primary);
		color: var(--color-fg-muted);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}
	.filter-btn:hover {
		background: var(--color-bg-tertiary);
	}
	.filter-btn.active {
		background: var(--color-fg-default);
		color: var(--color-bg-primary);
		border-color: var(--color-fg-default);
	}
	.filter-diff {
		color: var(--color-danger);
	}
	.filter-new {
		color: var(--color-accent);
	}
	.failure-list {
		flex: 1;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem;
		text-align: center;
		color: var(--color-fg-muted);
		font-size: 0.85rem;
	}
	.failure-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		border-bottom: 1px solid var(--color-border-default);
		background: transparent;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
		color: var(--color-fg-default);
		transition: background 0.1s;
	}
	.failure-item:last-child {
		border-bottom: none;
	}
	.failure-item:hover {
		background: var(--color-bg-secondary);
	}
	.failure-item.active {
		background: var(--color-bg-tertiary);
		border-left: 2px solid var(--color-accent);
	}
	.item-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-top: 2px;
	}
	.failure-item:not(.active) .item-icon {
		color: var(--color-fg-muted);
	}
	.item-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.item-title {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.item-meta {
		font-size: 0.7rem;
		color: var(--color-fg-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
