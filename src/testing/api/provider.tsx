import { ReactElement, ReactNode } from "react";
import { SWRConfig } from "swr";
import { ApiContext, ApiContextType } from "../../components/apiProvider";
import { apiFakes } from "./fakes";

export interface FakeApiProps {
  apis?: ApiContextType;
  children: ReactNode;
}

export function FakeApiProvider({
  children,
  apis,
}: FakeApiProps): ReactElement {
  return (
    <ApiContext.Provider value={apis || apiFakes()}>
      {/* Clear the default provider so as to not cache between tests. */}
      <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    </ApiContext.Provider>
  );
}
