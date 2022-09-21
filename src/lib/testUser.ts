import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { auth, JWT } from "google-auth-library";
import configuration from "../configuration";

export const getTestUserAccessToken = async () => {
  const key = await getServiceAccountKey();
  return await getTestUserTokenFromKey(key);
};

export const getTestUserTokenFromKey = async (key: string) => {
  const authClient = auth.fromJSON(JSON.parse(key)) as JWT;
  // Service must be able to perform domain-wide delegation in the user domain.
  authClient.subject = configuration.testing.serviceAccount;
  authClient.scopes = "profile email";

  const { token } = await authClient.getAccessToken();
  if (!token) throw new Error("No token returned for test user");
  return token;
};

export const getServiceAccountKey = async () => {
  // Uses local default credentials to access the service account key secret.
  const client = new SecretManagerServiceClient();
  const [latest] = await client.accessSecretVersion({
    name: configuration.testing.serviceAccountKey,
  });
  const secret = latest.payload?.data?.toString();
  if (!secret) throw new Error("No secret found for service account key");
  return secret;
};
