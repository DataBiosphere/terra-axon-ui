import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SnackbarProvider } from "notistack";
import {
  IamRole,
  RoleBinding,
  WorkspaceApi,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestProfile } from "../testing/profile";
import { ShareWorkspaceButton } from "./shareWorkspace";

// Simplify the role selection by replacing the mui Select.
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  Select: ({ value, onChange }: { value: string; onChange: () => void }) => (
    <select value={value} onChange={onChange}>
      {["OWNER", "WRITER", "READER", "remove"].map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  ),
}));

async function initBindings(
  workspaceApi: WorkspaceApi,
  workspace: WorkspaceDescription,
  bindings: RoleBinding[]
) {
  await Promise.all(
    bindings.map((b: RoleBinding) =>
      b.members?.map((m) =>
        workspaceApi.grantRole({
          workspaceId: workspace.id,
          role: b.role,
          grantRoleRequestBody: { memberEmail: m },
        })
      )
    )
  );
}

describe("share workspace", () => {
  it("modifies roles", async () => {
    const apis = apiFakes();
    const { workspaceApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const bindings: RoleBinding[] = [
      { role: IamRole.Owner, members: ["owner1", "owner2", "owner3"] },
      {
        role: IamRole.Writer,
        members: ["writer1", "writer2", "writer3", "owner3"],
      },
      { role: IamRole.Reader, members: ["reader1", "reader2", "writer3"] },
    ];
    await initBindings(workspaceApi, workspace, bindings);

    render(
      <SnackbarProvider>
        <FakeApiProvider apis={apis}>
          <ShareWorkspaceButton workspace={workspace} iamRole={IamRole.Owner} />
        </FakeApiProvider>
      </SnackbarProvider>
    );

    userEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Share workspace" });

    const rows = screen.getAllByRole("listitem");
    const setRole = (email: string, role: string) => {
      const row = rows.find((item) => within(item).queryByText(email));
      if (!row) throw new Error(`email ${email} not found in list`);
      userEvent.selectOptions(within(row).getByRole("combobox"), role);
    };
    setRole("owner1", "WRITER");
    setRole("writer1", "READER");
    setRole("reader1", "OWNER");
    setRole("owner3", "remove");

    userEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Share workspace" })
    );

    expect(await workspaceApi.getRoles({ workspaceId: workspace.id })).toEqual([
      {
        role: IamRole.Owner,
        members: [TestProfile.email, "owner2", "reader1"],
      },
      {
        role: IamRole.Writer,
        members: ["writer2", "writer3", "owner1"],
      },
      {
        role: IamRole.Reader,
        members: ["reader2", "writer3", "writer1"],
      },
    ]);
  });

  it("is cancelled", async () => {
    const apis = apiFakes();
    const workspace = await createTestWorkspace(apis);

    render(
      <SnackbarProvider>
        <FakeApiProvider apis={apis}>
          <ShareWorkspaceButton workspace={workspace} iamRole={IamRole.Owner} />
        </FakeApiProvider>
      </SnackbarProvider>
    );

    userEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Share workspace" });
    screen.getByRole("button", { name: "Done" });

    userEvent.type(
      screen.getByPlaceholderText("Add people and groups"),
      "newuser{enter}"
    );
    screen.getByRole("button", { name: "Share" });

    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    screen.getByRole("button", { name: "Done" });

    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("heading", { name: "Share workspace" })
    ).not.toBeInTheDocument();
  });

  it("adds users", async () => {
    const apis = apiFakes();
    const { workspaceApi, usersApi } = apis;
    const workspace = await createTestWorkspace(apis);
    const bindings: RoleBinding[] = [
      { role: IamRole.Writer, members: ["writer1"] },
      { role: IamRole.Reader, members: ["reader1"] },
    ];
    await initBindings(workspaceApi, workspace, bindings);

    render(
      <SnackbarProvider>
        <FakeApiProvider apis={apis}>
          <ShareWorkspaceButton workspace={workspace} iamRole={IamRole.Owner} />
        </FakeApiProvider>
      </SnackbarProvider>
    );

    userEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Share workspace" });

    const addUser = async (user: string) => {
      await usersApi.inviteUser({ inviteeEmail: user });
      userEvent.type(
        screen.getByPlaceholderText("Add people and groups"),
        `${user}{enter}`
      );
      const chip = screen
        .getAllByRole("button")
        .find((item) => within(item).queryByText(user));
      expect(chip).toBeDefined();
      // Finds the icon indicating a successful query.
      await within(chip as HTMLElement).findByText("person");
    };
    await addUser("newuser1");
    await addUser("newuser2");

    userEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", { name: "Share workspace" })
    );

    expect(await workspaceApi.getRoles({ workspaceId: workspace.id })).toEqual([
      { role: IamRole.Owner, members: [TestProfile.email] },
      { role: IamRole.Writer, members: ["writer1", "newuser1", "newuser2"] },
      { role: IamRole.Reader, members: ["reader1"] },
    ]);
  });

  it("rejects unknown users", async () => {
    const apis = apiFakes();
    const workspace = await createTestWorkspace(apis);

    render(
      <SnackbarProvider>
        <FakeApiProvider apis={apis}>
          <ShareWorkspaceButton workspace={workspace} iamRole={IamRole.Owner} />
        </FakeApiProvider>
      </SnackbarProvider>
    );

    userEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", { name: "Share workspace" });

    const user = "baduser";
    userEvent.type(
      screen.getByPlaceholderText("Add people and groups"),
      `${user}{enter}`
    );
    const chip = screen
      .getAllByRole("button")
      .find((item) => within(item).queryByText(user));
    expect(chip).toBeDefined();
    await within(chip as HTMLElement).findByText("error");

    userEvent.click(screen.getByRole("button", { name: "Share" }));
    screen.getByRole("heading", { name: "Share workspace" });
    await screen.findByText(`user ${user} is not invited`);
  });

  it("is disabled", async () => {
    const workspace: WorkspaceDescription = {
      id: "test-id",
      userFacingId: "test-ufid",
      highestRole: IamRole.Owner,
    };
    render(
      <SnackbarProvider>
        <ShareWorkspaceButton workspace={workspace} iamRole={IamRole.Writer} />
      </SnackbarProvider>
    );
    screen.getByLabelText("You must be an Owner to share a workspace");
  });
});
