import { StatusCodes } from "http-status-codes";
import { Instance, Operation } from "../../lib/cloud/notebooks";
import { cloudError } from "./api";

export class FakeCloudNotebooks {
  private instances = [] as Instance[];

  getInstance(projectId: string, location: string, instanceId: string) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    const instance = this.instances.find((inst) => inst.name == name);
    if (!instance) {
      throw cloudError(StatusCodes.FORBIDDEN, `instance ${name} not found`);
    }
    return instance;
  }

  createInstance(
    projectId: string,
    location: string,
    instanceId: string,
    update: Instance
  ) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    if (this.instances.find((inst) => inst.name == name)) {
      throw cloudError(StatusCodes.CONFLICT, `instance ${name} already exists`);
    }
    const instance = {
      name: name,
      state: "ACTIVE",
      proxyUri: "fakeurl",
      containerImage: update.containerImage,
      metadata: update.metadata,
    };
    this.instances.push(instance);
    return instance;
  }

  deleteInstance(projectId: string, location: string, instanceId: string) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    const index = this.instances.findIndex((inst) => inst.name == name);
    if (index < 0) {
      throw cloudError(StatusCodes.FORBIDDEN, `instance ${name} not found`);
    }
    this.instances.splice(index, 1);
  }

  updateInstance(
    projectId: string,
    location: string,
    instanceId: string,
    instance: Instance
  ) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    const index = this.instances.findIndex((inst) => inst.name == name);
    if (index < 0) {
      throw cloudError(StatusCodes.FORBIDDEN, `instance ${name} not found`);
    }
    this.instances[index] = instance;
    return instance;
  }

  stopInstance(projectId: string, location: string, instanceId: string) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    const instance = this.instances.find((inst) => inst.name == name);
    if (!instance) {
      throw cloudError(StatusCodes.FORBIDDEN, `instance ${name} not found`);
    }
    instance.state = "STOPPED";
    const operation: Operation = {
      name: "stop_operation_id",
      done: true,
    };
    return operation;
  }

  startInstance(projectId: string, location: string, instanceId: string) {
    const name = `projects/${projectId}/locations/${location}/instances/${instanceId}`;
    const instance = this.instances.find((inst) => inst.name == name);
    if (!instance) {
      throw cloudError(StatusCodes.FORBIDDEN, `instance ${name} not found`);
    }
    instance.state = "ACTIVE";
    const operation: Operation = {
      name: "start_operation_id",
      done: true,
    };
    return operation;
  }
}
