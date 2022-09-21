/*
 * A basic REST implementation of a Google Cloud Notebooks API client.
 *
 * The official client is deprecated but the NodeJS client doesn't allow us to authenticate
 * in the browser.  Ideally we should switch this out with the NodeJS client once it is
 * functional.
 */

import { getEnvironment } from "../../environment";
import { CloudApiClient } from "./api";

const defaultBaseUrl = "https://notebooks.googleapis.com/v1";

export interface Instance {
  name: string;
  state: string;
  proxyUri: string;
  containerImage?: ContainerImage;
  metadata?: Metadata;
}

export interface ContainerImage {
  repository: string;
  tag?: string;
}

export interface Metadata {
  [key: string]: string;
}

export interface Operation {
  name: string;
  done: boolean;
}

export class CloudNotebooksClient extends CloudApiClient {
  baseUrl: string;

  constructor(getToken: () => Promise<string> = () => Promise.resolve("")) {
    super(getToken);
    this.baseUrl =
      getEnvironment().REACT_APP_CLOUD_ENVIRONMENT === "fake"
        ? "http://localhost:3002"
        : defaultBaseUrl;
  }

  async createInstance(
    projectId: string,
    location: string,
    instanceId: string,
    instance: Instance
  ): Promise<void> {
    await this.post(
      `${this.baseUrl}/projects/${projectId}/locations/${location}?instanceId=${instanceId}`,
      instance
    );
  }

  async getInstance(
    projectId: string,
    location: string,
    instanceId: string
  ): Promise<Instance> {
    return this.get(
      `${this.baseUrl}/projects/${projectId}/locations/${location}/instances/${instanceId}`
    ) as Promise<Instance>;
  }

  async deleteInstance(
    projectId: string,
    location: string,
    instanceId: string
  ): Promise<void> {
    return this.delete(
      `${this.baseUrl}/projects/${projectId}/locations/${location}/instances/${instanceId}`
    ) as Promise<void>;
  }

  async stopInstance(
    projectId: string,
    location: string,
    instanceId: string
  ): Promise<Operation> {
    return this.post(
      `${this.baseUrl}/projects/${projectId}/locations/${location}/instances/${instanceId}:stop`,
      {}
    ) as Promise<Operation>;
  }

  async updateInstance(
    projectId: string,
    location: string,
    instanceId: string,
    instance: Instance
  ): Promise<Instance> {
    return this.patch(
      `${this.baseUrl}/projects/${projectId}/locations/${location}/instances/${instanceId}`,
      instance
    ) as Promise<Instance>;
  }

  async startInstance(
    projectId: string,
    location: string,
    instanceId: string
  ): Promise<Operation> {
    return this.post(
      `${this.baseUrl}/projects/${projectId}/locations/${location}/instances/${instanceId}:start`,
      {}
    ) as Promise<Operation>;
  }
}
