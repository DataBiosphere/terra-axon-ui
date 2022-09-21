import { IamRole } from "../../generated/workspacemanager";

/** A list of roles we want to present, in ascending order of precidence.
 * Any roles not listed will be hidden & unmodified. */
export const ALL_ROLES = [IamRole.Reader, IamRole.Writer, IamRole.Owner];
