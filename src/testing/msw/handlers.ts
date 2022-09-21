import { StatusCodes } from "http-status-codes";
import { ResponseComposition, rest, RestContext } from "msw";
import { CloudErrorResponse } from "../../lib/cloud/api";
import { Instance } from "../../lib/cloud/notebooks";
import { FakeCloudNotebooks } from "../cloud/notebooks";

const baseUrl = "https://notebooks.googleapis.com/v1";
const notebooks = new FakeCloudNotebooks();

function invokeApi<T>(
  res: ResponseComposition,
  ctx: RestContext,
  func: () => T
) {
  try {
    return res(ctx.json(func()));
  } catch (e: unknown) {
    const code =
      (e as CloudErrorResponse).error?.code ||
      StatusCodes.INTERNAL_SERVER_ERROR;
    return res(ctx.status(code), ctx.json(e));
  }
}

export const handlers = [
  rest.get<never, { projectId: string; location: string; instanceId: string }>(
    `${baseUrl}/projects/:projectId/locations/:location/instances/:instanceId`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () =>
        notebooks.getInstance(
          req.params.projectId,
          req.params.location,
          req.params.instanceId
        )
      )
  ),

  rest.post<Instance, { projectId: string; location: string }>(
    `${baseUrl}/projects/:projectId/locations/:location`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () =>
        notebooks.createInstance(
          req.params.projectId,
          req.params.location,
          req.url.searchParams.get("instanceId") as string,
          req.body
        )
      )
  ),

  rest.delete<
    never,
    { projectId: string; location: string; instanceId: string }
  >(
    `${baseUrl}/projects/:projectId/locations/:location/instances/:instanceId`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () => {
        notebooks.deleteInstance(
          req.params.projectId,
          req.params.location,
          req.params.instanceId
        );
        return {};
      })
  ),

  rest.patch<
    Instance,
    { projectId: string; location: string; instanceId: string }
  >(
    `${baseUrl}/projects/:projectId/locations/:location/instances/:instanceId`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () =>
        notebooks.updateInstance(
          req.params.projectId,
          req.params.location,
          req.params.instanceId,
          req.body
        )
      )
  ),

  rest.post<never, { projectId: string; location: string; instanceId: string }>(
    `${baseUrl}/projects/:projectId/locations/:location/instances/:instanceId\\:stop`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () =>
        notebooks.stopInstance(
          req.params.projectId,
          req.params.location,
          req.params.instanceId
        )
      )
  ),

  rest.post<never, { projectId: string; location: string; instanceId: string }>(
    `${baseUrl}/projects/:projectId/locations/:location/instances/:instanceId\\:start`,
    (req, res, ctx) =>
      invokeApi(res, ctx, () =>
        notebooks.startInstance(
          req.params.projectId,
          req.params.location,
          req.params.instanceId
        )
      )
  ),
];
