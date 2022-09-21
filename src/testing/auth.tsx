import { ReactElement } from "react";
import { AuthContext, Profile } from "../components/auth";
import nop from "../components/nop";
import { TestProfile } from "./profile";

export interface TestAuthProps {
  loaded?: boolean;
  expired?: boolean;
  profile?: Profile;
  noProfile?: boolean;
  error?: Error;
  signIn?: () => void;
  signOut?: () => void;
  getAuthToken?: () => Promise<string>;

  children: ReactElement;
}

export function TestAuth({
  loaded = true,
  expired = false,
  noProfile,
  profile = noProfile ? undefined : TestProfile,
  error,
  getAuthToken = () => Promise.resolve("fakeauthtoken"),
  signIn = nop,
  signOut = nop,
  children,
}: TestAuthProps): ReactElement {
  return (
    <AuthContext.Provider
      value={{
        loaded: loaded,
        expired: expired,
        profile: profile,
        error: error,
        getAuthToken: getAuthToken,
        signIn: signIn,
        signOut: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
