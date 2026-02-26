<script lang="ts">
	import type { FailureEntry } from '../lib/types.js';
	import { failureKey } from '../lib/types.js';
	import DiffCard from './DiffCard.svelte';

	let {
		failures,
		viewedSet,
		onViewedChange,
		onVisibleChange,
		scrollToKey = '',
	}: {
		failures: FailureEntry[];
		viewedSet: Set<string>;
		onViewedChange: (key: string, viewed: boolean) => void;
		onVisibleChange?: (key: string) => void;
		scrollToKey?: string;
	} = $props();

	let containerEl: HTMLDivElement | undefined = $state();

	function cardId(f: FailureEntry) {
		return `card-${failureKey(f).replace(/[^a-zA-Z0-9]/g, '-')}`;
	}

	// Fix #5: $effect で Observer をフィルター変更に追従
	$effect(() => {
		if (!containerEl) return;
		// failures を依存に含めることで、フィルター変更時に再構築
		const _deps = failures.length;
		void _deps;

		// DOM 更新を待ってから observe
		const timer = setTimeout(() => {
			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							const el = entry.target as HTMLElement;
							const key = el.dataset.failureKey;
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
			const cards = Array.from(containerEl!.querySelectorAll('[data-failure-key]'));
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
			const el = containerEl.querySelector(`[data-failure-key="${CSS.escape(scrollToKey)}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	});
</script>

<div class="card-list" bind:this={containerEl}>
	{#each failures as failure, i (`${failureKey(failure)}::${i}`)}
		{@const key = failureKey(failure)}
		<div id={cardId(failure)} data-failure-key={key}>
			<DiffCard
				{failure}
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
