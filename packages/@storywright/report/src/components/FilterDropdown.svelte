<script lang="ts">
	import type { TypeFilter } from '../lib/types.js';
	import { checkCircle, xCircle, plusCircle, funnel } from '../lib/icons.js';

	let {
		browsers = [],
		typeFilter = $bindable<TypeFilter>('all'),
		browserFilter = $bindable<Set<string>>(new Set()),
	}: {
		browsers: string[];
		typeFilter: TypeFilter;
		browserFilter: Set<string>;
	} = $props();

	let open = $state(false);
	let wrapperEl: HTMLDivElement | undefined = $state();

	const typeOptions: { key: TypeFilter; label: string; icon: string; color: string }[] = [
		{ key: 'all', label: 'All', icon: '', color: '' },
		{ key: 'pass', label: 'Pass', icon: checkCircle, color: 'var(--color-success)' },
		{ key: 'diff', label: 'Diff', icon: xCircle, color: 'var(--color-danger)' },
		{ key: 'new', label: 'New', icon: plusCircle, color: 'var(--color-accent)' },
	];

	function toggleBrowser(b: string) {
		const next = new Set(browserFilter);
		if (next.has(b)) {
			next.delete(b);
		} else {
			next.add(b);
		}
		browserFilter = next;
	}

	function clearAll() {
		typeFilter = 'all';
		browserFilter = new Set();
	}

	const hasActiveFilter = $derived(typeFilter !== 'all' || browserFilter.size > 0);
	const activeFilterCount = $derived(
		(typeFilter !== 'all' ? 1 : 0) + browserFilter.size,
	);

	function handleWindowClick(e: MouseEvent) {
		if (open && wrapperEl && !wrapperEl.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="filter-wrapper" bind:this={wrapperEl}>
	<button
		class="filter-toggle"
		class:active={hasActiveFilter}
		onclick={() => (open = !open)}
	>
		{@html funnel}
		{#if activeFilterCount > 0}
			<span class="filter-badge">{activeFilterCount}</span>
		{/if}
	</button>
	{#if open}
		<div class="filter-dropdown">
			<div class="dropdown-section-header">Type</div>
			{#each typeOptions as opt}
				<button
					class="dropdown-type-item"
					class:selected={typeFilter === opt.key}
					onclick={() => (typeFilter = opt.key)}
				>
					{#if opt.icon}
						<span class="dropdown-type-icon" style="color:{opt.color}">{@html opt.icon}</span>
					{/if}
					<span>{opt.label}</span>
					{#if typeFilter === opt.key}
						<svg class="check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
					{/if}
				</button>
			{/each}
			{#if browsers.length > 1}
				<div class="dropdown-divider"></div>
				<div class="dropdown-section-header">Browser</div>
				{#each browsers as b}
					<label class="dropdown-check-item">
						<input
							type="checkbox"
							checked={browserFilter.has(b)}
							onchange={() => toggleBrowser(b)}
						/>
						<span>{b}</span>
					</label>
				{/each}
			{/if}
			{#if hasActiveFilter}
				<div class="dropdown-divider"></div>
				<button class="dropdown-clear" onclick={clearAll}>
					Clear all filters
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-wrapper {
		position: relative;
		flex-shrink: 0;
	}
	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		background: var(--color-bg-primary);
		color: var(--color-fg-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}
	.filter-toggle:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-fg-default);
	}
	.filter-toggle.active {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
	.filter-badge {
		font-weight: 600;
		font-size: 0.6rem;
		background: var(--color-accent);
		color: white;
		border-radius: 50%;
		width: 14px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	.filter-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 100;
		min-width: 180px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		overflow: hidden;
	}
	.dropdown-section-header {
		padding: 6px 12px 4px;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.dropdown-divider {
		height: 1px;
		background: var(--color-border-default);
		margin: 4px 0;
	}
	.dropdown-type-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px 12px;
		border: none;
		background: transparent;
		font-size: 0.8rem;
		font-family: inherit;
		color: var(--color-fg-default);
		cursor: pointer;
		transition: background 0.1s;
		text-align: left;
	}
	.dropdown-type-item:hover {
		background: var(--color-bg-secondary);
	}
	.dropdown-type-item.selected {
		font-weight: 600;
	}
	.dropdown-type-icon {
		display: flex;
		align-items: center;
	}
	.check-icon {
		margin-left: auto;
		color: var(--color-accent);
	}
	.dropdown-check-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		font-size: 0.8rem;
		color: var(--color-fg-default);
		cursor: pointer;
		transition: background 0.1s;
	}
	.dropdown-check-item:hover {
		background: var(--color-bg-secondary);
	}
	.dropdown-check-item input[type='checkbox'] {
		accent-color: var(--color-accent);
	}
	.dropdown-clear {
		display: block;
		width: 100%;
		padding: 6px 12px;
		border: none;
		background: transparent;
		color: var(--color-accent);
		font-size: 0.75rem;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
	}
	.dropdown-clear:hover {
		background: var(--color-bg-secondary);
	}
</style>
