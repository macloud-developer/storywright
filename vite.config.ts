export default {
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  staged: {
    "*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,json,css,html}": "vp fmt",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
};
