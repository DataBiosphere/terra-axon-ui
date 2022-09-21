import { renderHook } from "@testing-library/react-hooks";
import { ReactElement, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ErrorPage from "../pages/error";
import { apiFakes } from "../testing/api/fakes";
import { FakeApiProvider } from "../testing/api/provider";
import { TestAuth, TestAuthProps } from "../testing/auth";
import { TestProfile } from "../testing/profile";
import { ApiContextType } from "./apiProvider";
import {
  RegistrationProvider,
  RegistrationState,
  useRegistration,
} from "./registration";

beforeEach(() => localStorage.clear());

describe("registration", () => {
  it("remembers status", async () => {
    writeRegistered(TestProfile.email);

    const { wrapper } = makeWrapper({});
    const { result } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Registered);
  });

  it("queries status", async () => {
    const apis = apiFakes();
    const { usersApi } = apis;
    usersApi.setInvited();
    await usersApi.createUserV2();

    const { wrapper } = makeWrapper({ apis: apis });
    const { result, waitForNextUpdate } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Checking);
    await waitForNextUpdate();
    expect(result.current).toStrictEqual(RegistrationState.Registered);
  });

  it("is successful after invite", async () => {
    const apis = apiFakes();
    const { usersApi } = apis;
    usersApi.setInvited();

    const { wrapper } = makeWrapper({ apis: apis });
    const { result, waitForNextUpdate } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Checking);
    await waitForNextUpdate();
    expect(result.current).toStrictEqual(RegistrationState.Registered);
  });

  it("fails without invite", async () => {
    const { wrapper } = makeWrapper({});
    const { result, waitForNextUpdate } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Checking);
    await waitForNextUpdate();

    expect(result.current).toStrictEqual(RegistrationState.Unregistered);
  });

  it("isn't performed while auth is expired", async () => {
    const { wrapper } = makeWrapper({ auth: { expired: true } });
    const { result } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Checking);
  });

  it("handles user switch", async () => {
    writeRegistered("some other email");

    const { wrapper } = makeWrapper({});
    const { result, waitForNextUpdate } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Checking);
    await waitForNextUpdate();
    expect(result.current).toStrictEqual(RegistrationState.Unregistered);
  });

  it("handles user logout", async () => {
    writeRegistered(TestProfile.email);

    const { wrapper, updateWrapper } = makeWrapper({});
    const { result, rerender } = renderHook(useRegistration, {
      wrapper: wrapper,
    });
    expect(result.current).toStrictEqual(RegistrationState.Registered);
    updateWrapper({ auth: { noProfile: true } });
    rerender();
    expect(result.current).toStrictEqual(RegistrationState.Checking);
  });
});

const writeRegistered = (email: string) =>
  localStorage.setItem("registered", JSON.stringify({ email: email }));

interface WrapperProps {
  apis?: ApiContextType;
  auth?: Omit<TestAuthProps, "children">;
}

const makeWrapper = (props: WrapperProps) => {
  const setProps = (newProps: WrapperProps) => {
    props = newProps;
  };
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <TestAuth {...props.auth}>
      <FakeApiProvider apis={props.apis}>
        <RegistrationProvider>
          <ErrorBoundary FallbackComponent={ErrorPage}>
            {children}
          </ErrorBoundary>
        </RegistrationProvider>
      </FakeApiProvider>
    </TestAuth>
  );
  return { wrapper: wrapper, updateWrapper: setProps };
};
