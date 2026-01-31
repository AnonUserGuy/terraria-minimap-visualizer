import esbuild from "esbuild";

const base = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  globalName: "terrariaMinimapVisualizer",
  target: ["es2020"],
  sourcemap: true
};

await esbuild.build({
  ...base,
  outfile: "dist/browser/terraria-minimap-visualizer.js",
  minify: false
});

await esbuild.build({
  ...base,
  outfile: "dist/browser/terraria-minimap-visualizer.min.js",
  minify: true
});