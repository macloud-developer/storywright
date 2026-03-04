<script lang="ts">
	import type { TestEntry } from '../lib/types.js';
	import { entryKey } from '../lib/types.js';
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

	let containerEl: HTMLDivElement | undefined = $state();

	function cardId(f: TestEntry) {
		return `card-${entryKey(f).replace(/[^a-zA-Z0-9]/g, '-')}`;
	}

	// Fix #5: $effect で Observer をフィルター変更に追従
	$effect(() => {
		if (!containerEl) return;
		// entries を依存に含めることで、フィルター変更時に再構築
		const _deps = entries.length;
		void _deps;

		// DOM 更新を待ってから observe
		const timer = setTimeout(() => {
			const observer = new IntersectionObserver(
				(ioEntries) => {
					for (const ioEntry of ioEntries) {
						if (ioEntry.isIntersecting) {
							const el = ioEntry.target as HTMLElement;
							const key = el.dataset.entryKey;
							if (key) {
								onVisibleChange?.(key);
							}
							break;
						}
					}
				},
				{
					root: containerEl,
					rootMargin: '-10% 0px -80% 0px',
					threshold: 0,
				},
			);

			// Fix #3: Array.from で NodeListOf を変換
			const cards = Array.from(containerEl!.querySelectorAll('[data-entry-key]'));
			for (const card of cards) {
				observer.observe(card);
			}

			cleanup = () => observer.disconnect();
		}, 0);

		let cleanup: (() => void) | undefined;

		return () => {
			clearTimeout(timer);
			cleanup?.();
		};
	});

	// Scroll to card when scrollToKey changes
	$effect(() => {
		if (scrollToKey && containerEl) {
			const el = containerEl.querySelector(`[data-entry-key="${CSS.escape(scrollToKey)}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	});
</script>

<div class="card-list" bind:this={containerEl}>
	{#each entries as entry, i (`${entryKey(entry)}::${i}`)}
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

<style>
	.card-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px 24px;
		overflow-y: auto;
		flex: 1;
	}
</style>
