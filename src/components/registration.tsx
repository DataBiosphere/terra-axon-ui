import { StatusCodes } from "http-status-codes";
import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useAsync } from "react-async";
import useLocalStorageState from "use-local-storage-state";
import { UsersApi } from "../generated/sam";
import { errorIsCode } from "../lib/api/error";
import { useApi } from "./apiProvider";
import { useAuth } from "./auth";
import { usePageErrorHandler } from "./errorhandler";

export enum RegistrationState {
  Checking = "CHECKING_REGISTRATION",
  Unregistered = "UNREGISTERED",
  Registered = "REGISTERED",
}

export const RegistrationContext = createContext<RegistrationState>(
  RegistrationState.Checking
);

export function useRegistration(): RegistrationState {
  return useContext(RegistrationContext);
}

export interface RegistrationProviderProps {
  children: ReactNode;
}

export function RegistrationProvider({
  children,
}: RegistrationProviderProps): ReactElement {
  const { profile, expired } = useAuth();
  const email = profile?.email;

  // Store 'registered' wrapped in a struct as the API doesn't support raw strings.
  const [storage, setStorage] =
    useLocalStorageState<{ email: string }>("registered");
  const [registered, setRegistered] = [
    storage?.email,
    (email?: string) => setStorage(email ? { email: email } : undefined),
  ];

  const [unregistered, setUnregistered] = useState<string>();

  let state: RegistrationState;
  if (email && email === registered) {
    state = RegistrationState.Registered;
  } else if (email && email === unregistered) {
    state = RegistrationState.Unregistered;
  } else {
    state = RegistrationState.Checking;
  }

  const { usersApi } = useApi();
  const promiseFn = useCallback(
    () => checkOrRegisterUser(usersApi),
    [usersApi]
  );
  useAsync({
    promiseFn:
      state !== RegistrationState.Checking || !email || expired
        ? undefined
        : promiseFn,
    onResolve: (result) => {
      if (result) {
        setRegistered(email);
      } else if (result === false) {
        setUnregistered(email);
      }
    },
    onReject: usePageErrorHandler(),
  });

  return (
    <RegistrationContext.Provider value={state}>
      {children}
    </RegistrationContext.Provider>
  );
}

async function checkOrRegisterUser(usersApi: UsersApi) {
  try {
    await usersApi.getUserStatusInfo();
    return true;
  } catch (error: unknown) {
    if (!errorIsCode(error, StatusCodes.NOT_FOUND)) {
      throw error;
    }
    try {
      await usersApi.createUserV2();
    } catch (error: unknown) {
      if (!errorIsCode(error, StatusCodes.BAD_REQUEST)) {
        throw error;
      }
      return false;
    }
    return true;
  }
}
