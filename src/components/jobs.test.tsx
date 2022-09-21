import { Button } from "@mui/material";
import {
  act,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { StatusCodes } from "http-status-codes";
import { SnackbarProvider } from "notistack";
import {
  JobReportStatusEnum,
  OperationType,
} from "../generated/workspacemanager";
import { apiFakes } from "../testing/api/fakes";
import { FakeApiProvider } from "../testing/api/provider";
import { FakeJobsApi } from "../testing/api/wsm/jobs";
import { Job, JobsProvider, useJob, useJobs } from "./jobs";

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("job provider", () => {
  const job: Job = {
    entityId: "test-entity-id",
    jobId: "test-job-id",
    action: "test action",
  };

  it("reports success", async () => {
    const apis = apiFakes();
    setJobStatus(apis.jobsApi, job, JobReportStatusEnum.Running);

    render(
      <FakeApiProvider apis={apis}>
        <SnackbarProvider>
          <JobsProvider>
            <TestAddJobButton job={job} />
            <TestShowJobField entityId="test-entity-id" />
          </JobsProvider>
        </SnackbarProvider>
      </FakeApiProvider>
    );
    expect(screen.queryByText("test-job-id")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    screen.getByText("test-job-id");

    act(() => void jest.runOnlyPendingTimers());
    screen.getByText("test-job-id");

    setJobStatus(apis.jobsApi, job, JobReportStatusEnum.Succeeded);
    act(() => void jest.runOnlyPendingTimers());

    await waitForElementToBeRemoved(screen.queryByText("test-job-id"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports failure", async () => {
    const apis = apiFakes();
    setJobStatus(apis.jobsApi, job, JobReportStatusEnum.Running);

    render(
      <FakeApiProvider apis={apis}>
        <SnackbarProvider>
          <JobsProvider>
            <TestAddJobButton job={job} />
            <TestShowJobField entityId="test-entity-id" />
          </JobsProvider>
        </SnackbarProvider>
      </FakeApiProvider>
    );
    expect(screen.queryByText("test-job-id")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    screen.getByText("test-job-id");

    act(() => void jest.runOnlyPendingTimers());
    screen.getByText("test-job-id");

    setJobStatus(apis.jobsApi, job, JobReportStatusEnum.Failed);
    act(() => void jest.runOnlyPendingTimers());

    await waitForElementToBeRemoved(screen.queryByText("test-job-id"));
    expect(screen.getByRole("alert")).toHaveTextContent("Error test action");
  });
});

function TestAddJobButton({ job }: { job: Job }) {
  const { addJob } = useJobs();
  return <Button onClick={() => addJob(job)}>add</Button>;
}

function TestShowJobField({ entityId }: { entityId: string }) {
  const jobId = useJob(entityId);
  return jobId ? <div>{jobId}</div> : null;
}

function setJobStatus(
  jobsApi: FakeJobsApi,
  job: Job,
  status: JobReportStatusEnum
) {
  let code: number;
  switch (status) {
    case JobReportStatusEnum.Succeeded:
      code = StatusCodes.OK;
      break;
    case JobReportStatusEnum.Failed:
      code = StatusCodes.INTERNAL_SERVER_ERROR;
      break;
    case JobReportStatusEnum.Running:
      code = StatusCodes.ACCEPTED;
      break;
  }
  jobsApi.setJob({
    workspaceId: "test-workspace-id",
    operationType: OperationType.Create,
    jobReport: {
      id: job.jobId,
      status: status,
      statusCode: code,
      resultURL: "",
    },
  });
}
