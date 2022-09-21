import { Button } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import {
  IamRole,
  ResourceDescription,
  ResourceType,
  StewardshipType,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import { FakeApiProvider } from "../testing/api/provider";
import { TestResourceList } from "../testing/testResourceList";
import {
  CreateGitRepoReferenceProps,
  useCreateGitRepoReference,
} from "./createGitRepoReference";

const TestCreateGitRepoReferenceButton = (
  props: CreateGitRepoReferenceProps
) => {
  const { createGitRepoReference, show } = useCreateGitRepoReference(props);
  return (
    <div>
      <Button onClick={show} />
      {createGitRepoReference}
    </div>
  );
};

describe("create git repo reference", () => {
  it("is successful", async () => {
    const apis = apiFakes();
    const { resourceApi } = apis;
    const workspace = await createTestWorkspace(apis);

    const onResourcesUpdate = jest.fn();
    render(
      <FakeApiProvider apis={apis}>
        <TestResourceList workspaceId="test-id" onUpdate={onResourcesUpdate} />
        <TestCreateGitRepoReferenceButton workspace={workspace} />
      </FakeApiProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await screen.findByRole("heading", {
      name: "Add a Git repository",
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "test-name" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "test description" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Repository URL" }), {
      target: { value: "test url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("heading", {
        name: "Add a Git repository",
      })
    );

    const expected: ResourceDescription = {
      metadata: expect.objectContaining({
        resourceId: expect.any(String),
        workspaceId: workspace.id,
        name: "test-name",
        description: "test description",
        resourceType: ResourceType.GitRepo,
        stewardshipType: StewardshipType.Referenced,
      }),
      resourceAttributes: {
        gitRepo: {
          gitRepoUrl: "test url",
        },
      },
    };
    expect(onResourcesUpdate).toHaveBeenLastCalledWith([expected]);
    expect(
      (await resourceApi.enumerateResources({ workspaceId: "test-id" }))
        .resources
    ).toEqual([expected]);
  });

  it.each<[string, string, string]>([
    ["Name", "", "Provide a name"],
    ["Repository URL", "", "Provide a repository URL"],
  ])(
    "has invalid field %s value %s",
    async (field: string, value: string, expected: string) => {
      const workspace = {
        id: "test-id",
        userFacingId: "test-ufid",
        highestRole: IamRole.Owner,
      };
      render(<TestCreateGitRepoReferenceButton workspace={workspace} />);

      fireEvent.click(screen.getByRole("button"));
      await screen.findByRole("heading", {
        name: "Add a Git repository",
      });

      const textbox = screen.getByRole("textbox", { name: field });
      fireEvent.change(textbox, { target: { value: value } });
      fireEvent.focusOut(textbox);
      screen.getByText(expected);
    }
  );
});
