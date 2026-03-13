export interface VirtualScrollOptions {
	/** Estimated item height in px */
	itemHeight: number;
	/** Gap between items in px */
	gap: number;
	/** Number of extra items rendered above/below viewport */
	overscan?: number;
}

export interface VirtualScrollState {
	readonly totalHeight: number;
	readonly startIdx: number;
	readonly endIdx: number;
	readonly offsetY: number;
	readonly rowHeight: number;
	onScroll: () => void;
	scrollToIndex: (index: number) => void;
	activeIndex: () => number;
	bindContainer: (el: HTMLElement | undefined) => void;
}

export function createVirtualScroll(
	getCount: () => number,
	options: VirtualScrollOptions,
): VirtualScrollState {
	const { itemHeight, gap, overscan = 20 } = options;
	const rowHeight = itemHeight + gap;

	let container: HTMLElement | undefined;
	let scrollY = $state(0);
	let viewH = $state(0);

	const totalHeight = $derived(
		getCount() > 0 ? getCount() * rowHeight - gap : 0,
	);

	const startIdx = $derived(
		Math.max(0, Math.floor(scrollY / rowHeight) - overscan),
	);

	const endIdx = $derived(
		Math.min(
			getCount(),
			Math.ceil((scrollY + viewH) / rowHeight) + overscan,
		),
	);

	const offsetY = $derived(startIdx * rowHeight);

	$effect(() => {
		if (!container) return;
		viewH = container.clientHeight;
		const ro = new ResizeObserver(() => {
			viewH = container!.clientHeight;
		});
		ro.observe(container);
		return () => ro.disconnect();
	});

	return {
		get totalHeight() {
			return totalHeight;
		},
		get startIdx() {
			return startIdx;
		},
		get endIdx() {
			return endIdx;
		},
		get offsetY() {
			return offsetY;
		},
		rowHeight,

		onScroll() {
			if (container) {
				scrollY = container.scrollTop;
			}
		},

		scrollToIndex(index: number) {
			container?.scrollTo({
				top: index * rowHeight,
				behavior: 'smooth',
			});
		},

		activeIndex() {
			if (getCount() === 0 || viewH === 0) return -1;
			return Math.max(
				0,
				Math.min(
					Math.floor((scrollY + viewH * 0.1) / rowHeight),
					getCount() - 1,
				),
			);
		},

		bindContainer(el: HTMLElement | undefined) {
			container = el;
		},
	};
}
