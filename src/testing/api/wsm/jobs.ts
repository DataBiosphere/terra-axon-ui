import { StatusCodes } from "http-status-codes";
import {
  EnumerateJobsRequest,
  EnumerateJobsResult,
  JobReport,
  JobReportStatusEnum,
  JobsApi,
  JobStateFilter,
  OperationType,
  RetrieveJobRequest,
} from "../../../generated/workspacemanager";
import { apiError } from "../error";

export interface JobStore {
  workspaceId: string;
  jobReport: JobReport;
  operationType: OperationType;
}

export class FakeJobsApi extends JobsApi {
  jobs = new Map<string, JobStore>();

  setJob(job: JobStore): void {
    this.jobs.set(job.jobReport.id, job);
  }

  async retrieveJob(request: RetrieveJobRequest): Promise<JobReport> {
    const job = this.jobs.get(request.jobId);
    if (!job || !job.jobReport) {
      throw apiError(StatusCodes.NOT_FOUND, `job ${request.jobId} not found`);
    }
    if (job.jobReport.status === JobReportStatusEnum.Failed) {
      throw apiError(job.jobReport.statusCode, `job ${request.jobId} failed`);
    }
    return Promise.resolve(job.jobReport);
  }

  async enumerateJobs(
    request: EnumerateJobsRequest
  ): Promise<EnumerateJobsResult> {
    let jobs = Array.from(this.jobs.values()).filter(
      (j) => j.workspaceId === request.workspaceId
    );
    if (request.jobState === JobStateFilter.Active) {
      jobs = jobs.filter(
        (j) => j.jobReport.status === JobReportStatusEnum.Running
      );
    }
    return Promise.resolve({
      results: jobs.map((j) => ({
        jobReport: j.jobReport,
        operationType: j.operationType,
      })),
    });
  }
}
