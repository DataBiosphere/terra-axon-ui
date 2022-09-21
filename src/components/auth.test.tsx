import { act, renderHook } from "@testing-library/react-hooks";
import { ReactNode } from "react";
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
  useGoogleLogin,
  UseGoogleLoginProps,
} from "react-google-login";
import { TestProfile } from "../testing/profile";
import { AuthProvider, AuthResponse, useAuth } from "./auth";

jest.mock("react-google-login", () => ({
  ...jest.requireActual("react-google-login"),
  useGoogleLogin: jest.fn(),
}));
function mockUseGoogleLogin(loaded: boolean) {
  const mockedUseGoogleLogin = useGoogleLogin as jest.MockedFunction<
    typeof useGoogleLogin
  >;
  mockedUseGoogleLogin.mockImplementation(() => ({
    loaded: loaded,
    signIn: jest.fn(),
  }));
}

const TestBasicProfile = {
  getId: () => TestProfile.id,
  getEmail: () => TestProfile.email,
  getName: () => TestProfile.name,
  getGivenName: () => TestProfile.givenName,
  getFamilyName: () => TestProfile.familyName,
  getImageUrl: () => TestProfile.imageUrl,
};

beforeEach(() => {
  localStorage.clear();
});

function makeAuthResponse(IdToken: string, expiresIn: number): AuthResponse {
  return {
    access_token: "fake access token",
    id_token: IdToken,
    login_hint: "",
    scope: "",
    expires_in: expiresIn,
    expires_at: Date.now() + expiresIn,
    first_issued_at: 0,
  };
}

function setStorage(expired: boolean) {
  const authResponse = makeAuthResponse(
    "fake id token",
    expired ? 30 * 1000 : 90 * 1000
  );
  localStorage.setItem("authResponse", JSON.stringify(authResponse));
  localStorage.setItem("profile", JSON.stringify(TestProfile));
}

const Wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

it("unloaded", async () => {
  mockUseGoogleLogin(false);

  const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: false,
      expired: false,
      profile: undefined,
      error: undefined,
    })
  );
});

it("cached and valid", async () => {
  mockUseGoogleLogin(true);
  setStorage(false);

  const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: false,
      profile: TestProfile,
      error: undefined,
    })
  );
});

it("cached and expired", async () => {
  mockUseGoogleLogin(true);
  setStorage(true);

  const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: true,
      profile: TestProfile,
      error: undefined,
    })
  );
});

it("get auth token after signed in", async () => {
  let onSignedIn:
    | ((response: GoogleLoginResponse | GoogleLoginResponseOffline) => void)
    | undefined;
  const mockedUseGoogleLogin = useGoogleLogin as jest.MockedFunction<
    typeof useGoogleLogin
  >;
  mockedUseGoogleLogin.mockImplementation((props: UseGoogleLoginProps) => {
    onSignedIn = props.onSuccess;
    return { loaded: true, signIn: jest.fn() };
  });

  const { result, rerender } = renderHook(() => useAuth(), {
    wrapper: Wrapper,
  });
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: false,
      profile: undefined,
      error: undefined,
    })
  );

  const resp = {
    getBasicProfile: () => TestBasicProfile,
    getAuthResponse: () => makeAuthResponse("fake id token", 100000),
    reloadAuthResponse: async () => ({} as Promise<AuthResponse>),
  } as GoogleLoginResponse;
  act(() => onSignedIn?.(resp));
  rerender();
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: false,
      profile: expect.objectContaining(TestProfile),
      error: undefined,
    })
  );

  await act(async () =>
    expect(await result.current.getAuthToken()).toStrictEqual("fake id token")
  );
});

it("get auth token when expired", async () => {
  let onSignedIn:
    | ((response: GoogleLoginResponse | GoogleLoginResponseOffline) => void)
    | undefined;
  const mockedUseGoogleLogin = useGoogleLogin as jest.MockedFunction<
    typeof useGoogleLogin
  >;
  mockedUseGoogleLogin.mockImplementation((props: UseGoogleLoginProps) => {
    onSignedIn = props.onSuccess;
    return { loaded: true, signIn: jest.fn() };
  });

  const { result, rerender } = renderHook(() => useAuth(), {
    wrapper: Wrapper,
  });
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: false,
      profile: undefined,
      error: undefined,
    })
  );
  const mockReload = jest.fn(() =>
    Promise.resolve(makeAuthResponse("refreshed id token", 100000))
  );
  const resp = {
    getBasicProfile: () => TestBasicProfile,
    // Set in the past so we refresh on getAuthToken.
    getAuthResponse: () => makeAuthResponse("fake id token", -1),
    reloadAuthResponse: (): Promise<AuthResponse> => mockReload(),
  } as GoogleLoginResponse;
  act(() => onSignedIn?.(resp));
  rerender();
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: true,
      profile: expect.objectContaining(TestProfile),
      error: undefined,
    })
  );

  await act(async () => {
    // Multiple token requests result in a single reload.
    const all = await Promise.all([
      result.current.getAuthToken(),
      result.current.getAuthToken(),
      result.current.getAuthToken(),
    ]);
    expect(all).toEqual([
      "refreshed id token",
      "refreshed id token",
      "refreshed id token",
    ]);
    expect(mockReload.mock.calls.length).toBe(1);
  });

  rerender();
  expect(result.current).toEqual(
    expect.objectContaining({
      loaded: true,
      expired: false,
      profile: expect.objectContaining(TestProfile),
      error: undefined,
    })
  );
});
