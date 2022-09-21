import "@testing-library/cypress/add-commands";
import { v4 as uuidv4 } from "uuid";
import {
  CloudPlatform,
  JobReportStatusEnum,
  WorkspaceDescription,
  WorkspaceStageModel,
} from "../../src/generated/workspacemanager";
import { createApis } from "../../src/lib/api/api";
import { TestProfile } from "../../src/testing/profile";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      accessToken(): Chainable<string>;
      login(): Chainable<void>;
      apis(): Chainable<ReturnType<typeof createApis>>;
      createWorkspace(): Chainable<WorkspaceDescription>;
    }
  }
}

Cypress.Commands.add("accessToken", () => {
  if (Cypress.env("USE_FAKE")) {
    return cy.wrap(Promise.resolve("fake access token"));
  }
  // Retrieves an access token from the plugin (running in local NodeJS env).
  return cy.task("accessToken");
});

Cypress.Commands.add("login", () => {
  const storeAuth = (token: string, profile: unknown) => {
    window.localStorage.setItem(
      "authResponse",
      JSON.stringify({
        access_token: token,
        id_token: token,
        expires_at: Date.now() + 3600 * 1000, // 1 hour
      })
    );
    window.localStorage.setItem("profile", JSON.stringify(profile));
  };
  cy.accessToken().then((token) => {
    if (Cypress.env("USE_FAKE")) {
      storeAuth(token, TestProfile);
    } else {
      // Requests the userinfo so as to populate the profile.
      cy.request({
        method: "GET",
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body }) => {
        storeAuth(token, body);
      });
    }
  });
});

Cypress.Commands.add("apis", () => {
  cy.accessToken().then((token: string) => {
    return createApis(
      () => Promise.resolve(token),
      Cypress.env("USE_FAKE") ? "localhost" : Cypress.env("API_ENVIRONMENT")
    );
  });
});

Cypress.Commands.add("createWorkspace", () => {
  cy.apis().then(({ workspaceApi, jobsApi }) => {
    const id = uuidv4();
    const suffix = Math.random().toString().substring(2, 10);
    return cy.wrap(
      workspaceApi
        .createWorkspace({
          createWorkspaceRequestBody: {
            id: id,
            userFacingId: "test-id-" + suffix,
            displayName: "test-name-" + suffix,
            stage: WorkspaceStageModel.McWorkspace,
            spendProfile: "wm-default-spend-profile",
          },
        })
        .then(async () => {
          const jobId = uuidv4();
          await workspaceApi.createCloudContext({
            workspaceId: id,
            createCloudContextRequest: {
              cloudPlatform: CloudPlatform.Gcp,
              jobControl: { id: jobId },
            },
          });
          return await new Promise(function (resolve) {
            (function waitForJob() {
              jobsApi.retrieveJob({ jobId: jobId }).then((job) => {
                if (job.status != JobReportStatusEnum.Running)
                  return resolve(null);
                setTimeout(waitForJob, 1000);
              });
            })();
          });
        })
        .then(() => workspaceApi.getWorkspace({ workspaceId: id })),
      { timeout: 5 * 60 * 1000 }
    );
  });
});

Cypress.Commands.add("renderAndCompareDocument", (filename, name) => {
  cy.findByRole("document", { name: name })
    .invoke("prop", "innerHTML")
    .then((actual) => {
      cy.readFile(filename).then((raw) => {
        cy.document()
          .then((document) => {
            document.write(raw);
            return document.body.innerHTML;
          })
          .should("eq", actual);
      });
    });
});
