export interface CloudErrorResponse {
  error: {
    code: number;
    message: string;
  };
}

export abstract class CloudApiClient {
  constructor(protected getToken: () => Promise<string>) {}

  async get(url: string): Promise<unknown> {
    return this.fetch(url, {
      method: "GET",
    });
  }

  async post(url: string, body: unknown): Promise<unknown> {
    return this.fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async patch(url: string, body: unknown): Promise<unknown> {
    return this.fetch(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete(url: string): Promise<unknown> {
    return this.fetch(url, {
      method: "DELETE",
    });
  }

  private async fetch(url: string, init: RequestInit) {
    const token = await this.getToken();
    init.headers = {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    };
    const res = await fetch(url, init);
    if (!res.ok) {
      const errorRes: CloudErrorResponse = await res.json();
      throw new Error(errorRes.error.message);
    }
    return await res.json();
  }
}
