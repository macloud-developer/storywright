import {
  Virtualizer,
  observeElementRect,
  observeElementOffset,
  elementScroll,
  measureElement,
  type VirtualItem,
} from "@tanstack/virtual-core";

export type { VirtualItem };

export interface VirtualScrollOptions {
  getCount: () => number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
  paddingStart?: number;
  gap?: number;
  /** Enable dynamic height measurement via ResizeObserver */
  dynamic?: boolean;
}

export interface VirtualScrollState {
  readonly items: VirtualItem[];
  readonly totalSize: number;
  scrollToIndex: (
    index: number,
    opts?: { align?: "start" | "center" | "end"; behavior?: ScrollBehavior },
  ) => void;
  resetScroll: () => void;
  activeIndex: () => number;
  /**
   * Measure a DOM element for dynamic sizing.
   * The element must have a `data-index` attribute.
   */
  measureElement: (el: Element) => void;
}

export function createVirtualScroll(options: VirtualScrollOptions): VirtualScrollState {
  let _items = $state<VirtualItem[]>([]);
  let _totalSize = $state(0);
  let _virtualizer: Virtualizer<HTMLElement, Element> | undefined;

  $effect(() => {
    const count = options.getCount();
    const scrollElement = options.getScrollElement();
    if (!scrollElement) return;

    const v = new Virtualizer<HTMLElement, Element>({
      count,
      getScrollElement: () => scrollElement,
      estimateSize: options.estimateSize,
      overscan: options.overscan ?? 20,
      paddingStart: options.paddingStart ?? 0,
      gap: options.gap ?? 0,
      observeElementRect,
      observeElementOffset,
      scrollToFn: elementScroll,
      measureElement: options.dynamic ? measureElement : undefined,
      onChange: (instance) => {
        _items = instance.getVirtualItems();
        _totalSize = instance.getTotalSize();
      },
    });

    _virtualizer = v;
    v._willUpdate();
    const cleanup = v._didMount();
    _items = v.getVirtualItems();
    _totalSize = v.getTotalSize();

    return () => {
      cleanup();
      _virtualizer = undefined;
    };
  });

  return {
    get items() {
      return _items;
    },
    get totalSize() {
      return _totalSize;
    },

    scrollToIndex(index, opts) {
      _virtualizer?.scrollToIndex(index, {
        align: opts?.align ?? "start",
        behavior: opts?.behavior ?? "auto",
      });
    },

    resetScroll() {
      _virtualizer?.scrollToOffset(0, { behavior: "auto" });
    },

    activeIndex() {
      if (_items.length === 0 || !_virtualizer) return -1;
      const scrollOffset = _virtualizer.scrollOffset ?? 0;
      for (const item of _items) {
        if (item.start + item.size > scrollOffset) return item.index;
      }
      return _items[0].index;
    },

    measureElement(el) {
      _virtualizer?.measureElement(el);
    },
  };
}
