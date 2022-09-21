import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { SWRConfig } from "swr";
import App from "./app";
import { ApiProvider } from "./components/apiProvider";
import { AuthProvider } from "./components/auth";
import { RegistrationProvider } from "./components/registration";
import reportWebVitals from "./reportWebVitals";

// This should be explicity set to zero at build time to prevent the testing
// files from being pulled into the release build.
if (process.env.REACT_APP_MSW_ON === "1") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { worker } = require("./testing/msw/browser");
  worker.start();
}

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <SWRConfig value={{ refreshInterval: 60000 }}>
        <AuthProvider>
          <ApiProvider>
            <RegistrationProvider>
              <App />
            </RegistrationProvider>
          </ApiProvider>
        </AuthProvider>
      </SWRConfig>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

reportWebVitals(console.log);
