import "@testing-library/cypress/add-commands";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
} from "../../src/generated/workspacemanager";

describe("edit buckets", () => {
  beforeEach("user is logged in", () => cy.login());

  it("succeeds", () => {
    createWorkspaceWithResources().then((workspace) => {
      cy.visit("/workspaces/" + workspace.userFacingId);
      cy.findByText("Resources").click();

      cy.findAllByRole("row").filter(':contains("controlled-bucket")').click();
      cy.get("button[aria-label=editResourceButton]").click();

      cy.findByRole("button", { name: "Update" }).should("be.disabled");

      cy.findByRole("textbox", { name: "Name" })
        .clear()
        .type("controlled-bucket-edited");
      cy.findByRole("textbox", { name: "Description" })
        .clear()
        .type("Edited description.");
      cy.findByRole("textbox", { name: "Cloud Bucket Name" }).should(
        "be.disabled"
      );

      cy.findByRole("button", { name: "Update" }).click();

      cy.findAllByRole("row")
        .contains("controlled-bucket-edited")
        .should("exist");
    });

    cy.findAllByRole("row").filter(':contains("reference-bucket")').click();
    cy.get("button[aria-label=editResourceButton]").click();

    cy.findByRole("button", { name: "Update" }).should("be.disabled");

    cy.findByRole("textbox", { name: "Name" })
      .clear()
      .type("reference-bucket-edited");
    cy.findByRole("textbox", { name: "Description" })
      .clear()
      .type("Edited description.");
    cy.findByRole("textbox", { name: "Cloud Bucket Name" })
      .clear()
      .type("reference-bucket-edited");

    cy.findByRole("button", { name: "Update" }).click();

    cy.findAllByRole("row").contains("reference-bucket-edited").should("exist");
  });
});

function createWorkspaceWithResources() {
  return cy
    .apis()
    .then(({ controlledGcpResourceApi, referencedGcpResourceApi }) =>
      cy.createWorkspace().then((workspace) =>
        Promise.all([
          (!Cypress.env("USE_FAKE")
            ? controlledGcpResourceApi.generateGcpGcsBucketCloudName({
                workspaceId: workspace.id,
                generateGcpGcsBucketCloudNameRequestBody: {
                  gcsBucketName: "edit-test",
                },
              })
            : Promise.resolve({
                generatedBucketCloudName:
                  "fake-bucket-" + workspace.displayName,
              })
          ).then((name) =>
            controlledGcpResourceApi.createBucket({
              workspaceId: workspace.id,
              createControlledGcpGcsBucketRequestBody: {
                common: {
                  name: "controlled-bucket",
                  cloningInstructions: CloningInstructionsEnum.Nothing,
                  accessScope: AccessScope.SharedAccess,
                  managedBy: ManagedBy.User,
                },
                gcsBucket: {
                  name: name.generatedBucketCloudName,
                },
              },
            })
          ),
          referencedGcpResourceApi.createBucketReference({
            workspaceId: workspace.id,
            createGcpGcsBucketReferenceRequestBody: {
              bucket: {
                bucketName: "reference-bucket",
              },
              metadata: {
                name: "reference-bucket-original",
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
        ]).then(() => workspace)
      )
    );
}
