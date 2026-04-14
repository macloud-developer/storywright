<script lang="ts">
	import type { TestEntry, ImageTab } from '../lib/types.js';
	import { photo, sliderArrows } from '../lib/icons.js';

	let {
		entry,
		activeTab: externalTab,
		onTabChange,
	}: {
		entry: TestEntry;
		activeTab?: ImageTab;
		onTabChange?: (tab: ImageTab) => void;
	} = $props();

	const defaultTab: ImageTab = $derived(entry.type === 'new' ? 'actual' : 'diff');
	const currentTab: ImageTab = $derived(externalTab ?? defaultTab);

	const imageTabs: { key: ImageTab; label: string }[] = [
		{ key: 'expected', label: 'Expected' },
		{ key: 'actual', label: 'Actual' },
		{ key: 'diff', label: 'Diff' },
		{ key: 'slide', label: 'Slide' },
	];

	let sliderValue = $state(50);

	function isDisabled(tab: ImageTab): boolean {
		if (entry.type === 'new') {
			return tab !== 'actual';
		}
		if (tab === 'slide') {
			return !entry.expected || !entry.actual;
		}
		return false;
	}
</script>

<div class="image-tabs">
	<div class="tabs" role="tablist">
		{#each imageTabs as tab}
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
		{#each imageTabs as tab (tab.key)}
			{@const isActive = currentTab === tab.key}
			{@const isNewPlaceholder = entry.type === 'new' && tab.key !== 'actual'}
			{#if tab.key === 'slide'}
				{#if isActive}
					<div class="image-panel">
						{#if entry.expected && entry.actual}
							<div class="slider-compare">
								<img class="slider-img-bottom" src={entry.actual} alt="Actual" />
								<div class="slider-img-top" style="clip-path:inset(0 {100 - sliderValue}% 0 0)">
									<img src={entry.expected} alt="Expected" />
								</div>
								<div class="slider-divider" style="left:{sliderValue}%">
									<span class="slider-arrow">{@html sliderArrows}</span>
								</div>
								<input
									class="slider-range"
									type="range"
									min="0"
									max="100"
									bind:value={sliderValue}
									aria-label="Slide to compare"
								/>
								<span class="slider-label slider-label-left">Expected</span>
								<span class="slider-label slider-label-right">Actual</span>
							</div>
						{:else}
							<div class="no-image">
								{@html photo}
								<p>No images to compare</p>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="image-panel" class:hidden={!isActive}>
					{#if isNewPlaceholder}
						<div class="no-image">
							{@html photo}
							<p>New story — no baseline exists yet.</p>
							<p class="hint">Run with <code>--update-snapshots</code> to create baseline</p>
						</div>
					{:else if entry[tab.key] || ''}
						<img src={entry[tab.key]} alt={tab.label} />
					{:else}
						<div class="no-image">
							{@html photo}
							<p>No image available</p>
						</div>
					{/if}
				</div>
			{/if}
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

	/* Slide compare */
	.slider-compare {
		position: relative;
		display: inline-block;
		overflow: hidden;
		line-height: 0;
		user-select: none;
		max-width: 100%;
	}
	.slider-img-bottom {
		display: block;
		max-width: 100%;
	}
	.slider-img-top {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.slider-img-top img {
		display: block;
		width: 100%;
		height: 100%;
	}
	.slider-divider {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--color-accent);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 2;
	}
	.slider-arrow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--color-accent);
	}
	.slider-range {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: ew-resize;
		z-index: 3;
	}
	.slider-label {
		position: absolute;
		top: 8px;
		padding: 3px 10px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.4;
		pointer-events: none;
		z-index: 4;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		white-space: nowrap;
	}
	.slider-label-left {
		left: 8px;
	}
	.slider-label-right {
		right: 8px;
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
