<script lang="ts">
	import type { TestEntry } from '../lib/types.js';
	import { entryKey } from '../lib/types.js';
	import { createVirtualScroll } from '../lib/virtual-scroll.svelte.js';
	import DiffCard from './DiffCard.svelte';

	let {
		entries,
		viewedSet,
		onViewedChange,
		onVisibleChange,
		scrollToKey = '',
	}: {
		entries: TestEntry[];
		viewedSet: Set<string>;
		onViewedChange: (key: string, viewed: boolean) => void;
		onVisibleChange?: (key: string) => void;
		scrollToKey?: string;
	} = $props();

	const vs = createVirtualScroll(() => entries.length, {
		itemHeight: 58,
		gap: 16,
		overscan: 20,
	});

	let containerEl: HTMLDivElement | undefined = $state();
	$effect(() => vs.bindContainer(containerEl));

	// Scroll to entry on sidebar click
	$effect(() => {
		if (!scrollToKey) return;
		const idx = entries.findIndex((e) => entryKey(e) === scrollToKey);
		if (idx >= 0) vs.scrollToIndex(idx);
	});

	// Track active entry for sidebar highlight
	$effect(() => {
		const idx = vs.activeIndex();
		if (idx >= 0) onVisibleChange?.(entryKey(entries[idx]));
	});

	function cardId(f: TestEntry) {
		return `card-${entryKey(f).replace(/[^a-zA-Z0-9]/g, '-')}`;
	}
</script>

<div class="card-list" bind:this={containerEl} onscroll={vs.onScroll}>
	<div class="scroll-content" style="height:{vs.totalHeight}px">
		<div class="visible-window" style="transform:translateY({vs.offsetY}px)">
			{#each entries.slice(vs.startIdx, vs.endIdx) as entry, i (`${entryKey(entry)}::${vs.startIdx + i}`)}
				{@const key = entryKey(entry)}
				<div id={cardId(entry)} data-entry-key={key}>
					<DiffCard
						{entry}
						viewed={viewedSet.has(key)}
						onViewedChange={(v) => onViewedChange(key, v)}
					/>
				</div>
			{/each}
		</div>
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
		padding: 16px 24px;
	}
	.visible-window {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
