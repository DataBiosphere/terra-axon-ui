import "@testing-library/cypress/add-commands";
import { v4 as uuidv4 } from "uuid";
import {
  CloningInstructionsEnum,
  WorkspaceStageModel,
} from "../../src/generated/workspacemanager";

beforeEach(() => cy.login());

const testBucketName = "test-bucket-name";
const testObjectName = "test-object-name";
const testDatasetName = "test-dataset-name";
const testDataTableName = "test-data-table-name";
const testGitRepoName = "test-git-repo-name";

const resourceNames = [
  testBucketName,
  testObjectName,
  testDatasetName,
  testDataTableName,
];

describe("add from data collection", () => {
  it("succeeds", () => {
    createDataCollection().then((dataCollection) => {
      cy.createWorkspace().then((workspace) => {
        cy.visit("/workspaces/" + workspace.userFacingId);

        cy.findByRole("tab", { name: "Resources" }).click();
        cy.findByText(
          "Add some resources to unlock the full power of your workspace"
        ).should("exist");

        cy.findByRole("button", { name: "Add" }).click();
        cy.findByRole("menuitem", { name: "Data from the catalog" }).click();

        cy.findByText(dataCollection.displayName || "").click();
        cy.findByRole("button", { name: "Next" }).click();

        cy.findByText(dataCollection.displayName || "").should("exist");
        cy.findByText("Granted").should("exist");
        [...resourceNames, testGitRepoName].forEach((name) =>
          cy
            .findAllByRole("row")
            .filter(`:contains("${name}")`)
            .within(() => cy.findByRole("checkbox").click())
        );

        cy.findByRole("button", { name: "Next" }).click();
        [...resourceNames, testGitRepoName].forEach((name) =>
          cy.findAllByRole("row").filter(`:contains("${name}")`).should("exist")
        );

        cy.findByText("Add to an existing folder").click();
        cy.findByRole("button", { name: "Add to your workspace" }).click();
        cy.findByRole("button", { name: "Add to your workspace" }).should(
          "not.exist"
        );

        cy.findByTestId("resources-table").within(() =>
          resourceNames.forEach((name) => cy.findByText(name).should("exist"))
        );

        cy.findByRole("tab", { name: "Environments" }).click();
        cy.findByText(testGitRepoName);
      });
    });
  });

  it("displays failure", () => {
    createDataCollection().then((dataCollection) =>
      cy.createWorkspace().then((workspace) =>
        createFolder(workspace.id, "existing name").then(() => {
          cy.visit("/workspaces/" + workspace.userFacingId);

          cy.findByRole("tab", { name: "Resources" }).click();
          cy.findByRole("button", { name: "Add" }).click();
          cy.findByRole("menuitem", { name: "Data from the catalog" }).click();
          cy.findByText(dataCollection.displayName || "").click();
          cy.findByRole("button", { name: "Next" }).click();
          cy.findAllByRole("row")
            .filter(`:contains("${testBucketName}")`)
            .within(() => cy.findByRole("checkbox").click());
          cy.findByRole("button", { name: "Next" }).click();
          cy.findByText("Create a new folder").click();
          cy.findByRole("textbox", { name: "Folder name" })
            .clear()
            .type("existing name");
          cy.findByRole("button", { name: "Add to your workspace" }).click();
          cy.findByRole("alert").contains("already exists");
        })
      )
    );
  });
});

function createFolder(workspaceId: string, displayName: string) {
  return cy.apis().then(({ folderApi }) =>
    folderApi.createFolder({
      workspaceId: workspaceId,
      createFolderRequestBody: { displayName: displayName },
    })
  );
}

function createDataCollection() {
  return cy.apis().then(({ workspaceApi, referencedGcpResourceApi }) => {
    const id = uuidv4();
    const suffix = Math.random().toString().substring(2, 10);
    return workspaceApi
      .createWorkspace({
        createWorkspaceRequestBody: {
          id: id,
          userFacingId: "test-data-collection-id-" + suffix,
          displayName: "test-data-collection-name-" + suffix,
          stage: WorkspaceStageModel.McWorkspace,
          spendProfile: "wm-default-spend-profile",
          properties: [{ key: "terra-type", value: "data-collection" }],
        },
      })
      .then(() =>
        Promise.all([
          referencedGcpResourceApi.createBucketReference({
            workspaceId: id,
            createGcpGcsBucketReferenceRequestBody: {
              bucket: { bucketName: "test-bucket" },
              metadata: {
                name: testBucketName,
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
          referencedGcpResourceApi.createGcsObjectReference({
            workspaceId: id,
            createGcpGcsObjectReferenceRequestBody: {
              file: { bucketName: "test-bucket", fileName: "test-object" },
              metadata: {
                name: testObjectName,
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
          referencedGcpResourceApi.createBigQueryDatasetReference({
            workspaceId: id,
            createGcpBigQueryDatasetReferenceRequestBody: {
              dataset: {
                datasetId: "test_dataset_id",
                projectId: "test-project",
              },
              metadata: {
                name: testDatasetName,
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
          referencedGcpResourceApi.createBigQueryDataTableReference({
            workspaceId: id,
            createGcpBigQueryDataTableReferenceRequestBody: {
              dataTable: {
                datasetId: "test_dataset_id",
                dataTableId: "test-datatable-id",
                projectId: "test-project",
              },
              metadata: {
                name: testDataTableName,
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
          referencedGcpResourceApi.createGitRepoReference({
            workspaceId: id,
            createGitRepoReferenceRequestBody: {
              gitrepo: { gitRepoUrl: "git@github.com:example/example.git" },
              metadata: {
                name: testGitRepoName,
                cloningInstructions: CloningInstructionsEnum.Reference,
              },
            },
          }),
        ])
      )
      .then(() => workspaceApi.getWorkspace({ workspaceId: id }));
  });
}
