import {
  AccessPolicyResponseEntryV2,
  AddUserToPolicyV2Request,
  ListResourcePoliciesV2Request,
  RemoveUserFromPolicyV2Request,
  ResourceRolesV2Request,
  ResourcesApi,
} from "../../../generated/sam";
import { TestProfile } from "../../profile";

interface Policy {
  resourceType: string;
  resourceId: string;
  policyName: string;
  email: string;
}

export class FakeResourcesApi extends ResourcesApi {
  private policies: Policy[] = [];

  async addUserToPolicyV2(request: AddUserToPolicyV2Request): Promise<void> {
    await this.removeUserFromPolicyV2(request);
    this.policies.push({
      resourceType: request.resourceTypeName,
      resourceId: request.resourceId,
      policyName: request.policyName,
      email: request.email,
    });
  }

  async removeUserFromPolicyV2(
    request: RemoveUserFromPolicyV2Request
  ): Promise<void> {
    const index = this.policies.findIndex(
      (policy) =>
        policy.resourceType == request.resourceTypeName &&
        policy.resourceId == request.resourceId &&
        policy.policyName == request.policyName &&
        policy.email == request.email
    );
    if (index > -1) {
      this.policies.splice(index, 1);
    }
  }

  async resourceRolesV2(
    request: ResourceRolesV2Request
  ): Promise<Array<string>> {
    return Promise.resolve(
      this.policies
        .filter(
          (policy) =>
            policy.resourceType == request.resourceTypeName &&
            policy.resourceId == request.resourceId &&
            policy.email == TestProfile.email
        )
        .map((policy) => policy.policyName)
    );
  }

  async listResourcePoliciesV2(
    request: ListResourcePoliciesV2Request
  ): Promise<Array<AccessPolicyResponseEntryV2>> {
    return Promise.resolve(
      this.policies
        .filter(
          (policy) =>
            policy.resourceType == request.resourceTypeName &&
            policy.resourceId == request.resourceId
        )
        .reduce((list, policy) => {
          const entry = list.find(
            (entry) => entry.policyName == policy.policyName
          );
          if (entry) {
            entry.policy.memberEmails.push(policy.email);
          } else {
            list.push({
              policyName: policy.policyName,
              policy: {
                actions: [],
                roles: [],
                memberEmails: [policy.email],
              },
              email: "",
            });
          }
          return list;
        }, [] as AccessPolicyResponseEntryV2[])
    );
  }
}
