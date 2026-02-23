type Theme = 'light' | 'dark';

const STORAGE_KEY = 'storywright-theme';

function detect(): Theme {
	if (typeof window === 'undefined') return 'light';

	// localStorage に保存された手動選択を優先
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') return stored;
	} catch {
		// localStorage が使えない環境
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
	document.documentElement.setAttribute('data-theme', theme);
}

function save(theme: Theme) {
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// localStorage が使えない環境
	}
}

let current = $state<Theme>('light');

export function initTheme() {
	current = detect();
	apply(current);

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		// システム変更は手動選択がない場合のみ適用
		try {
			if (localStorage.getItem(STORAGE_KEY)) return;
		} catch {
			// fallthrough
		}
		current = e.matches ? 'dark' : 'light';
		apply(current);
	});
}

export function toggleTheme() {
	current = current === 'light' ? 'dark' : 'light';
	apply(current);
	save(current);
}

export function isDark(): boolean {
	return current === 'dark';
}
