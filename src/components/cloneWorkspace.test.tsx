import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { createMemoryHistory } from "history";
import { SnackbarProvider } from "notistack";
import { Router } from "react-router-dom";
import {
  AccessScope,
  CloningInstructionsEnum,
  ControlledResourceCommonFields,
  GcpAiNotebookInstanceCreationParameters,
  JobControl,
  ManagedBy,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { CloneWorkspaceProps, useCloneWorkspace } from "./cloneWorkspace";

const TestCloneWorkspaceButton = (props: CloneWorkspaceProps) => {
  const { cloneWorkspace, show } = useCloneWorkspace(props);
  return (
    <div>
      <Button onClick={show} />
      {cloneWorkspace}
    </div>
  );
};

const nextWhenReady = async () => {
  const next = screen.getByRole("button", { name: "Next" });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
};

describe("clone workspace", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { workspaceApi } = apis;
    const workspace = await createTestWorkspace(apis, {
      id: "source-id",
      displayName: "source name",
      description: "source description",
    });

    const history = createMemoryHistory();
    render(
      <SnackbarProvider>
        <Router history={history}>
          <FakeApiProvider apis={apis}>
            <TestCloneWorkspaceButton workspace={workspace} resources={[]} />
          </FakeApiProvider>
        </Router>
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "Duplicate a workspace" });

    const displayName = screen.getByRole("textbox", { name: "Name" });
    expect(displayName).toHaveValue("source name (Copy)");
    fireEvent.change(displayName, { target: { value: "test name" } });

    await nextWhenReady();
    await nextWhenReady(); // Skip the resources screen.

    const description = screen.getByRole("textbox", { name: "Description" });
    expect(description).toHaveValue("source description");
    fireEvent.change(description, { target: { value: "test description" } });

    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Duplicate a workspace" })
    );
    expect(history.location.pathname).toMatch(/\/workspaces\/(.+)/);

    expect((await workspaceApi.listWorkspaces()).workspaces).toEqual([
      expect.objectContaining({
        id: "source-id",
        displayName: "source name",
        description: "source description",
      }),
      expect.objectContaining({
        id: expect.any(String),
        displayName: "test name",
        description: "test description",
        spendProfile: "wm-default-spend-profile",
        gcpContext: { projectId: expect.any(String) },
      }),
    ]);
  });
  it("displays none: if git repos empty and resources empty", async () => {
    const apis = apiFakes();
    const workspace = await createTestWorkspace(apis, {
      id: "source-id",
      displayName: "source name",
      description: "source description",
    });

    const history = createMemoryHistory();
    render(
      <SnackbarProvider>
        <Router history={history}>
          <FakeApiProvider apis={apis}>
            <TestCloneWorkspaceButton workspace={workspace} resources={[]} />
          </FakeApiProvider>
        </Router>
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "Duplicate a workspace" });

    const displayName = screen.getByRole("textbox", { name: "Name" });
    expect(displayName).toHaveValue("source name (Copy)");
    fireEvent.change(displayName, { target: { value: "test name" } });

    await nextWhenReady();

    await screen.findByText(
      "The workspace you are duplicating does not contain any resources."
    );
  });

  it("displays both: if git repos non-empty and resources non-empty", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi, referencedGcpResourceApi, resourceApi } =
      apis;
    const workspace = await createTestWorkspace(apis, {
      id: "source-id",
      displayName: "source name",
    });

    const includedResources = [
      await controlledGcpResourceApi
        .createBucket({
          workspaceId: "source-id",
          createControlledGcpGcsBucketRequestBody: {
            common: {
              name: "cloned-controlled",
              cloningInstructions: CloningInstructionsEnum.Resource,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            gcsBucket: { name: "test-bucket-name", location: "test-location" },
          },
        })
        .then((r) => r.gcpBucket.metadata.name),
      await referencedGcpResourceApi
        .createBucketReference({
          workspaceId: "source-id",
          createGcpGcsBucketReferenceRequestBody: {
            metadata: {
              name: "cloned-reference",
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            bucket: { bucketName: "test-bucket-name" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const excludedResources = [
      await controlledGcpResourceApi
        .createBucket({
          workspaceId: "source-id",
          createControlledGcpGcsBucketRequestBody: {
            common: {
              name: "not-cloned-controlled",
              cloningInstructions: CloningInstructionsEnum.Nothing,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            gcsBucket: {
              name: "test-bucket-name",
              location: "test-location",
            },
          },
        })
        .then((r) => r.gcpBucket.metadata.name),
      await referencedGcpResourceApi
        .createBucketReference({
          workspaceId: "source-id",
          createGcpGcsBucketReferenceRequestBody: {
            metadata: {
              name: "not-cloned-reference",
              cloningInstructions: CloningInstructionsEnum.Nothing,
            },
            bucket: { bucketName: "test-bucket-name" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const includedGitRepos = [
      await referencedGcpResourceApi
        .createGitRepoReference({
          workspaceId: "source-id",
          createGitRepoReferenceRequestBody: {
            metadata: {
              name: "not-shown-git-repo",
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            gitrepo: { gitRepoUrl: "git-url" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const hidden = [
      await controlledGcpResourceApi
        .createAiNotebookInstance({
          workspaceId: "source-id",
          createControlledGcpAiNotebookInstanceRequestBody: {
            common: {
              name: "not-shown-notebook-instance",
              cloningInstructions: CloningInstructionsEnum.Resource,
            } as ControlledResourceCommonFields,
            jobControl: {} as JobControl,
            aiNotebookInstance: {} as GcpAiNotebookInstanceCreationParameters,
          },
        })
        .then((r) => r.aiNotebookInstance?.metadata.name),
    ];

    const { resources: resources } = await resourceApi.enumerateResources({
      workspaceId: "source-id",
    });

    const history = createMemoryHistory();
    render(
      <SnackbarProvider>
        <Router history={history}>
          <FakeApiProvider apis={apis}>
            <TestCloneWorkspaceButton
              workspace={workspace}
              resources={resources}
            />
          </FakeApiProvider>
        </Router>
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "Duplicate a workspace" });

    const displayName = screen.getByRole("textbox", { name: "Name" });
    expect(displayName).toHaveValue("source name (Copy)");
    fireEvent.change(displayName, { target: { value: "test name" } });

    await nextWhenReady();

    const resourceTable = screen.getByRole("table", { name: "resource-table" });
    const gitRepoTable = screen.getByRole("table", { name: "git-repo-table" });

    const resourceRows = within(resourceTable).getAllByRole("row");
    const repoRows = within(gitRepoTable).getAllByRole("row");

    const getRow = (rows: HTMLElement[], name: string) => {
      const row = rows.find((row) => within(row).queryByText(name));
      if (!row) throw new Error(`resource ${name} not found`);
      return row;
    };

    for (const r of includedResources) {
      const res = getRow(resourceRows, r || "");
      await within(res).findByText("Included");
    }
    for (const r of excludedResources) {
      const res = getRow(resourceRows, r || "");
      await within(res).findByText("Excluded");
    }
    for (const r of includedGitRepos) {
      const res = getRow(repoRows, r || "");
      await within(res).findByText("Included");
    }
    for (const r of hidden) {
      expect(screen.queryByText(r || "")).not.toBeInTheDocument();
    }
    screen.getByText(
      /2 resources \(1 controlled\, 1 referenced\) will be included/
    );
  });
  it("displays one : if git repos empty, but resources is non-empty", async () => {
    const apis = apiFakes();
    const testId = "source-id2";
    const { controlledGcpResourceApi, referencedGcpResourceApi, resourceApi } =
      apis;
    const workspace = await createTestWorkspace(apis, {
      id: testId,
      displayName: "source name",
    });

    const includedResources = [
      await controlledGcpResourceApi
        .createBucket({
          workspaceId: testId,
          createControlledGcpGcsBucketRequestBody: {
            common: {
              name: "cloned-controlled",
              cloningInstructions: CloningInstructionsEnum.Resource,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            gcsBucket: { name: "test-bucket-name", location: "test-location" },
          },
        })
        .then((r) => r.gcpBucket.metadata.name),
      await referencedGcpResourceApi
        .createBucketReference({
          workspaceId: testId,
          createGcpGcsBucketReferenceRequestBody: {
            metadata: {
              name: "cloned-reference",
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            bucket: { bucketName: "test-bucket-name" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const excludedResources = [
      await controlledGcpResourceApi
        .createBucket({
          workspaceId: testId,
          createControlledGcpGcsBucketRequestBody: {
            common: {
              name: "not-cloned-controlled",
              cloningInstructions: CloningInstructionsEnum.Nothing,
              accessScope: AccessScope.SharedAccess,
              managedBy: ManagedBy.User,
            },
            gcsBucket: {
              name: "test-bucket-name",
              location: "test-location",
            },
          },
        })
        .then((r) => r.gcpBucket.metadata.name),
      await referencedGcpResourceApi
        .createBucketReference({
          workspaceId: testId,
          createGcpGcsBucketReferenceRequestBody: {
            metadata: {
              name: "not-cloned-reference",
              cloningInstructions: CloningInstructionsEnum.Nothing,
            },
            bucket: { bucketName: "test-bucket-name" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const hidden = [
      await controlledGcpResourceApi
        .createAiNotebookInstance({
          workspaceId: testId,
          createControlledGcpAiNotebookInstanceRequestBody: {
            common: {
              name: "not-shown-notebook-instance",
              cloningInstructions: CloningInstructionsEnum.Resource,
            } as ControlledResourceCommonFields,
            jobControl: {} as JobControl,
            aiNotebookInstance: {} as GcpAiNotebookInstanceCreationParameters,
          },
        })
        .then((r) => r.aiNotebookInstance?.metadata.name),
    ];

    const { resources: resources } = await resourceApi.enumerateResources({
      workspaceId: testId,
    });

    const history = createMemoryHistory();
    render(
      <SnackbarProvider>
        <Router history={history}>
          <FakeApiProvider apis={apis}>
            <TestCloneWorkspaceButton
              workspace={workspace}
              resources={resources}
            />
          </FakeApiProvider>
        </Router>
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "Duplicate a workspace" });

    const displayName = screen.getByRole("textbox", { name: "Name" });
    expect(displayName).toHaveValue("source name (Copy)");
    fireEvent.change(displayName, { target: { value: "test name" } });

    await nextWhenReady();

    expect(screen.getByRole("table")).toBeInTheDocument();

    const resourceTable = screen.getByRole("table", { name: "resource-table" });
    const resourceRows = within(resourceTable).getAllByRole("row");

    const getRow = (rows: HTMLElement[], name: string) => {
      const row = rows.find((row) => within(row).queryByText(name));
      if (!row) throw new Error(`resource ${name} not found`);
      return row;
    };

    for (const r of includedResources) {
      const res = getRow(resourceRows, r || "");
      await within(res).findByText("Included");
    }
    for (const r of excludedResources) {
      const res = getRow(resourceRows, r || "");
      await within(res).findByText("Excluded");
    }
    for (const r of hidden) {
      expect(screen.queryByText(r || "")).not.toBeInTheDocument();
    }

    screen.getByText(
      "This workspace does not include any git repository references."
    );

    screen.getByText(
      /2 resources \(1 controlled\, 1 referenced\) will be included/
    );
  });

  it("displays one : if resource empty, but git repos is non-empty", async () => {
    const apis = apiFakes();
    const testId = "source-id3";
    const { controlledGcpResourceApi, referencedGcpResourceApi, resourceApi } =
      apis;
    const workspace = await createTestWorkspace(apis, {
      id: testId,
      displayName: "source name",
    });

    const includedGitRepos = [
      await referencedGcpResourceApi
        .createGitRepoReference({
          workspaceId: testId,
          createGitRepoReferenceRequestBody: {
            metadata: {
              name: "not-shown-git-repo",
              cloningInstructions: CloningInstructionsEnum.Reference,
            },
            gitrepo: { gitRepoUrl: "git-url" },
          },
        })
        .then((r) => r.metadata.name),
    ];

    const hidden = [
      await controlledGcpResourceApi
        .createAiNotebookInstance({
          workspaceId: testId,
          createControlledGcpAiNotebookInstanceRequestBody: {
            common: {
              name: "not-shown-notebook-instance",
              cloningInstructions: CloningInstructionsEnum.Resource,
            } as ControlledResourceCommonFields,
            jobControl: {} as JobControl,
            aiNotebookInstance: {} as GcpAiNotebookInstanceCreationParameters,
          },
        })
        .then((r) => r.aiNotebookInstance?.metadata.name),
    ];

    const { resources: resources } = await resourceApi.enumerateResources({
      workspaceId: testId,
    });

    const history = createMemoryHistory();
    render(
      <SnackbarProvider>
        <Router history={history}>
          <FakeApiProvider apis={apis}>
            <TestCloneWorkspaceButton
              workspace={workspace}
              resources={resources}
            />
          </FakeApiProvider>
        </Router>
      </SnackbarProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "Duplicate a workspace" });

    const displayName = screen.getByRole("textbox", { name: "Name" });
    expect(displayName).toHaveValue("source name (Copy)");
    fireEvent.change(displayName, { target: { value: "test name" } });

    await nextWhenReady();

    const getRow = (rows: HTMLElement[], name: string) => {
      const row = rows.find((row) => within(row).queryByText(name));
      if (!row) throw new Error(`resource ${name} not found`);
      return row;
    };

    const gitRepoTable = screen.getByRole("table", { name: "git-repo-table" });

    const repoRows = within(gitRepoTable).getAllByRole("row");

    for (const r of includedGitRepos) {
      const res = getRow(repoRows, r || "");
      await within(res).findByText("Included");
    }

    for (const r of hidden) {
      expect(screen.queryByText(r || "")).not.toBeInTheDocument();
    }

    screen.getByText(
      "This workspace does not include any workspace resources."
    );

    screen.getByText(
      /0 resources \(0 controlled\, 0 referenced\) will be included/
    );
  });
});
