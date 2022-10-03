import "@testing-library/cypress/add-commands";
import { Context } from "mocha";
import {
  AccessScope,
  CloningInstructionsEnum,
  ManagedBy,
  WorkspaceDescription,
} from "../../src/generated/workspacemanager";

declare module "mocha" {
  interface Context {
    workspace: WorkspaceDescription;
  }
}

before(() =>
  createWorkspaceWithResources().then((ws) => cy.wrap(ws).as("workspace"))
);

describe("edit resources", () => {
  beforeEach(function (this: Context) {
    cy.login();
    cy.visit("/workspaces/" + this.workspace.userFacingId);
    cy.findByText("Resources").click();
  });

  const resourceTypes = [
    {
      name: "controlled-bucket",
      fields: [
        {
          name: "Name",
          edited: "controlled-bucket-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud bucket name",
          disabled: true,
        },
      ],
    },
    {
      name: "reference-bucket",
      fields: [
        {
          name: "Name",
          edited: "reference-bucket-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud bucket name",
          edited: "reference-bucket-edited",
        },
      ],
    },
    {
      name: "reference-object",
      fields: [
        {
          name: "Name",
          edited: "reference-object-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud object URL",
          edited: "gs://edited/edited",
        },
      ],
    },
    {
      name: "controlled-dataset",
      fields: [
        {
          name: "Name",
          edited: "controlled-dataset-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud dataset name",
          disabled: true,
        },
        {
          name: "Project ID",
          disabled: true,
        },
      ],
    },
    {
      name: "reference-dataset",
      fields: [
        {
          name: "Name",
          edited: "reference-dataset-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud dataset name",
          edited: "reference_dataset_edited",
        },
        {
          name: "Project ID",
          edited: "reference-dataset-edited",
        },
      ],
    },
    {
      name: "reference-datatable",
      fields: [
        {
          name: "Name",
          edited: "reference-datatable-edited",
        },
        {
          name: "Description",
          edited: "Edited description.",
        },
        {
          name: "Cloud dataset name",
          edited: "dataset_edited",
        },
        {
          name: "Cloud data table name",
          edited: "name-edited",
        },
        {
          name: "Project ID",
          edited: "project-id-edited",
        },
      ],
    },
  ];

  resourceTypes.forEach((resource) => {
    it(`edits ${resource.name}`, () => {
      cy.findAllByRole("row").filter(`:contains("${resource.name}")`).click();
      cy.get("button[aria-label=editResourceButton]").click();

      cy.findByRole("button", { name: "Update" }).should("be.disabled");

      resource.fields.forEach((field) => {
        const textbox = cy.findByRole("textbox", { name: field.name });

        if (field.disabled) {
          textbox.should("be.disabled");
        } else {
          textbox.clear().type(field.edited || "");
        }
      });

      cy.findByRole("button", { name: "Update" }).click();

      cy.findAllByRole("row")
        .contains(`${resource.name}-edited`)
        .should("exist");
    });
  });
});

function createWorkspaceWithResources() {
  return cy
    .apis()
    .then(({ controlledGcpResourceApi, referencedGcpResourceApi }) =>
      cy.createWorkspace().then((workspace) =>
        Promise.all([
          controlledGcpResourceApi
            .generateGcpGcsBucketCloudName({
              workspaceId: workspace.id,
              generateGcpGcsBucketCloudNameRequestBody: {
                gcsBucketName: workspace.displayName || "",
              },
            })
            .then((name) =>
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
          referencedGcpResourceApi.createGcsObjectReference({
            workspaceId: workspace.id,
            createGcpGcsObjectReferenceRequestBody: {
              metadata: {
                name: "reference-object",
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
              file: {
                fileName: "object-name",
                bucketName: "bucket-name",
              },
            },
          }),
          controlledGcpResourceApi.createBigQueryDataset({
            workspaceId: workspace.id,
            createControlledGcpBigQueryDatasetRequestBody: {
              common: {
                name: "controlled-dataset",
                cloningInstructions: CloningInstructionsEnum.Nothing,
                accessScope: AccessScope.SharedAccess,
                managedBy: ManagedBy.User,
              },
              dataset: {
                datasetId: "controlled_dataset",
              },
            },
          }),
          referencedGcpResourceApi.createBigQueryDatasetReference({
            workspaceId: workspace.id,
            createGcpBigQueryDatasetReferenceRequestBody: {
              metadata: {
                name: "reference-dataset",
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
              dataset: {
                projectId: "reference-dataset-proj",
                datasetId: "reference_dataset",
              },
            },
          }),
          referencedGcpResourceApi.createBigQueryDataTableReference({
            workspaceId: workspace.id,
            createGcpBigQueryDataTableReferenceRequestBody: {
              metadata: {
                name: "reference-datatable",
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
              dataTable: {
                projectId: "projectid",
                dataTableId: "datatableid",
                datasetId: "datasetid",
              },
            },
          }),
        ]).then(() => workspace)
      )
    );
}
