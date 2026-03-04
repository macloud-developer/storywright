<script lang="ts">
	import type { TestEntry } from '../lib/types.js';
	import { checkCircle, xCircle, plusCircle, eye, chevronDown, chevronUp } from '../lib/icons.js';
	import ImageTabs from './ImageTabs.svelte';

	let {
		entry,
		viewed = false,
		onViewedChange,
	}: {
		entry: TestEntry;
		viewed?: boolean;
		onViewedChange?: (viewed: boolean) => void;
	} = $props();

	let collapsed = $derived(entry.type === 'pass' || viewed);

	// Lazy mount: ビューポート付近に入るまで ImageTabs をマウントしない
	let nearViewport = $state(false);
	let cardEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!cardEl || nearViewport) return;
		const observer = new IntersectionObserver(
			([ioEntry]) => {
				if (ioEntry.isIntersecting) {
					nearViewport = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' },
		);
		observer.observe(cardEl);
		return () => observer.disconnect();
	});

	function handleViewedToggle(e: Event) {
		e.stopPropagation();
		onViewedChange?.(!viewed);
	}

	function handleCollapseToggle(e: Event) {
		e.stopPropagation();
		if (collapsed) {
			onViewedChange?.(false);
		} else {
			onViewedChange?.(true);
		}
	}

	function handleHeaderKeydown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === ' ') && collapsed) {
			e.preventDefault();
			handleCollapseToggle(e);
		}
	}

	const diffPercent = $derived(
		entry.type === 'diff' ? `${(entry.diffRatio * 100).toFixed(1)}%` : null,
	);
</script>

<div class="diff-card" class:collapsed class:is-new={entry.type === 'new'} class:is-pass={entry.type === 'pass'} bind:this={cardEl}>
	<div class="card-header" role="button" tabindex="0" onclick={collapsed ? handleCollapseToggle : undefined} onkeydown={handleHeaderKeydown}>
		<div class="header-left">
			<span class="type-icon">
				{#if entry.type === 'pass'}
					{@html checkCircle}
				{:else if entry.type === 'new'}
					{@html plusCircle}
				{:else}
					{@html xCircle}
				{/if}
			</span>
			<span class="story-name">{entry.story}: {entry.variant}</span>
			<span class="browser-badge">{entry.browser}</span>
			{#if diffPercent}
				<span class="diff-badge">{diffPercent}</span>
			{/if}
			{#if entry.type === 'new'}
				<span class="new-badge">NEW</span>
			{/if}
			{#if entry.type === 'pass'}
				<span class="pass-badge">PASS</span>
			{/if}
		</div>
		<div class="header-right">
			{#if entry.type !== 'pass'}
				<button
					class="viewed-btn"
					class:viewed
					onclick={handleViewedToggle}
					aria-label={viewed ? 'Mark as not viewed' : 'Mark as viewed'}
				>
					{@html eye}
					<span class="viewed-label">{viewed ? 'Viewed' : 'View'}</span>
				</button>
			{/if}
			{#if entry.type !== 'pass'}
				<button
					class="collapse-btn"
					onclick={handleCollapseToggle}
					aria-label={collapsed ? 'Expand' : 'Collapse'}
				>
					{@html collapsed ? chevronDown : chevronUp}
				</button>
			{/if}
		</div>
	</div>
	{#if !collapsed && nearViewport && entry.type !== 'pass'}
		<div class="card-body">
			<ImageTabs {entry} />
		</div>
	{/if}
</div>

<style>
	.diff-card {
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		background: var(--color-bg-primary);
		overflow: hidden;
	}
	.diff-card.collapsed {
		opacity: 0.7;
	}
	.diff-card.collapsed:hover {
		opacity: 1;
	}
	.diff-card.is-pass {
		opacity: 0.7;
	}
	.diff-card.is-pass:hover {
		opacity: 1;
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border-default);
		gap: 8px;
	}
	.collapsed .card-header {
		border-bottom: none;
		cursor: pointer;
	}
	.is-pass .card-header {
		border-bottom: none;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
	}
	.type-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.diff-card:not(.is-new):not(.is-pass) .type-icon {
		color: var(--color-danger);
	}
	.is-new .type-icon {
		color: var(--color-accent);
	}
	.is-pass .type-icon {
		color: var(--color-success);
	}
	.story-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-fg-default);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.browser-badge {
		flex-shrink: 0;
		padding: 1px 8px;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		font-size: 0.7rem;
		color: var(--color-fg-muted);
	}
	.diff-badge {
		flex-shrink: 0;
		padding: 1px 8px;
		background: var(--color-danger-subtle);
		color: var(--color-danger);
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
	}
	.new-badge {
		flex-shrink: 0;
		padding: 1px 8px;
		background: var(--color-accent-subtle);
		color: var(--color-accent);
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
	}
	.pass-badge {
		flex-shrink: 0;
		padding: 1px 8px;
		background: var(--color-success-subtle);
		color: var(--color-success);
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 600;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}
	.viewed-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		background: var(--color-bg-primary);
		color: var(--color-fg-muted);
		cursor: pointer;
		font-size: 0.75rem;
		font-family: inherit;
		transition: background 0.15s, color 0.15s;
	}
	.viewed-btn:hover {
		background: var(--color-bg-tertiary);
	}
	.viewed-btn.viewed {
		background: var(--color-success-subtle);
		color: var(--color-success);
		border-color: var(--color-success);
	}
	.viewed-label {
		white-space: nowrap;
	}
	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}
	.collapse-btn:hover {
		background: var(--color-bg-tertiary);
	}
	.card-body {
		border-top: none;
	}
</style>
