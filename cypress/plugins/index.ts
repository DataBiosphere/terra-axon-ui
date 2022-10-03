import fetch from "node-fetch";
import {
  getServiceAccountKey,
  getTestUserTokenFromKey,
} from "../../src/lib/testUser";

export default async function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) {
  const useFake = process.env.CYPRESS_USE_FAKE;
  const key = useFake ? "" : await getServiceAccountKey();
  on("task", {
    /**
     * accessToken retrieves an access token as the test user. Implemented as a
     * plugin so as to run in the local NodeJS environment (not in the browser).
     */
    async accessToken() {
      return await getTestUserTokenFromKey(key);
    },

    async fakeHealthCheck() {
      return await fetch("http://localhost:3002")
        .then((resp) => resp.status === 200)
        .catch(() => false);
    },
  });
  return config;
}
