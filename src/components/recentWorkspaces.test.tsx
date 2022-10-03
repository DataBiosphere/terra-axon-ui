import { renderHook } from "@testing-library/react-hooks";
import { v4 } from "uuid";
import { apiFakes } from "../testing/api/fakes";
import { createTestWorkspace } from "../testing/api/helper";
import {
  useRecentWorkspaces,
  useRecentWorkspacesRecord,
} from "./recentWorkspaces";

const apis = apiFakes();

beforeEach(() => {
  localStorage.clear();
});

describe("recent workspaces", () => {
  const { workspaceApi } = apis;

  it("saves", async () => {
    const workspaces = await createManyWorkspaces(3);
    workspaces.forEach((ws) =>
      renderHook(() => useRecentWorkspacesRecord(ws.id))
    );

    const queriedWorkspaces = (await workspaceApi.listWorkspaces()).workspaces;
    const { result } = renderHook(() => useRecentWorkspaces(queriedWorkspaces));
    expect(result.current).toEqual(workspaces.reverse());
  });

  it("bubbles up", async () => {
    const workspaces = await createManyWorkspaces(5);
    workspaces.forEach((ws) =>
      renderHook(() => useRecentWorkspacesRecord(ws.id))
    );
    renderHook(() => useRecentWorkspacesRecord(workspaces[0].id));

    const queriedWorkspaces = (await workspaceApi.listWorkspaces()).workspaces;
    const { result } = renderHook(() => useRecentWorkspaces(queriedWorkspaces));
    expect(result.current).toEqual(
      [workspaces[0]].concat(workspaces.slice(1).reverse())
    );
  });

  it("flushes", async () => {
    const workspaces = await createManyWorkspaces(11);
    workspaces.forEach((ws) =>
      renderHook(() => useRecentWorkspacesRecord(ws.id))
    );

    const queriedWorkspaces = (await workspaceApi.listWorkspaces()).workspaces;
    const { result } = renderHook(() => useRecentWorkspaces(queriedWorkspaces));
    expect(result.current).toEqual(workspaces.slice(1).reverse());
  });

  it("handles deletes", async () => {
    const workspaces = await createManyWorkspaces(5);
    workspaces.forEach((ws) =>
      renderHook(() => useRecentWorkspacesRecord(ws.id))
    );

    await workspaceApi.deleteWorkspace({
      workspaceId: workspaces.at(-1)?.id || "",
    });

    const queriedWorkspaces = (await workspaceApi.listWorkspaces()).workspaces;
    const { result } = renderHook(() => useRecentWorkspaces(queriedWorkspaces));
    expect(result.current).toEqual(workspaces.slice(0, -1).reverse());
  });
});

function createManyWorkspaces(n: number) {
  return Promise.all(
    [...Array(n).keys()].map(() => {
      const id = v4();
      const suffix = Math.random().toString().substring(2, 10);
      return createTestWorkspace(apis, {
        id: id,
        userFacingId: "test-" + suffix,
      });
    })
  );
}
