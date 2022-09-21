import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
  useGoogleLogin,
  useGoogleLogout,
} from "react-google-login";
import useLocalStorageState from "use-local-storage-state";
import { getEnvironment } from "../environment";
import nop from "./nop";

const clientId = getEnvironment().REACT_APP_CLIENT_ID;

declare global {
  interface Window {
    Cypress: unknown;
  }
}
const useGoogleLoginOrFake = window.Cypress
  ? () => ({ signIn: nop, loaded: true })
  : useGoogleLogin;

export type BasicProfile = ReturnType<GoogleLoginResponse["getBasicProfile"]>;
export type AuthResponse = ReturnType<GoogleLoginResponse["getAuthResponse"]>;

/** Profile is like BasicProfile except with properties instead of getter methods. */
export type Profile = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly givenName: string;
  readonly familyName: string;
  readonly imageUrl: string;
};

export type AuthContextType = {
  /** Set to true when the 'SignIn with Google' library is initialized. */
  loaded: boolean;
  /** Set to true when the user's access token is expired. */
  expired: boolean;
  /** When logged in, contains the user's Google profile information. */
  profile?: Profile;
  /** When set, contains an error that occured during login. */
  error?: Error;
  /** Invokes the sign in process. */
  signIn: () => void;
  /** Invokes the sign out process. */
  signOut: () => void;
  /** Provides an id token for use in API calls. */
  getAuthToken: () => Promise<string>;
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider(props: AuthProviderProps): ReactElement {
  // authResponse is set both in onSignedIn as well as when the auth is
  // refreshed after expiration. The value is cached in local storage
  // for fast page refresh without waiting for re-auth.
  const [authResponse, setAuthResponse] =
    useLocalStorageState<AuthResponse>("authResponse");

  // profile is set once in onSignedIn. The value is cached in local storage
  // for fast page refresh without waiting for re-auth.
  const [profile, setProfile] = useLocalStorageState<Profile>("profile");

  // reloadAuthFunc is the function returned by the Google login to refresh
  // the token after it is expired.  The value is not stored, so an empty
  // value on initializtion along with expired stored auth means we have to
  // wait for the initial auth to complete.
  const [reloadAuthFunc, setReloadAuthFunc] =
    useState<() => Promise<AuthResponse>>();

  // error can be set on any auth failure, including a failure to initialize,
  // or a failure to refresh authorization.
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!clientId) {
      setError(Error("REACT_APP_CLIENT_ID has not been set."));
    }
  }, []);

  const onSignedIn = useCallback(
    (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
      if ("getAuthResponse" in response) {
        setAuthResponse(response.getAuthResponse(true));
        const basicProfile = response.getBasicProfile();
        setProfile({
          id: basicProfile.getId(),
          email: basicProfile.getEmail(),
          name: basicProfile.getName(),
          givenName: basicProfile.getGivenName(),
          familyName: basicProfile.getFamilyName(),
          imageUrl: basicProfile.getImageUrl(),
        });
        setReloadAuthFunc(() => response.reloadAuthResponse);
      }
    },
    [setAuthResponse, setProfile]
  );
  const onFailure = useCallback(
    (error: unknown) => {
      if (isGoogleAuthError(error)) {
        if (error.error === "popup_closed_by_user") {
          setError(undefined);
        } else {
          setError(
            new Error("Sign in failure: " + (error.details || "Unknown reason"))
          );
        }
      } else {
        setError(new Error("Sign in failure: Unknown reason"));
      }
      setAuthResponse(undefined);
      setProfile(undefined);
    },
    [setAuthResponse, setProfile]
  );
  const { signIn, loaded } = useGoogleLoginOrFake({
    clientId: clientId || "",
    onSuccess: onSignedIn,
    onFailure: onFailure,
    cookiePolicy: "single_host_origin",
    isSignedIn: true,
    prompt: "select_account",
  });

  const onSignedOut = useCallback(() => {
    setAuthResponse(undefined);
    setProfile(undefined);
    setError(undefined);
    setReloadAuthFunc(undefined);
  }, [setAuthResponse, setProfile]);
  const { signOut } = useGoogleLogout({
    clientId: clientId || "",
    onLogoutSuccess: onSignedOut,
    onFailure: onSignedOut,
  });

  const authResponseRef = useRef<AuthResponse>();
  authResponseRef.current = authResponse;
  const reloadAuthFuncRef = useRef<() => Promise<AuthResponse>>();
  reloadAuthFuncRef.current = reloadAuthFunc;

  // A promise for any ongoing refresh, that multiple getAuthToken requests
  // can await on.
  const reloadInProgressRef = useRef<Promise<AuthResponse>>();
  const getAuthToken = useCallback(async () => {
    let authResponse = authResponseRef.current;
    if (hasExpired(authResponse?.expires_at) && reloadAuthFuncRef.current) {
      if (reloadInProgressRef.current) {
        authResponse = await reloadInProgressRef.current;
      } else {
        reloadInProgressRef.current = reloadAuthFuncRef.current();
        try {
          authResponse = await reloadInProgressRef.current;
          setAuthResponse(authResponse);
          authResponseRef.current = authResponse;
        } catch (error: unknown) {
          onFailure(error);
        } finally {
          reloadInProgressRef.current = undefined;
        }
      }
    }
    return authResponse?.id_token || "";
  }, [onFailure, setAuthResponse]);

  const expired = hasExpired(authResponse?.expires_at);

  const auth = useMemo(
    () => ({
      loaded: loaded || !!error,
      expired: expired,
      profile: profile,
      error: error,
      getAuthToken: getAuthToken,
      signIn: signIn,
      signOut: signOut,
    }),
    [loaded, expired, profile, error, getAuthToken, signIn, signOut]
  );
  return (
    <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>
  );
}

function hasExpired(expiresAt: number | undefined): boolean {
  // Consider the token expired within 60 seconds of expiry.
  return expiresAt ? expiresAt - 60 * 1000 - Date.now() <= 0 : false;
}

interface GoogleAuthError {
  error: string;
  details?: string;
}

function isGoogleAuthError(error: unknown): error is GoogleAuthError {
  return !!(error as GoogleAuthError).error;
}
