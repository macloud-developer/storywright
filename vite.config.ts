export default {
  staged: {
    "*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,svelte,json,css,html}": "vp fmt",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
};
