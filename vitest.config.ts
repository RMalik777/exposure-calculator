import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so unit tests skip the Start/Cloudflare plugins.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: { include: ["src/**/*.test.ts"] },
});
