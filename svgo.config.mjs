/**
 * SVGO config - strips Figma export cruft while preserving recolorability.
 * Run via `pnpm run icons:optimize` and the Husky pre-commit hook.
 */
export default {
  multipass: true,
  js2svg: { indent: 2, pretty: false },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeViewBox: false,
          cleanupIds: { remove: false, minify: true },
          inlineStyles: { onlyMatchedOnce: false },
        },
      },
    },
    "removeDimensions",
    "removeXMLNS",
    {
      name: "addAttributesToSVGElement",
      params: { attributes: [{ xmlns: "http://www.w3.org/2000/svg" }] },
    },
    {
      name: "convertColors",
      params: { currentColor: false, shorthex: true, names2hex: true },
    },
  ],
};
