import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vite otherwise replaces BASE_URL with its own "/" asset base in workers.
    env: { BASE_URL: process.env.BASE_URL || "http://localhost:3001" },
    include: ["tests/live/**/*.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    retry: 0,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
