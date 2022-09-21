import { CloudErrorResponse } from "../../lib/cloud/api";

export function cloudError(code: number, message: string) {
  const resp: CloudErrorResponse = {
    error: {
      code: code,
      message: message,
    },
  };
  return resp;
}
