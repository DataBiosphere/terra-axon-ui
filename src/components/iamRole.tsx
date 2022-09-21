import { ReactElement, ReactNode } from "react";
import { IamRole } from "../generated/workspacemanager";

/** A list of roles we want to present, in ascending order of precidence.
 * Any roles not listed will be hidden & unmodified. */
export const ALL_ROLES = [IamRole.Reader, IamRole.Writer, IamRole.Owner];

export interface CheckRoleProps {
  role: IamRole;
  is?: IamRole;
  contains?: IamRole;
  children: ReactNode;
}

export function roleContains(role: IamRole, contains: IamRole): boolean {
  return ALL_ROLES.indexOf(role) >= ALL_ROLES.indexOf(contains);
}

export function CheckRole({
  role,
  is,
  contains,
  children,
}: CheckRoleProps): ReactElement {
  if (is && role !== is) {
    return <></>;
  }
  if (contains && !roleContains(role, contains)) {
    return <></>;
  }
  return <>{children}</>;
}
