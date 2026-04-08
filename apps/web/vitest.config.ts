import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@showready/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@showready/scoring": path.resolve(__dirname, "../../packages/scoring/src/index.ts"),
      "@showready/db": path.resolve(__dirname, "../../packages/db/src/index.ts")
    }
  },
  test: {
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**", "dist/**"]
  }
})
