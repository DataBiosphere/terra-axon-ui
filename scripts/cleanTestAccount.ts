#!/usr/bin/env ts-node

import fetch, { Headers, Request, Response } from "node-fetch";
import { createApis } from "../src/lib/api/api";
import { getTestUserAccessToken } from "../src/lib/testUser";

if (!globalThis.fetch) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const cleanup = async (env: string) => {
  console.log("Deleting test user workspaces on " + env);

  const { workspaceApi } = createApis(getTestUserAccessToken, env);
  const list = await workspaceApi.listWorkspaces({ limit: 1000 });
  for (const ws of list.workspaces) {
    console.log("Deleting", ws.displayName, ws.id);
    await workspaceApi.deleteWorkspace({ workspaceId: ws.id });
  }
  console.log("Finished");
};

const env = process.argv[2];
if (!env) throw new Error("You must specify the environment as an argument");

cleanup(env);
