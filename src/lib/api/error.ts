import { getReasonPhrase } from "http-status-codes";
import {
  ErrorReportFromJSON,
  JSONApiResponse,
} from "../../generated/workspacemanager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addErrorTranslator(apis: any[]) {
  Object.values(apis).forEach((obj) => {
    // Look for functions in either object prototype or parent prototype.
    const props = [
      ...new Set([
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(obj)),
        ...Object.getOwnPropertyNames(
          Object.getPrototypeOf(Object.getPrototypeOf(obj))
        ),
      ]),
    ];
    props
      .filter((p) => props.includes(p + "Raw"))
      .forEach((p) => (obj[p] = translateErrors(obj[p].bind(obj))));
  });
  return apis;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type apiFunc<T> = (...args: any[]) => Promise<T>;

function translateErrors<T>(fn: apiFunc<T>): apiFunc<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (e: unknown) {
      throw await responseToError(e as Response);
    }
  };
}

export class ApiError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}

async function responseToError(response: Response): Promise<Error> {
  if (!errorIsResponse(response)) {
    return Promise.resolve(response);
  }
  return new JSONApiResponse(response, (j) => ErrorReportFromJSON(j))
    .value()
    .then((errorReport) => {
      return new ApiError(errorReport.message, errorReport.statusCode);
    })
    .catch(() => {
      return new ApiError(getReasonPhrase(response.status), response.status);
    });
}

function errorIsResponse(error: unknown): error is Response {
  return !!(error as Response).json;
}

export function errorCode(error: unknown) {
  if (error instanceof ApiError) {
    return error.code;
  }
  return undefined;
}

export function errorIsCode(error: unknown, code: number): boolean {
  return error instanceof ApiError && error.code == code;
}
