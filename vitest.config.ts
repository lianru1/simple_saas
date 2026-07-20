import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    globals: true,
    // 路径别名 — 跟 tsconfig.json 保持一致
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: [
        "config/**",
        "lib/**",
        "app/api/**",
        "components/**/*.tsx",
      ],
      exclude: [
        "node_modules/**",
        ".next/**",
        "**/*.test.*",
        "**/__tests__/**",
      ],
    },
  },
});
