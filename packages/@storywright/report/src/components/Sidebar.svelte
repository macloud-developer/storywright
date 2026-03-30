<script lang="ts">
	import type { TestEntry, TypeFilter } from '../lib/types.js';
	import { entryKey } from '../lib/types.js';
	import { magnifyingGlass, checkCircle, xCircle, plusCircle } from '../lib/icons.js';
	import { createVirtualScroll } from '../lib/virtual-scroll.svelte.js';
	import FilterDropdown from './FilterDropdown.svelte';

	let {
		entries,
		browsers = [],
		search = $bindable(''),
		typeFilter = $bindable<TypeFilter>('all'),
		browserFilter = $bindable<Set<string>>(new Set()),
		activeId = '',
		onSelect,
	}: {
		entries: TestEntry[];
		browsers: string[];
		search: string;
		typeFilter: TypeFilter;
		browserFilter: Set<string>;
		activeId?: string;
		onSelect?: (entry: TestEntry, index: number) => void;
	} = $props();

	let listEl: HTMLElement | undefined = $state();

	const vs = createVirtualScroll({
		getCount: () => entries.length,
		getScrollElement: () => listEl ?? null,
		estimateSize: () => 45,
		overscan: 20,
		gap: 0,
	});

	// Scroll active entry into view
	$effect(() => {
		if (!activeId) return;
		const idx = entries.findIndex((e) => entryKey(e) === activeId);
		if (idx >= 0) vs.scrollToIndex(idx, { align: 'start', behavior: 'smooth' });
	});
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
		<FilterDropdown {browsers} bind:typeFilter bind:browserFilter />
	</div>
	<nav class="entry-list" aria-label="Test entry list" bind:this={listEl}>
		{#if entries.length === 0}
			<div class="empty">No matches</div>
		{:else}
			<div class="scroll-content" style="height:{vs.totalSize}px">
				{#each vs.items as virtualItem (virtualItem.key)}
					{@const entry = entries[virtualItem.index]}
					<button
						class="entry-item"
						class:active={activeId === entryKey(entry)}
						onclick={() => onSelect?.(entry, virtualItem.index)}
						title="{entry.story}: {entry.variant} ({entry.browser})"
						style="height:{virtualItem.size}px;transform:translateY({virtualItem.start}px)"
					>
						<span class="item-icon" class:icon-pass={entry.type === 'pass'} class:icon-diff={entry.type === 'diff'} class:icon-new={entry.type === 'new'}>
							{#if entry.type === 'pass'}
								{@html checkCircle}
							{:else if entry.type === 'new'}
								{@html plusCircle}
							{:else}
								{@html xCircle}
							{/if}
						</span>
						<div class="item-info">
							<span class="item-title">{entry.story}</span>
							<span class="item-meta">
								{entry.variant} · {entry.browser}
								{#if entry.type === 'diff' && entry.diffRatio > 0}
									· {(entry.diffRatio * 100).toFixed(1)}%
								{/if}
							</span>
						</div>
					</button>
				{/each}
			</div>
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
		padding: 8px 12px;
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
	.entry-list {
		flex: 1;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem;
		text-align: center;
		color: var(--color-fg-muted);
		font-size: 0.85rem;
	}
	.scroll-content {
		position: relative;
		width: 100%;
	}
	.entry-item {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 8px;
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
		overflow: hidden;
	}
	.entry-item:hover {
		background: var(--color-bg-secondary);
	}
	.entry-item.active {
		background: var(--color-bg-tertiary);
		border-left: 2px solid var(--color-accent);
	}
	.item-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-top: 2px;
	}
	.icon-pass {
		color: var(--color-success);
	}
	.icon-diff {
		color: var(--color-danger);
	}
	.icon-new {
		color: var(--color-accent);
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
