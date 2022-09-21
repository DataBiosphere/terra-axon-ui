import { StatusCodes } from "http-status-codes";
import {
  GetPetServiceAccountTokenRequest,
  GoogleApi,
} from "../../../generated/sam";
import { apiError } from "../error";

export class FakeGoogleApi extends GoogleApi {
  private projectServiceAccounts = new Map<string, string>();

  createPetServiceAccount(projectId: string): void {
    this.projectServiceAccounts.set(projectId, "service-account-" + projectId);
  }

  async getPetServiceAccountToken(
    request: GetPetServiceAccountTokenRequest
  ): Promise<string> {
    const account = this.projectServiceAccounts.get(request.project);
    if (!account) {
      throw apiError(
        StatusCodes.NOT_FOUND,
        `no service account for project ${request.project}`
      );
    }
    return Promise.resolve(account);
  }
}
