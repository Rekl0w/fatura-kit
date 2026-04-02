import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  dts: true,
  format: ["esm", "cjs"],
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: "node18",
  outDir: "dist",
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
});
