#!/usr/bin/env ts-node

import cors from "cors";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import morgan from "morgan";
import { errorCode } from "../../lib/api/error";
import { CloudErrorResponse } from "../../lib/cloud/api";
import { CloudNotebooksClient } from "../../lib/cloud/notebooks";
import { apiFakes } from "../api/fakes";
import { FakeCloudNotebooks } from "../cloud/notebooks";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const notebooksApi = new FakeCloudNotebooks();
const apis = apiFakes({
  notebooksApi: notebooksApi as unknown as CloudNotebooksClient,
});

async function invokeApi<T>(res: Response, val: Promise<T>) {
  try {
    return res.send(await val);
  } catch (e: unknown) {
    const code = errorCode(e) || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = (e as { message?: string })?.message || JSON.stringify(e);
    res.status(code);
    return res.send({ statusCode: code, message: message });
  }
}

async function invokeCloudApi<T>(res: Response, func: () => T) {
  try {
    return res.send(func());
  } catch (e: unknown) {
    const code =
      (e as CloudErrorResponse).error?.code ||
      StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(code);
    return res.send(e);
  }
}

function apiHeaders(req: Request): RequestInit {
  return { headers: req.headers as Record<string, string> };
}

// Required for start-server-and-test health check.
app.get("/", async (req, res) => res.send("ok"));

app.get("/api/workspaces/v1", async (req, res) =>
  invokeApi(res, apis.workspaceApi.listWorkspaces())
);

app.post("/api/workspaces/v1", (req, res) =>
  invokeApi(
    res,
    apis.workspaceApi.createWorkspace({
      createWorkspaceRequestBody: req.body,
    })
  )
);
app.get("/api/workspaces/v1/:workspaceId", (req, res) =>
  invokeApi(res, apis.workspaceApi.getWorkspace(req.params))
),
  app.get(
    "/api/workspaces/v1/workspaceByUserFacingId/:workspaceUserFacingId",
    async (req, res) =>
      invokeApi(res, apis.workspaceApi.getWorkspaceByUserFacingId(req.params))
  );
app.get("/api/job/v1/jobs/:jobId", async (req, res) =>
  invokeApi(res, apis.jobsApi.retrieveJob(req.params))
);
app.get("/api/workspaces/alpha1/:workspaceId/jobs", async (req, res) =>
  invokeApi(res, apis.alpha1Api.enumerateJobs(req.params))
);
app.get("/api/workspaces/v1/:workspaceId/resources", (req, res) =>
  invokeApi(res, apis.resourceApi.enumerateResources(req.params))
);
app.post("/api/workspaces/v1/:workspaceId/cloudcontexts", (req, res) =>
  invokeApi(
    res,
    apis.workspaceApi.createCloudContext(
      {
        ...req.params,
        createCloudContextRequest: req.body,
      },
      apiHeaders(req)
    )
  )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/controlled/gcp/ai-notebook-instances",
  (req, res) =>
    invokeApi(
      res,
      apis.controlledGcpResourceApi.createAiNotebookInstance({
        ...req.params,
        createControlledGcpAiNotebookInstanceRequestBody: req.body,
      })
    )
);

app.post(
  "/api/workspaces/v1/:workspaceId/resources/controlled/gcp/buckets",
  (req, res) =>
    invokeApi(
      res,
      apis.controlledGcpResourceApi.createBucket({
        ...req.params,
        createControlledGcpGcsBucketRequestBody: req.body,
      })
    )
);
app.patch(
  "/api/workspaces/v1/:workspaceId/resources/controlled/gcp/buckets/:resourceId",
  (req, res) =>
    invokeApi(
      res,
      apis.controlledGcpResourceApi.updateGcsBucket({
        ...req.params,
        updateControlledGcpGcsBucketRequestBody: req.body,
      })
    )
);

app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/buckets",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.createBucketReference({
        ...req.params,
        createGcpGcsBucketReferenceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/buckets/:resourceId",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.updateBucketReferenceResource({
        ...req.params,
        updateGcsBucketReferenceRequestBody: req.body,
      })
    )
);
app.get(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/buckets/:resourceId",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.getBucketReference({
        ...req.params,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/buckets/:resourceId/clone",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.cloneGcpGcsBucketReference({
        ...req.params,
        cloneReferencedResourceRequestBody: req.body,
      })
    )
);

app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bucket/objects",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.createGcsObjectReference({
        ...req.params,
        createGcpGcsObjectReferenceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bucket/objects/:resourceId/clone",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.cloneGcpGcsObjectReference({
        ...req.params,
        cloneReferencedResourceRequestBody: req.body,
      })
    )
);

app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bigquerydatasets",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.createBigQueryDatasetReference({
        ...req.params,
        createGcpBigQueryDatasetReferenceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bigquerydatasets/:resourceId/clone",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.cloneGcpBigQueryDatasetReference({
        ...req.params,
        cloneReferencedResourceRequestBody: req.body,
      })
    )
);

app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bigquerydatatables",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.createBigQueryDataTableReference({
        ...req.params,
        createGcpBigQueryDataTableReferenceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gcp/bigquerydatatables/:resourceId/clone",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.cloneGcpBigQueryDataTableReference({
        ...req.params,
        cloneReferencedResourceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gitrepos",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.createGitRepoReference({
        ...req.params,
        createGitRepoReferenceRequestBody: req.body,
      })
    )
);
app.post(
  "/api/workspaces/v1/:workspaceId/resources/referenced/gitrepos/:resourceId/clone",
  (req, res) =>
    invokeApi(
      res,
      apis.referencedGcpResourceApi.cloneGitRepoReference({
        ...req.params,
        cloneReferencedResourceRequestBody: req.body,
      })
    )
);

app.get("/api/resources/v2/:resourceTypeName/:resourceId/roles", (req, res) =>
  invokeApi(res, apis.resourcesApi.resourceRolesV2(req.params))
);
app.get("/register/user/v2/self/info", (req, res) =>
  invokeApi(res, apis.usersApi.getUserStatusInfo())
);
app.post("/register/user/v2/self", (req, res) =>
  invokeApi(res, apis.usersApi.createUserV2())
);
app.post("/api/users/v1/invite/:inviteeEmail", (req, res) =>
  invokeApi(res, apis.usersApi.inviteUser(req.params))
);
app.post("/api/google/v1/user/petServiceAccount/:project/token", (req, res) =>
  invokeApi(
    res,
    apis.googleApi.getPetServiceAccountToken({ ...req.params, scopes: [] })
  )
);

app.get(
  "/projects/:projectId/locations/:location/instances/:instanceId",
  (req, res) =>
    invokeCloudApi(res, () =>
      notebooksApi.getInstance(
        req.params.projectId,
        req.params.location,
        req.params.instanceId
      )
    )
);

app.post("/projects/:projectId/locations/:location", (req, res) =>
  invokeCloudApi(res, () =>
    notebooksApi.createInstance(
      req.params.projectId,
      req.params.location,
      req.query.instanceId as string,
      req.body
    )
  )
);

app.delete(
  "/projects/:projectId/locations/:location/instances/:instanceId",
  (req, res) =>
    invokeCloudApi(res, () =>
      notebooksApi.deleteInstance(
        req.params.projectId,
        req.params.location,
        req.params.instanceId
      )
    )
);

app.patch(
  "/projects/:projectId/locations/:location/instances/:instanceId",
  (req, res) =>
    invokeCloudApi(res, () =>
      notebooksApi.updateInstance(
        req.params.projectId,
        req.params.location,
        req.params.instanceId,
        req.body
      )
    )
);

app.post(
  "/projects/:projectId/locations/:location/instances/:instanceId/[:]stop",
  (req, res) =>
    invokeCloudApi(res, () =>
      notebooksApi.stopInstance(
        req.params.projectId,
        req.params.location,
        req.params.instanceId
      )
    )
);

app.post(
  "/projects/:projectId/locations/:location/instances/:instanceId/[:]start",
  (req, res) =>
    invokeCloudApi(res, () =>
      notebooksApi.startInstance(
        req.params.projectId,
        req.params.location,
        req.params.instanceId
      )
    )
);

app.listen(3002);
