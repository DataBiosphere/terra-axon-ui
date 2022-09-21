import { useCallback } from "react";
import { useAsync } from "react-async";
import useSWR, { SWRConfiguration, useSWRConfig } from "swr";
import { useApi } from "../../components/apiProvider";
import { SshKeyPair, SshKeyPairType } from "../../generated/ecm";
import { useAuth } from "../auth";

export function useSshKeyPair(config?: SWRConfiguration) {
  const { sshKeyPairApi } = useApi();
  return useSWR<SshKeyPair>(
    key(),
    () => sshKeyPairApi.getSshKeyPair({ type: SshKeyPairType.Github }),
    config
  );
}

export function useGenerateSshKeyPair() {
  const { sshKeyPairApi } = useApi();
  const { mutate } = useSWRConfig();
  const { profile } = useAuth();
  const email = profile?.email || "";
  return useAsync({
    deferFn: useCallback(
      () =>
        sshKeyPairApi.generateSshKeyPair({
          type: SshKeyPairType.Github,
          body: email,
        }),
      [sshKeyPairApi, email]
    ),
    onResolve: (k) => mutate(key(), k),
  });
}

function key() {
  return ["/api/sshKeyPair", SshKeyPairType.Github];
}
