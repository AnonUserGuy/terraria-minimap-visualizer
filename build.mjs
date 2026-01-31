import esbuild from "esbuild";

const base = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  target: ["es2020"],
  sourcemap: true
};

const index = {
  ...base,
  format: "esm",
  platform: "browser"
}

const global = {
  ...base,
  format: "iife",
  globalName: "terrariaMinimapVisualizer"
}

await esbuild.build({
  ...index,
  outfile: "dist/browser/index.js",
  minify: false
});

await esbuild.build({
  ...index,
  outfile: "dist/browser/index.min.js",
  minify: true
});

await esbuild.build({
  ...global,
  outfile: "dist/browser/global.js",
  minify: false
});

await esbuild.build({
  ...global,
  outfile: "dist/browser/global.min.js",
  minify: true
});