import { ReactElement, ReactNode } from "react";
import {
  RegistrationContext,
  RegistrationState,
} from "../components/registration";

export function TestRegistration({
  registration = RegistrationState.Registered,
  children,
}: {
  registration?: RegistrationState;
  children: ReactNode;
}): ReactElement {
  return (
    <RegistrationContext.Provider value={registration}>
      {children}
    </RegistrationContext.Provider>
  );
}
