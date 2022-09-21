// Items here should be added to environment.js.template as well.
type Environment = {
  REACT_APP_CLIENT_ID: string;
  REACT_APP_API_ENVIRONMENT: string;
  REACT_APP_CLOUD_ENVIRONMENT: string;
};

declare global {
  interface Window {
    environment: Environment;
  }
}

export function getEnvironment(): Environment {
  if (typeof window !== "undefined" && window?.environment) {
    return window.environment;
  }
  return process.env as unknown as Environment;
}
