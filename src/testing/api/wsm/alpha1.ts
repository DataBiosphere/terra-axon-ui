import {
  Alpha1Api,
  EnumerateJobsRequest,
  EnumerateJobsResult,
} from "../../../generated/workspacemanager";
import { FakeJobsApi } from "./jobs";

export class FakeAlpha1Api extends Alpha1Api {
  constructor(private jobsApi: FakeJobsApi) {
    super();
  }

  async enumerateJobs(
    request: EnumerateJobsRequest
  ): Promise<EnumerateJobsResult> {
    return this.jobsApi.enumerateJobs(request);
  }
}
