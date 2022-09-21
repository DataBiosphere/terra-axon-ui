import { ErrorReport } from "../../generated/workspacemanager";

/** This function produces objects that can be thrown from fakes that match
 * what the OpenAPI generated code produces. */
export function apiError(code: number, message: string): Error {
  const body: ErrorReport = {
    statusCode: code,
    message: message,
    causes: [],
  };

  const notImplemented = () => {
    throw new Error("Function not implemented.");
  };

  const response = {
    ok: false,
    redirected: false,
    status: code,
    statusText: message,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    clone: notImplemented,
    arrayBuffer: notImplemented,
    blob: notImplemented,
    formData: notImplemented,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };

  // On error, the openapi client throws the whole response object, so we
  // do the same in the fakes.
  return response as unknown as Error;
}
