import { defineConfig } from "cypress";
import plugins from "./cypress/plugins/index";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      return plugins(on, config);
    },
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000,
    viewportWidth: 1200,
    viewportHeight: 800,
  },
});
