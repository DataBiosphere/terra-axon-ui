import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Icon,
  IconButton,
  Input,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Dispatch,
  ReactElement,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useAsync } from "react-async";
import {
  IamRole,
  RoleBinding,
  WorkspaceDescription,
} from "../generated/workspacemanager";
import { useApi } from "./apiProvider";
import { useAuth } from "./auth";
import { DisabledTooltip } from "./disabledTooltip";
import { useSnackbarErrorHandler } from "./errorhandler";
import { Flyover, FlyoverActions, FlyoverContent } from "./flyover";
import { ALL_ROLES, roleContains } from "./iamRole";
import { LetterAvatar } from "./letterAvatar";
import { Loading } from "./loading";
import { LoadingBackdrop } from "./loadingBackdrop";

interface NewUserState {
  validated?: boolean;
  error?: Error;
}

interface State {
  /* The dialog is open. */
  open: boolean;
  /* The roles have been loaded. */
  loaded: boolean;
  /* Map of users to their role. */
  roleMap: ReadonlyMap<string, IamRole>;
  /* Set of users who's role has been modified. */
  modified: { [user: string]: boolean };
  /* Current user-entered value for adding a new user. */
  newUser: string;
  /* List of added new users. */
  newUsers: ReadonlyMap<string, NewUserState>;
  /* Selected role to apply to new users. */
  newUserRole: IamRole;
}

function reset(): State {
  return {
    open: false,
    loaded: false,
    roleMap: new Map<string, IamRole>(),
    modified: {},
    newUser: "",
    newUserRole: IamRole.Writer,
    newUsers: new Map<string, NewUserState>(),
  };
}

type Action =
  | { type: "open" }
  | { type: "reset" }
  | { type: "setRoleMap"; roleMap: ReadonlyMap<string, IamRole> }
  | { type: "setNewUser"; newUser: string }
  | { type: "setNewUserRole"; newUserRole: IamRole }
  | { type: "addNewUser" }
  | { type: "deleteNewUser"; user: string }
  | { type: "clearNewUsers" }
  | {
      type: "setNewUserState";
      user: string;
      validated?: boolean;
      error?: Error;
    }
  | { type: "updateRole"; user: string; role: IamRole }
  | { type: "deleteRole"; user: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "open":
      return { ...state, open: true };
    case "reset":
      return reset();
    case "setRoleMap":
      return { ...state, loaded: true, roleMap: action.roleMap };
    case "setNewUser":
      return { ...state, newUser: action.newUser };
    case "setNewUserRole":
      return { ...state, newUserRole: action.newUserRole };
    case "addNewUser":
      return state.newUser
        ? {
            ...state,
            newUsers: new Map(state.newUsers).set(state.newUser, {}),
            newUser: "",
          }
        : state;
    case "deleteNewUser":
      return {
        ...state,
        newUsers: mapWithout(state.newUsers, action.user),
      };
    case "clearNewUsers":
      return { ...state, newUsers: new Map() };
    case "setNewUserState":
      return {
        ...state,
        newUsers: new Map(state.newUsers).set(action.user, { ...action }),
      };
    case "updateRole":
      return {
        ...state,
        roleMap: new Map(state.roleMap).set(action.user, action.role),
        modified: { ...Object.assign({}, state.modified), [action.user]: true },
      };
    case "deleteRole":
      return {
        ...state,
        roleMap: mapWithout(state.roleMap, action.user),
        modified: { ...Object.assign({}, state.modified), [action.user]: true },
      };
  }
}

export interface ShareWorkspaceButtonProps {
  workspace: WorkspaceDescription;
  iamRole: IamRole;
}

export function ShareWorkspaceButton({
  workspace,
  iamRole,
}: ShareWorkspaceButtonProps): ReactElement {
  const { shareWorkspace, show } = useShareWorkspace({ workspace });
  return (
    <div>
      <DisabledTooltip title="You must be an Owner to share a workspace">
        <Button
          variant="outlined"
          disabled={!roleContains(iamRole, IamRole.Owner)}
          startIcon={<Icon>share</Icon>}
          onClick={show}
        >
          Share
        </Button>
      </DisabledTooltip>
      {shareWorkspace}
    </div>
  );
}

export interface ShareWorkspaceState {
  shareWorkspace: ReactElement;
  show: () => void;
}

export interface ShareWorkspaceProps {
  workspace: WorkspaceDescription;
}

export function useShareWorkspace({
  workspace,
}: ShareWorkspaceProps): ShareWorkspaceState {
  const [state, dispatch] = useReducer(reducer, undefined, reset);
  const { open, loaded, newUsers } = state;

  const { workspaceApi } = useApi();
  const errorHandler = useSnackbarErrorHandler();
  const { run } = useAsync<RoleBinding[]>({
    deferFn: useCallback(
      () => workspaceApi.getRoles({ workspaceId: workspace.id }),
      [workspaceApi, workspace]
    ),
    onResolve: (b) =>
      dispatch({ type: "setRoleMap", roleMap: bindingsToUserRole(b) }),
    onReject: (e) => {
      errorHandler(e);
      dispatch({ type: "reset" });
    },
  });

  const flyover = (
    <Flyover
      open={open}
      onClose={() => dispatch({ type: "reset" })}
      title="Share workspace"
      avatar={
        <Box marginRight={2}>
          {newUsers.size > 0 ? (
            <IconButton
              onClick={() => dispatch({ type: "clearNewUsers" })}
              sx={{ padding: 0 }}
            >
              <Avatar sx={{ bgcolor: "primary.light" }}>
                <Icon>arrow_back</Icon>
              </Avatar>
            </IconButton>
          ) : (
            <Avatar sx={{ bgcolor: "primary.light" }}>
              <Icon>person_add_alt</Icon>
            </Avatar>
          )}
        </Box>
      }
    >
      {loaded ? (
        newUsers.size > 0 ? (
          <AddContent workspace={workspace} dispatch={dispatch} state={state} />
        ) : (
          <EditContent
            workspace={workspace}
            dispatch={dispatch}
            state={state}
          />
        )
      ) : (
        <Loading sx={{ position: "absolute" }} />
      )}
    </Flyover>
  );
  const show = () => {
    dispatch({ type: "open" });
    run();
  };

  return { shareWorkspace: flyover, show: show };
}

interface ContentProps {
  workspace: WorkspaceDescription;
  dispatch: Dispatch<Action>;
  state: State;
}

function EditContent({ workspace, dispatch, state }: ContentProps) {
  const { roleMap, modified, newUser } = state;

  const { profile } = useAuth();
  const self = profile?.email || "";

  const { workspaceApi } = useApi();
  const errorHandler = useSnackbarErrorHandler();
  const { run, isPending } = useAsync({
    deferFn: useCallback(async () => {
      const adds: { user: string; role: IamRole }[] = [];
      const removals: { user: string; role: IamRole }[] = [];
      const selfRemovals: IamRole[] = [];
      Object.keys(modified).forEach((user) => {
        const role = roleMap.get(user);
        // There is a new role unless the user was removed.
        if (role) {
          adds.push({ user: user, role: role });
        }
        const removeRoles = ALL_ROLES.filter((r) => r !== role);
        if (user === self) {
          selfRemovals.push(...removeRoles);
        } else {
          removals.push(...removeRoles.map((r) => ({ user: user, role: r })));
        }
      });
      // Grant the new roles first.
      await Promise.all(
        adds.map(async ({ user, role }) =>
          workspaceApi.grantRole({
            workspaceId: workspace.id,
            role: role,
            grantRoleRequestBody: { memberEmail: user },
          })
        )
      );
      // Then remove all other roles (except for the current user).
      await Promise.all(
        removals.map(async ({ user, role }) =>
          workspaceApi.removeRole({
            workspaceId: workspace.id,
            role: role,
            memberEmail: user,
          })
        )
      );
      // Lastly, we can remove the current user.
      await Promise.all(
        selfRemovals.map(async (role) =>
          workspaceApi.removeRole({
            workspaceId: workspace.id,
            role: role,
            memberEmail: self,
          })
        )
      );
    }, [modified, self, roleMap, workspaceApi, workspace]),
    onResolve: () => dispatch({ type: "reset" }),
    onReject: errorHandler,
  });

  return (
    <>
      <LoadingBackdrop open={isPending} />
      <FlyoverContent>
        <AddUserField dispatch={dispatch} state={state} />
        <Divider />
        <List>
          {Array.from(roleMap).map(([user, role]) => (
            <ListItem
              disableGutters
              key={user}
              secondaryAction={
                <RoleSelect
                  role={role}
                  onChange={(role) =>
                    dispatch({ type: "updateRole", user: user, role: role })
                  }
                  onRemove={() => dispatch({ type: "deleteRole", user: user })}
                />
              }
            >
              <ListItemAvatar>
                <LetterAvatar name={user} />
              </ListItemAvatar>
              <ListItemText primary={user} />
            </ListItem>
          ))}
        </List>
      </FlyoverContent>
      <FlyoverActions>
        <Button onClick={() => dispatch({ type: "reset" })}>Cancel</Button>
        <Button onClick={run} variant="contained" disabled={!!newUser}>
          Done
        </Button>
      </FlyoverActions>
    </>
  );
}

function AddContent({ workspace, dispatch, state }: ContentProps) {
  const { newUsers, newUserRole } = state;

  const { workspaceApi } = useApi();
  const errorHandler = useSnackbarErrorHandler();
  const { run, isPending } = useAsync({
    deferFn: useCallback(
      () =>
        Promise.all(
          Array.from(newUsers.keys()).map((user) =>
            workspaceApi
              .grantRole({
                workspaceId: workspace.id,
                role: newUserRole,
                grantRoleRequestBody: { memberEmail: user },
              })
              // Each user's error is displayed, but overall promise resolves.
              .catch(errorHandler)
          )
        ),
      [newUsers, workspaceApi, workspace.id, newUserRole, errorHandler]
    ),
    onResolve: () => dispatch({ type: "reset" }),
  });

  return (
    <>
      <LoadingBackdrop open={isPending} />
      <FlyoverContent>
        <Box display="flex">
          <Box display="flex" flexWrap="wrap" flexGrow={1} gap={1}>
            {Array.from(newUsers.keys()).map((user) => (
              <NewUserChip
                key={user}
                user={user}
                dispatch={dispatch}
                state={state}
              />
            ))}
          </Box>
          <RoleSelect
            role={newUserRole}
            onChange={(role) =>
              dispatch({ type: "setNewUserRole", newUserRole: role })
            }
          />
        </Box>
        <AddUserField dispatch={dispatch} state={state} />
      </FlyoverContent>
      <FlyoverActions>
        <Button onClick={() => dispatch({ type: "clearNewUsers" })}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            const errorState = Array.from(newUsers.values()).find(
              (state) => state.error
            );
            if (errorState) {
              errorHandler(errorState.error);
            } else {
              run();
            }
          }}
          variant="contained"
        >
          Share
        </Button>
      </FlyoverActions>
    </>
  );
}

interface AddUserFieldProps {
  dispatch: Dispatch<Action>;
  state: State;
}

function AddUserField({ dispatch, state }: AddUserFieldProps) {
  const { newUser } = state;

  return (
    <Autocomplete
      freeSolo
      inputValue={newUser}
      onInputChange={(event: React.SyntheticEvent, value: string) =>
        dispatch({ type: "setNewUser", newUser: value })
      }
      value=""
      onChange={() => dispatch({ type: "addNewUser" })}
      options={newUser ? [newUser] : []}
      filterOptions={(x) => x}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            fullWidth
            margin="dense"
            placeholder="Add people and groups"
          />
        );
      }}
    />
  );
}

interface NewUserChipProps {
  user: string;
  dispatch: Dispatch<Action>;
  state: State;
}

function NewUserChip({ user, dispatch, state }: NewUserChipProps) {
  const userState = state.newUsers.get(user);
  const error = userState?.error;

  const { usersApi } = useApi();
  const { isPending } = useAsync({
    promiseFn: useCallback(
      () => usersApi.getUserIds({ email: user }),
      [user, usersApi]
    ),
    onResolve: () =>
      dispatch({ type: "setNewUserState", user: user, validated: true }),
    onReject: (e) =>
      dispatch({ type: "setNewUserState", user: user, error: e }),
  });
  return (
    <Chip
      label={user}
      icon={
        isPending ? (
          <CircularProgress size={20} />
        ) : error ? (
          <Tooltip title={error.message}>
            <Icon>error</Icon>
          </Tooltip>
        ) : (
          <Icon>person</Icon>
        )
      }
      color={error ? "error" : undefined}
      onDelete={() => dispatch({ type: "deleteNewUser", user: user })}
    />
  );
}

interface RoleSelectProps {
  role: IamRole;
  onChange: (role: IamRole) => void;
  onRemove?: () => void;
}

function RoleSelect({ role, onChange, onRemove }: RoleSelectProps) {
  const [selected, setSelected] = useState<string>("");
  useEffect(() => setSelected(role), [role]);

  return (
    <FormControl sx={{ minWidth: 90 }}>
      <Select
        disableUnderline
        value={selected}
        onChange={(e) => {
          const value = e.target.value;
          if (value == "remove") {
            onRemove?.();
          } else {
            setSelected(value);
            onChange(e.target.value as IamRole);
          }
        }}
        input={<Input />}
      >
        {ALL_ROLES.map((role) => (
          <MenuItem key={role} value={role}>
            <ListItemText
              primary={role.charAt(0) + role.slice(1).toLowerCase()}
            />
          </MenuItem>
        ))}
        {onRemove && <Divider />}
        {onRemove && <MenuItem value="remove">Remove</MenuItem>}
      </Select>
    </FormControl>
  );
}

function bindingsToUserRole(roleBindings: RoleBinding[]) {
  let userRoles = new Map<string, IamRole>();
  ALL_ROLES.forEach((role) =>
    roleBindings
      .filter((binding) => binding.role == role)
      .forEach((binding) =>
        binding.members?.forEach((id) => userRoles.set(id, role))
      )
  );
  // Sort the resulting map by user ID.
  userRoles = new Map(
    Array.from(userRoles.entries()).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    })
  );
  return userRoles;
}

function mapWithout<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
  const newMap = new Map(map);
  newMap.delete(key);
  return newMap;
}
