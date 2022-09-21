import Data from "./configuration.json";

interface Configuration {
  subtitleBranding?: string;
  supportEmail?: string;
  registrationPage?: string;
  backendUris: { [key: string]: string };
  testing: {
    serviceAccount: string;
    serviceAccountKey: string;
  };
}

export const configuration: Configuration = Data;

export default configuration;
