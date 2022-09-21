import { StatusCodes } from "http-status-codes";
import {
  GenerateSshKeyPairRequest,
  GetSshKeyPairRequest,
  SshKeyPair,
  SshKeyPairApi,
  SshKeyPairType,
} from "../../../generated/ecm";
import { apiError } from "../error";

export class FakeSshKeyPairApi extends SshKeyPairApi {
  private sshKeyPair: SshKeyPair | undefined;
  private generateCount = 0;

  async getSshKeyPair(request: GetSshKeyPairRequest): Promise<SshKeyPair> {
    if (request.type != SshKeyPairType.Github) {
      throw apiError(StatusCodes.BAD_REQUEST, "type must be Github");
    }
    if (!this.sshKeyPair) {
      throw apiError(StatusCodes.NOT_FOUND, "no key pair exists");
    }
    return Promise.resolve(this.sshKeyPair);
  }

  async generateSshKeyPair(
    request: GenerateSshKeyPairRequest
  ): Promise<SshKeyPair> {
    const count = this.generateCount++;
    const content = `public-key-${count}-`.padEnd(595, "ABCD");
    this.sshKeyPair = {
      privateKey: `private-key-${count}`,
      publicKey: `ssh-rsa ${content} ${request.body}`,
      externalUserEmail: request.body,
    };
    return Promise.resolve(this.sshKeyPair);
  }
}
