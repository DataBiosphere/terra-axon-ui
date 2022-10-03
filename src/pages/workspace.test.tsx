import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import { ErrorBoundary } from "react-error-boundary";
import { Route } from "react-router";
import { MemoryRouter } from "react-router-dom";
import { useResourceListReload } from "../components/api/resourceList";
import {
  AccessScope,
  CloningInstructionsEnum,
  CloudPlatform,
  IamRole,
  JobControl,
  ManagedBy,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { CloudNotebooksClient } from "../lib/cloud/notebooks";
import { apiFakes } from "../testing/api/fakes";
import {
  createTestDataCollection,
  createTestWorkspace,
} from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestAuth } from "../testing/auth";
import { TestProfile } from "../testing/profile";
import ErrorPage from "./error";
import WorkspacePage from "./workspace";

function MockNewResourceButton({
  workspace,
}: {
  workspace: WorkspaceDescription;
}) {
  const reload = useResourceListReload();
  return <Button onClick={() => reload(workspace.id)}>test-add-button</Button>;
}
jest.mock("../components/newResourceButton", () => {
  return { NewResourceButton: MockNewResourceButton };
});

describe("workspace page", () => {
  it("renders", async () => {
    const apis = apiFakes();
    const workspace = await createTestWorkspace(apis, {
      description: "test description",
    });
    expect(workspace.gcpContext?.projectId).toBeTruthy();

    render(
      <SnackbarProvider>
        <MemoryRouter
          initialEntries={["/workspaces/" + workspace.userFacingId]}
        >
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider apis={apis}>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </SnackbarProvider>
    );

    await screen.findAllByText("test name");
    screen.getByText("test description");
    expect(
      screen.getByRole("link", { name: workspace.gcpContext?.projectId })
    ).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/home/dashboard?project=" +
        workspace.gcpContext?.projectId
    );
    expect(document.title).toMatch(/^test name/);

    const command = `terra workspace set --id=${workspace.userFacingId}`;
    screen.getByText(command);
  });

  it("renders creating", async () => {
    const apis = apiFakes();
    const { workspaceApi } = apis;
    await workspaceApi.createWorkspace({
      createWorkspaceRequestBody: {
        id: "test-id",
        displayName: "test name",
        userFacingId: "test-ufid",
        spendProfile: "test-spend-profile",
      },
    });
    await workspaceApi.createCloudContext(
      {
        workspaceId: "test-id",
        createCloudContextRequest: {
          cloudPlatform: CloudPlatform.Gcp,
          jobControl: { id: "test-job-id" },
        },
      },
      { headers: { FAKE_CREATE_TIME: "-1" } }
    );
    const workspace = await workspaceApi.getWorkspaceById("test-id");

    render(
      <SnackbarProvider>
        <MemoryRouter
          initialEntries={["/workspaces/" + workspace.userFacingId]}
        >
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider apis={apis}>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </SnackbarProvider>
    );

    await screen.findByText("Preparing your new workspace...");
  });

  it("renders added resources", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    render(
      <SnackbarProvider>
        <MemoryRouter initialEntries={["/workspaces/test-ufid"]}>
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider apis={apis}>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </SnackbarProvider>
    );
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    fireEvent.click(screen.getByRole("tab", { name: "Resources" }));

    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    screen.getByText("Every analysis begins with your resources");

    await controlledGcpResourceApi.createBucket({
      workspaceId: workspace.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test-resource-name",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {
          name: "test-bucket-name",
          location: "test-location",
        },
      },
    });

    fireEvent.click(screen.getByText("test-add-button"));

    await screen.findByText("test-resource-name");
    screen.getByLabelText("Cloud Storage bucket");
  });

  // TODO: Currently using findByText
  // Should replace with findByRole once themeing is worked out
  // And SectionHeader uses appropriate variants
  it("renders resource section header", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi, referencedGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const dataCollection = await createTestDataCollection(apis);
    const dataCollection2 = await createTestDataCollection(apis);

    render(
      <SnackbarProvider>
        <MemoryRouter initialEntries={["/workspaces/test-ufid"]}>
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider apis={apis}>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </SnackbarProvider>
    );
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    fireEvent.click(screen.getByRole("tab", { name: "Resources" }));

    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
    // Check ResourceCard subheader
    await screen.findByText("0 resources");
    await controlledGcpResourceApi.createBucket({
      workspaceId: workspace.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test-resource-name",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {
          name: "test-bucket-name",
          location: "test-location",
        },
      },
    });
    fireEvent.click(screen.getByText("test-add-button"));
    await screen.findByText("1 resource");

    await controlledGcpResourceApi.createBucket({
      workspaceId: workspace.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test-resource-name2",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {
          name: "test-bucket-name2",
          location: "test-location",
        },
      },
    });
    fireEvent.click(screen.getByText("test-add-button"));
    await screen.findByText("2 resources");

    const bucketToClone = await controlledGcpResourceApi.createBucket({
      workspaceId: dataCollection.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test-resource-name3",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {
          name: "test-bucket-name3",
          location: "test-location",
        },
      },
    });

    await referencedGcpResourceApi.cloneGcpGcsBucketReference({
      workspaceId: dataCollection.id,
      resourceId: bucketToClone.resourceId,
      cloneReferencedResourceRequestBody: {
        cloningInstructions: CloningInstructionsEnum.Reference,
        destinationWorkspaceId: workspace.id,
      },
    });
    fireEvent.click(screen.getByText("test-add-button"));
    await screen.findByText("test-resource-name3");
    await screen.findByText("3 resources • 1 resource from");
    await screen.findByText("1 data collection");

    const bucketToClone2 = await controlledGcpResourceApi.createBucket({
      workspaceId: dataCollection2.id,
      createControlledGcpGcsBucketRequestBody: {
        common: {
          name: "test-resource-name4",
          cloningInstructions: CloningInstructionsEnum.Nothing,
          accessScope: AccessScope.SharedAccess,
          managedBy: ManagedBy.User,
        },
        gcsBucket: {
          name: "test-bucket-name4",
          location: "test-location",
        },
      },
    });

    await referencedGcpResourceApi.cloneGcpGcsBucketReference({
      workspaceId: dataCollection2.id,
      resourceId: bucketToClone2.resourceId,
      cloneReferencedResourceRequestBody: {
        cloningInstructions: CloningInstructionsEnum.Reference,
        destinationWorkspaceId: workspace.id,
      },
    });
    fireEvent.click(screen.getByText("test-add-button"));
    await screen.findByText("test-resource-name4");
    await screen.findByText("4 resources • 2 resources from");
    await screen.findByText("2 data collections");
  });

  it("renders notebook gcp state", async () => {
    const apis = apiFakes();
    const { controlledGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const projectId = workspace.gcpContext?.projectId || "";
    for (let i = 0; i < 3; i++) {
      await controlledGcpResourceApi.createAiNotebookInstance({
        workspaceId: "test-id",
        createControlledGcpAiNotebookInstanceRequestBody: {
          common: {
            name: `test-resource-name-${i}`,
            cloningInstructions: CloningInstructionsEnum.Nothing,
            accessScope: AccessScope.SharedAccess,
            managedBy: ManagedBy.User,
          },
          aiNotebookInstance: {
            instanceId: `test-instance-name-${i}`,
            location: "test-location",
            machineType: "test-machine-type",
            containerImage: {
              repository: "gcr.io/test-repo/test-image",
              tag: "tag1",
            },
          },
          jobControl: {} as JobControl,
        },
      });
    }
    await new CloudNotebooksClient().deleteInstance(
      projectId,
      "test-location",
      "test-instance-name-1"
    );
    await new CloudNotebooksClient().stopInstance(
      projectId,
      "test-location",
      "test-instance-name-2"
    );

    render(
      <SnackbarProvider>
        <TestAuth>
          <MemoryRouter initialEntries={["/workspaces/test-ufid"]}>
            <Route exact path="/workspaces/:workspaceUserFacingId">
              <FakeApiProvider apis={apis}>
                <WorkspacePage />
              </FakeApiProvider>
            </Route>
          </MemoryRouter>
        </TestAuth>
      </SnackbarProvider>
    );
    await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));

    fireEvent.click(screen.getByRole("tab", { name: "Environments" }));
    screen.getByText("Your notebook instances");

    const cards = screen.getAllByTestId("notebook-card");
    const getCard = (name: string) => {
      const card = cards.find((card) => within(card).queryByText(name));
      if (!card) throw new Error(`resource ${card} not found`);
      return card;
    };
    const res0 = getCard("test-resource-name-0");
    await within(res0).findByText("RUNNING");
    fireEvent.mouseOver(within(res0).getByRole("button", { name: /vmimage/i }));
    expect(await screen.findByText("gcr.io/test-repo/test-image:tag1"));
    expect(within(res0).getByRole("link")).toHaveAttribute(
      "href",
      "https://fakeurl"
    );
    const res1 = getCard("test-resource-name-1");
    await within(res1).findByText("ERROR");
    within(res1).getByLabelText(
      `instance projects/${projectId}/locations/test-location/instances/test-instance-name-1 not found`
    );

    fireEvent.click(
      within(res0).getByRole("button", {
        name: /menu/i,
      })
    );
    fireEvent.click(await screen.findByText("Stop"));
    // TODO (PF-1653): assert the chip display Stopped.
    // Until we have a chip state change, use the progress to know when the
    // API call is done.
    await waitForElementToBeRemoved(() =>
      within(res0).queryByTestId("backdrop-progress")
    );
    const instance0Stopped = await new CloudNotebooksClient().getInstance(
      projectId,
      "test-location",
      "test-instance-name-0"
    );
    expect(instance0Stopped.state == "STOPPED");

    const res2 = getCard("test-resource-name-2");
    await within(res2).findByText("STOPPED");
    fireEvent.click(
      within(res2).getByRole("button", {
        name: /menu/i,
      })
    );
    fireEvent.click(await screen.findByText("Start"));
    // TODO (PF-1653): assert the chip display Active.
    // Until we have a chip state change, use the progress to know when the
    // API call is done.
    await waitForElementToBeRemoved(() =>
      within(res2).queryByTestId("backdrop-progress")
    );
    const instance2Stopped = await new CloudNotebooksClient().getInstance(
      projectId,
      "test-location",
      "test-instance-name-2"
    );
    expect(instance2Stopped.state == "ACTIVE");
  });

  it("renders git repositories", async () => {
    const apis = apiFakes();
    const { referencedGcpResourceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    await referencedGcpResourceApi.createGitRepoReference({
      workspaceId: workspace.id,
      createGitRepoReferenceRequestBody: {
        metadata: {
          name: "test-resource-name",
          description: "test resource description",
          cloningInstructions: CloningInstructionsEnum.Nothing,
        },
        gitrepo: { gitRepoUrl: "test url" },
      },
    });

    render(
      <SnackbarProvider>
        <MemoryRouter initialEntries={["/workspaces/test-ufid"]}>
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider apis={apis}>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </SnackbarProvider>
    );

    await screen.findByText("Git Repositories");
    screen.getByText("test url");
    screen.getByText("test-resource-name");

    const description = "test resource description";
    expect(screen.queryByText(description)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("expand_more"));
    screen.getByText(description);
  });

  it("shows not found", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {
      // Exclude expected console error from test log.
    });

    render(
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <MemoryRouter initialEntries={["/workspaces/test-ufid"]}>
          <Route exact path="/workspaces/:workspaceUserFacingId">
            <FakeApiProvider>
              <WorkspacePage />
            </FakeApiProvider>
          </Route>
        </MemoryRouter>
      </ErrorBoundary>
    );
    await screen.findByText("workspace with ufid test-ufid not found");
  });

  it.each<IamRole>([IamRole.Owner, IamRole.Writer, IamRole.Reader])(
    "renders for role %s",
    async (role: IamRole) => {
      const apis = apiFakes();
      const { workspaceApi } = apis;
      const workspace = await createTestWorkspace(apis);
      await workspaceApi.removeRole({
        workspaceId: workspace.id,
        role: IamRole.Owner,
        memberEmail: TestProfile.email,
      });
      await workspaceApi.grantRole({
        workspaceId: workspace.id,
        role: role,
        grantRoleRequestBody: {
          memberEmail: TestProfile.email,
        },
      });

      render(
        <SnackbarProvider>
          <MemoryRouter
            initialEntries={["/workspaces/" + workspace.userFacingId]}
          >
            <Route exact path="/workspaces/:workspaceUserFacingId">
              <FakeApiProvider apis={apis}>
                <WorkspacePage />
              </FakeApiProvider>
            </Route>
          </MemoryRouter>
        </SnackbarProvider>
      );

      await screen.findAllByText("test name");

      const components = [
        { element: screen.queryByText("Reader"), roles: [IamRole.Reader] },
        { element: screen.queryByText("Writer"), roles: [IamRole.Writer] },
        { element: screen.queryByText("Owner"), roles: [IamRole.Owner] },
        {
          element: screen.queryByText(
            "You have read-only access to this workspace. Duplicate this workspace to make modifications."
          ),
          roles: [IamRole.Reader],
        },
        {
          element: screen.queryByRole("button", { name: "Duplicate" }),
          roles: [IamRole.Reader],
        },
      ];
      components.forEach((component) => {
        if (component.roles.includes(role)) {
          expect(component.element).toBeInTheDocument();
        } else {
          expect(component.element).not.toBeInTheDocument();
        }
      });
    }
  );
});
