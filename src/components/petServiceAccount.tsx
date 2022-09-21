import { useCallback } from "react";
import { GoogleApi } from "../generated/sam";
import { useApi } from "./apiProvider";

export async function getPetAccessToken(
  googleApi: GoogleApi,
  project: string
): Promise<string> {
  return googleApi.getPetServiceAccountToken({
    project: project,
    scopes: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/cloud-platform",
    ],
  });
}

export function useGetPetAccessToken(projectID: string): () => Promise<string> {
  const { googleApi } = useApi();
  return useCallback(
    () => getPetAccessToken(googleApi, projectID),
    [googleApi, projectID]
  );
}
