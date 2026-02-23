<script lang="ts">
	import { sun, moon } from '../lib/icons.js';
	import { toggleTheme, isDark } from '../lib/theme.svelte.js';
</script>

<button
	class="theme-toggle"
	onclick={toggleTheme}
	aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{@html isDark() ? sun : moon}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--color-border-default);
		border-radius: 6px;
		background: var(--color-bg-secondary);
		color: var(--color-fg-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.theme-toggle:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-fg-default);
	}
</style>
