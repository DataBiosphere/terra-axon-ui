import { useCallback } from "react";
import { useAuth } from "./auth";

export function useUserIdentity() {
  const { profile } = useAuth();
  return useCallback(
    (email?: string): string | undefined => {
      if (profile?.email === email) {
        return "You";
      }
      return email;
    },
    [profile?.email]
  );
}
