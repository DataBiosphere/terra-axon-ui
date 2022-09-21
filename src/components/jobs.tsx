import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { JobReportStatusEnum } from "../generated/workspacemanager";
import { useApi } from "./apiProvider";
import { errorMessage, useSnackbarErrorHandler } from "./errorhandler";
import nop from "./nop";

export type Job = {
  jobId: string;
  entityId: string;
  action: string;
  onSuccess?: () => void;
};

export type JobsContextType = {
  jobs: Map<string, Job>;
  addJob: (job: Job) => void;
};

const JobsContext = createContext<JobsContextType>({
  jobs: new Map<string, Job>(),
  addJob: nop,
});

export function useJobs(): JobsContextType {
  return useContext(JobsContext);
}

interface JobsProviderProps {
  children: ReactNode;
}

export function JobsProvider({ children }: JobsProviderProps): ReactElement {
  const [jobs, setJobs] = useState(new Map<string, Job>());
  const addJob = useCallback(
    (job: Job) => setJobs((jobs) => new Map(jobs).set(job.entityId, job)),
    []
  );
  const removeJob = useCallback(
    (entityId: string, status?: JobReportStatusEnum) => {
      setJobs((jobs) => {
        if (status === JobReportStatusEnum.Succeeded) {
          jobs.get(entityId)?.onSuccess?.();
        }
        const map = new Map(jobs);
        return map.delete(entityId) ? map : jobs;
      });
    },
    []
  );

  const errorHandler = useSnackbarErrorHandler();
  const { jobsApi } = useApi();
  useEffect(() => {
    const refresh = () =>
      jobs.forEach((job, entityId) => {
        jobsApi
          .retrieveJob({ jobId: job.jobId })
          .then((job) => {
            if (job.status != JobReportStatusEnum.Running) {
              removeJob(entityId, job.status);
            }
          })
          // Silently removes the job on any failure.
          .catch((e) =>
            errorHandler(
              new Error("Error " + job.action + ": " + errorMessage(e))
            )
          )
          .finally(() => removeJob(entityId));
      });
    // Jobs are refreshed every 10 seconds.
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [jobs, jobsApi, removeJob, errorHandler]);

  return (
    <JobsContext.Provider value={{ jobs: jobs, addJob: addJob }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJob(entityId: string): string | undefined {
  const { jobs } = useJobs();
  return jobs.get(entityId)?.jobId;
}
