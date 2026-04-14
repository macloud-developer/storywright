<script lang="ts">
	import type { TestEntry } from '../lib/types.js';
	import { entryKey } from '../lib/types.js';
	import { createVirtualScroll } from '../lib/virtual-scroll.svelte.js';
	import DiffCard from './DiffCard.svelte';

	let {
		entries,
		viewedSet,
		tabMap,
		onViewedChange,
		onTabChange,
		onVisibleChange,
		scrollToKey = '',
	}: {
		entries: TestEntry[];
		viewedSet: Set<string>;
		tabMap: Map<string, 'expected' | 'actual' | 'diff'>;
		onViewedChange: (key: string, viewed: boolean) => void;
		onTabChange: (key: string, tab: 'expected' | 'actual' | 'diff') => void;
		onVisibleChange?: (key: string) => void;
		scrollToKey?: string;
	} = $props();

	let containerEl: HTMLDivElement | undefined = $state();

	const vs = createVirtualScroll({
		getCount: () => entries.length,
		getScrollElement: () => containerEl ?? null,
		estimateSize: () => 58,
		overscan: 10,
		paddingStart: 24,
		gap: 16,
		dynamic: true,
	});

	// After each render, measure all visible elements so TanStack knows actual heights.
	// TanStack's onChange only fires when range actually changes, so this won't loop.
	$effect(() => {
		// Track vs.items to run after items change
		const items = vs.items;
		if (!containerEl || items.length === 0) return;
		queueMicrotask(() => {
			if (!containerEl) return;
			containerEl
				.querySelectorAll<HTMLElement>('[data-index]')
				.forEach((el) => vs.measureElement(el));
		});
	});

	// Reset scroll position when entries change (e.g. filtering)
	let prevEntriesRef: TestEntry[] | undefined;
	$effect(() => {
		const cur = entries;
		if (prevEntriesRef !== undefined && prevEntriesRef !== cur) {
			vs.resetScroll();
		}
		prevEntriesRef = cur;
	});

	// Suppress activeIndex tracking during programmatic scroll
	let isScrollingTo = false;
	let handledScrollKey = '';

	// Scroll to entry on sidebar click
	$effect(() => {
		if (!scrollToKey || scrollToKey === handledScrollKey) return;
		const key = scrollToKey;
		handledScrollKey = key;
		const idx = entries.findIndex((e) => entryKey(e) === key);
		if (idx < 0) return;

		isScrollingTo = true;
		vs.scrollToIndex(idx, { align: 'start', behavior: 'smooth' });
		setTimeout(() => {
			isScrollingTo = false;
		}, 500);
	});

	// Track active entry for sidebar highlight
	$effect(() => {
		if (isScrollingTo) return;
		const idx = vs.activeIndex();
		if (idx >= 0 && idx < entries.length) onVisibleChange?.(entryKey(entries[idx]));
	});
</script>

<div class="card-list" bind:this={containerEl}>
	<div class="scroll-content" style="height:{vs.totalSize}px">
		{#each vs.items as virtualItem (virtualItem.key)}
			{@const entry = entries[virtualItem.index]}
			{@const key = entryKey(entry)}
			<div
				data-index={virtualItem.index}
				data-entry-key={key}
				class="card-slot"
				style="transform:translateY({virtualItem.start}px)"
			>
				<DiffCard
					{entry}
					viewed={viewedSet.has(key)}
					activeTab={tabMap.get(key)}
					onViewedChange={(v) => onViewedChange(key, v)}
					onTabChange={(tab) => onTabChange(key, tab)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.card-list {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}
	.scroll-content {
		position: relative;
		width: 100%;
	}
	.card-slot {
		position: absolute;
		top: 0;
		left: 24px;
		right: 24px;
	}
</style>
