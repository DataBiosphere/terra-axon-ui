import { StatusCodes } from "http-status-codes";
import {
  GetUserIdsRequest,
  InviteUserRequest,
  UserIdInfo,
  UsersApi,
  UserStatus,
  UserStatusDetails,
  UserStatusInfo,
} from "../../../generated/sam";
import { TestProfile } from "../../profile";
import { apiError } from "../error";

export interface FakeUserInfo {
  id: string;
  registered?: boolean;
}

export class FakeUsersApi extends UsersApi {
  private nextId = 1;
  private users = new Map<string, FakeUserInfo>();

  setUserInfo(user: { id: string; email: string }): void {
    this.users.set(user.email, { ...user });
  }

  setInvited(): void {
    this.setUserInfo({
      id: TestProfile.id,
      email: TestProfile.email,
    });
  }

  async inviteUser(request: InviteUserRequest): Promise<UserStatusDetails> {
    const info = {
      id: "fakeuser-" + this.nextId++,
      email: request.inviteeEmail,
    };
    this.setUserInfo(info);
    return Promise.resolve({ userEmail: info.email, userSubjectId: info.id });
  }

  async createUserV2(): Promise<UserStatus> {
    const info = this.users.get(TestProfile.email);
    if (!info) {
      throw apiError(StatusCodes.BAD_REQUEST, "user is not invited");
    }
    info.registered = true;
    return Promise.resolve({
      userInfo: {
        userSubjectId: info.id,
        userEmail: TestProfile.email,
      },
      enabled: { ldap: true, allUsersGroup: true, google: true },
    });
  }

  async getUserStatusInfo(): Promise<UserStatusInfo> {
    const info = this.users.get(TestProfile.email);
    if (!info?.registered) {
      throw apiError(StatusCodes.NOT_FOUND, "user is not registered");
    }
    return Promise.resolve({
      userSubjectId: TestProfile.id,
      userEmail: TestProfile.email,
      enabled: true,
    });
  }

  async getUserIds(request: GetUserIdsRequest): Promise<UserIdInfo> {
    const info = this.users.get(request.email);
    if (!info) {
      throw apiError(
        StatusCodes.BAD_REQUEST,
        `user ${request.email} is not invited`
      );
    }
    return Promise.resolve({
      userSubjectId: info.id,
      userEmail: request.email,
    });
  }
}
