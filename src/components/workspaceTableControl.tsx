import {
  Box,
  Button,
  ButtonProps,
  Chip,
  ChipProps,
  ClickAwayListener,
  Icon,
  IconButton,
  IconButtonProps,
  InputAdornment,
  InputBase,
  ListItemText,
  MenuItem,
  MenuItemProps,
  MenuList,
  Paper,
  PaperProps,
  Popper,
  PopperProps,
  SxProps,
  TableSortLabel,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createContext,
  Dispatch,
  forwardRef,
  ReactNode,
  Ref,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { WorkspaceDescription } from "../generated/workspacemanager";
import { ALL_ROLES } from "./iamRole";
import { OverflowTooltip } from "./overflowTooltip";

type FilterFunction = (ws: WorkspaceDescription) => boolean;

interface Filter {
  label: string;
  applyFn: FilterFunction;
}

export interface WorkspaceTableState {
  order: "asc" | "desc";
  orderBy?: string;
  filterList: Filter[];
  addFilter: (chip: Filter) => void;
  removeFilter: (chip: Filter) => void;
  setFilterList: Dispatch<SetStateAction<Filter[]>>;
  setOrder: (order: "asc" | "desc") => void;
  setOrderBy: (orderBy?: string) => void;
  setComparator: Dispatch<
    SetStateAction<(a: WorkspaceDescription, b: WorkspaceDescription) => number>
  >;
  sortedWorkspaces: WorkspaceDescription[];
}

const WorkspaceTableContext = createContext<WorkspaceTableState>(
  {} as WorkspaceTableState
);

export type WorkspaceTableSortFieldProps = {
  label: string;
} & (
  | { field: WorkspaceSortField }
  | {
      comparator: (a: WorkspaceDescription, b: WorkspaceDescription) => number;
    }
);

export function WorkspaceTableSortField(props: WorkspaceTableSortFieldProps) {
  const { label } = props;
  const id = "comparator" in props ? props.label : props.field;
  const comparator =
    "comparator" in props
      ? props.comparator
      : getWorkspaceComparator(props.field);

  const { order, orderBy, setOrder, setOrderBy, setComparator } = useContext(
    WorkspaceTableContext
  );
  return (
    <TableSortLabel
      active={orderBy === id}
      direction={order}
      onClick={() => {
        setOrder(order === "asc" ? "desc" : "asc");
        setOrderBy(id);
        setComparator(() => comparator);
      }}
    >
      {label}
    </TableSortLabel>
  );
}

export interface WorkspaceTableCountProps {
  workspaces: WorkspaceDescription[];
}

export function WorkspaceTableCount({ workspaces }: WorkspaceTableCountProps) {
  const { sortedWorkspaces, filterList } = useContext(WorkspaceTableContext);

  const currentCount = sortedWorkspaces.length;
  const totalCount = workspaces.length;

  const countText =
    filterList.length > 0
      ? `${currentCount} of ${totalCount}`
      : `${totalCount}`;

  return (
    <Typography fontSize={16} mb={1}>
      Your workspaces ({countText})
    </Typography>
  );
}

interface DropdownMenuProps extends PopperProps {
  sx?: SxProps;
  paperProps?: PaperProps;
}

const DropdownMenu = ({
  children,
  paperProps,
  sx,
  ...props
}: DropdownMenuProps) => {
  return (
    <Popper {...props} open={props.open && !!children}>
      <Paper {...paperProps} sx={sx}>
        {children}
      </Paper>
    </Popper>
  );
};

interface DropdownMenuItemProps extends Omit<MenuItemProps, "children"> {
  label: string;
  value?: string;
}

const DropdownMenuItem = ({
  label,
  value,
  ...listItemProps
}: DropdownMenuItemProps) => (
  <MenuItem {...listItemProps}>
    <ListItemText>
      {label}
      {value && (
        <>
          :&nbsp;
          <b>
            <q>{value}</q>
          </b>
        </>
      )}
    </ListItemText>
  </MenuItem>
);

const SearchButton = ({ onClick }: IconButtonProps) => (
  <IconButton onClick={onClick} sx={{ borderRadius: 0, py: 2, px: 3 }}>
    <Icon sx={{ fontSize: 24 }}>search</Icon>
  </IconButton>
);

const ClearButton = ({ onClick }: ButtonProps) => (
  <Button
    variant="text"
    sx={{
      px: 3,
      py: 2.5,
      fontWeight: "bold",
      color: "inherit",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}
    onClick={onClick}
  >
    Clear all
  </Button>
);

function upperToPascal(upper: string) {
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

function getAccessLevelAutoComplete(value: string): string | undefined {
  const keywords = ALL_ROLES.map((role) => upperToPascal(role));
  // Allow leniency in autocomplete if there's trailing or leading whitespace.
  const prefixValue = value.toLowerCase().trim();

  return keywords.find((keyword) =>
    keyword.toLowerCase().startsWith(prefixValue)
  );
}

export interface IntermediateChipProps extends ChipProps {
  filterKey: string;
  value: string;
  dispatch: Dispatch<Action>;
  onSubmit: () => void;
  theme: Theme;
}

const IntermediateChip = forwardRef(
  (props: IntermediateChipProps, ref: Ref<HTMLDivElement>) => {
    const { filterKey, value, dispatch, onSubmit, theme } = props;
    return (
      <Chip
        ref={ref}
        label={
          <div>
            <span style={{ marginRight: 4, fontSize: "14px" }}>
              {filterKey + ":"}
            </span>
            <InputBase
              autoFocus
              placeholder={""}
              value={value}
              onChange={(event) =>
                dispatch({ type: "setValue", value: event.target.value })
              }
              sx={{ fontSize: "14px" }}
            />
          </div>
        }
        sx={{
          borderStyle: "dashed",
          backgroundColor: "white",
          borderColor: theme.palette.primary.dark,
          fontSize: "14px",
          my: 0.5,
          "& .MuiChip-deleteIcon": {
            color: value ? theme.palette.primary.light : "grey",
            "&:hover": {
              color: value ? theme.palette.primary.dark : "grey",
            },
          },
          "&.Mui-focusVisible": {
            backgroundColor: "white",
          },
        }}
        variant="outlined"
        onDelete={onSubmit}
        deleteIcon={
          <IconButton disabled={!value} sx={{ p: 0 }}>
            <Icon>check_circle</Icon>
          </IconButton>
        }
      />
    );
  }
);

IntermediateChip.displayName = "intermediate-chip";

interface IntermediateFilterState {
  key: string;
  getFilterFunc: (value: string) => FilterFunction;
}

interface FilterState {
  /* The value of the active input field. */
  value: string;
  /* The latent filter key within the intermediate chip. */
  intermediateFilter?: IntermediateFilterState;
  /* Anchor element for dropdown. */
  anchorEl: HTMLElement | null;
}

function reset(): FilterState {
  return {
    value: "",
    anchorEl: null,
  };
}

type Action =
  | { type: "reset" }
  | { type: "setValue"; value: string }
  | {
      type: "setIntermediateFilter";
      intermediateFilter: IntermediateFilterState;
    }
  | { type: "setAnchorEl"; anchorEl: HTMLElement | null };

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "reset":
      return reset();
    case "setValue":
      return { ...state, value: action.value };
    case "setIntermediateFilter":
      return {
        ...state,
        intermediateFilter: action.intermediateFilter,
        anchorEl: null,
      };
    case "setAnchorEl":
      return { ...state, anchorEl: action.anchorEl };
  }
}

export function WorkspaceTableSearchFilter() {
  const theme = useTheme();

  const [state, dispatch] = useReducer(reducer, undefined, reset);
  const { value, intermediateFilter, anchorEl } = state;
  const open = Boolean(anchorEl);

  const setIntermediateFilter = (filter: IntermediateFilterState) =>
    dispatch({ type: "setIntermediateFilter", intermediateFilter: filter });

  const { filterList, setFilterList, addFilter, removeFilter } = useContext(
    WorkspaceTableContext
  );

  const handleFilterAdd = (chip: Filter) => {
    addFilter(chip);
    dispatch({ type: "reset" });
  };

  const handleSubmit = () => {
    if (intermediateFilter && value) {
      handleFilterAdd({
        label: `${intermediateFilter.key}: ${value}`,
        applyFn: intermediateFilter.getFilterFunc(value),
      });
    } else {
      dispatch({ type: "reset" });
    }
  };

  const textElementRef = useRef<HTMLInputElement | null>(null);

  const handlePopperOpen = () =>
    dispatch({ type: "setAnchorEl", anchorEl: textElementRef.current });

  const noAddFilterInProgress = !open && !value && !intermediateFilter;

  useEffect(() => {
    if (textElementRef?.current && !noAddFilterInProgress) {
      textElementRef.current.focus();
    }
  }, [noAddFilterInProgress]);

  const handleDefaultPopperOpen = useCallback(() => {
    if (!open && !noAddFilterInProgress) {
      handlePopperOpen();
    }
  }, [noAddFilterInProgress, open]);

  const accessLevelValue = getAccessLevelAutoComplete(value) || "";

  return (
    <form
      noValidate
      onSubmit={(event) => {
        handleSubmit();
        event.preventDefault();
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <SearchButton onClick={handleSubmit} />
        <Box
          display="flex"
          sx={{
            flexWrap: "wrap",
            alignItems: "center",
            flexGrow: 1,
            my: 1,
          }}
        >
          {filterList.length > 0 &&
            filterList.map((chip, i) => {
              return (
                <Chip
                  key={i}
                  label={<OverflowTooltip title={chip.label} />}
                  variant="outlined"
                  sx={{
                    // Light green chip background
                    backgroundColor: "#F1F8E9",
                    borderColor: theme.palette.primary.dark,
                    my: 0.5,
                    mr: 1,
                    fontSize: "14px",
                    maxWidth: 400,
                  }}
                  onDelete={() => removeFilter(chip)}
                />
              );
            })}
          <ClickAwayListener onClickAway={handleSubmit}>
            <div>
              {intermediateFilter ? (
                <IntermediateChip
                  filterKey={intermediateFilter.key}
                  value={value}
                  dispatch={dispatch}
                  onSubmit={handleSubmit}
                  theme={theme}
                />
              ) : (
                <InputBase
                  name="search-workspace"
                  autoComplete="off"
                  disabled={noAddFilterInProgress}
                  placeholder={
                    !noAddFilterInProgress ? "Search or filter" : undefined
                  }
                  inputRef={textElementRef}
                  value={value}
                  sx={{ height: "100%", my: 0.5, flexGrow: 1 }}
                  onChange={(event) => {
                    dispatch({ type: "setValue", value: event.target.value });
                    handleDefaultPopperOpen();
                  }}
                  onClick={handleDefaultPopperOpen}
                  startAdornment={
                    <InputAdornment position="start">
                      {noAddFilterInProgress && (
                        <Chip
                          label="Add a filter"
                          variant="outlined"
                          icon={<Icon>add</Icon>}
                          sx={{
                            position: "absolute",
                            borderStyle: "dashed",
                            backgroundColor: "inherit",
                            fontSize: "14px",
                          }}
                          onClick={handlePopperOpen}
                        />
                      )}
                    </InputAdornment>
                  }
                />
              )}

              {/* Search Suggestions */}
              <DropdownMenu
                open={open}
                anchorEl={anchorEl}
                placement={"bottom-start"}
                sx={{ mt: 0.5, minWidth: 150 }}
              >
                {value ? (
                  <MenuList>
                    <DropdownMenuItem
                      label="Workspace name"
                      value={value}
                      onClick={() =>
                        handleFilterAdd({
                          label: `Workspace name: ${value}`,
                          applyFn: getWorkspaceStringFilterFunc(
                            "displayName",
                            value
                          ),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Description"
                      value={value}
                      onClick={() =>
                        handleFilterAdd({
                          label: `Description: ${value}`,
                          applyFn: getWorkspaceStringFilterFunc(
                            "description",
                            value
                          ),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Last modified by"
                      value={value}
                      onClick={() =>
                        handleFilterAdd({
                          label: `Last modified by: ${value}`,
                          applyFn: getWorkspaceStringFilterFunc(
                            "lastUpdatedBy",
                            value
                          ),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Created by"
                      value={value}
                      onClick={() =>
                        handleFilterAdd({
                          label: `Created by: ${value}`,
                          applyFn: getWorkspaceStringFilterFunc(
                            "createdBy",
                            value
                          ),
                        })
                      }
                    />
                    {accessLevelValue && (
                      <DropdownMenuItem
                        label="Access level"
                        value={accessLevelValue}
                        onClick={() =>
                          handleFilterAdd({
                            label: `Access level: ${accessLevelValue}`,
                            applyFn: (ws: WorkspaceDescription) =>
                              ws.highestRole === accessLevelValue.toUpperCase(),
                          })
                        }
                      />
                    )}
                  </MenuList>
                ) : (
                  <MenuList>
                    <DropdownMenuItem
                      label="Workspace name"
                      onClick={() =>
                        setIntermediateFilter({
                          key: "Workspace name",
                          getFilterFunc: (value) =>
                            getWorkspaceStringFilterFunc("displayName", value),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Description"
                      onClick={() =>
                        setIntermediateFilter({
                          key: "Description",
                          getFilterFunc: (value) =>
                            getWorkspaceStringFilterFunc("description", value),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Last modified by"
                      value={value}
                      onClick={() =>
                        setIntermediateFilter({
                          key: "Last modified by",
                          getFilterFunc: (value) =>
                            getWorkspaceStringFilterFunc(
                              "lastUpdatedBy",
                              value
                            ),
                        })
                      }
                    />
                    <DropdownMenuItem
                      label="Created by"
                      value={value}
                      onClick={() =>
                        setIntermediateFilter({
                          key: "Created by",
                          getFilterFunc: (value) =>
                            getWorkspaceStringFilterFunc("createdBy", value),
                        })
                      }
                    />
                  </MenuList>
                )}
              </DropdownMenu>
            </div>
          </ClickAwayListener>
          <Box sx={{ minHeight: 40 }} />
        </Box>
        {filterList.length > 0 && (
          <ClearButton
            onClick={() => {
              setFilterList([]);
              dispatch({ type: "reset" });
            }}
          />
        )}
      </Box>
    </form>
  );
}

export interface WorkspaceTableControlProps {
  workspaces: WorkspaceDescription[];
  children: (WorkspaceTableState: WorkspaceTableState) => ReactNode;
}

export function WorkspaceTableControl({
  workspaces,
  children,
}: WorkspaceTableControlProps) {
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<string | undefined>("displayName");

  const [comparator, setComparator] = useState(() =>
    getWorkspaceComparator("displayName")
  );

  const [filterList, setFilterList] = useState<Filter[]>([]);

  const state = useMemo(() => {
    const list = filterList
      .reduce(
        (prevList, currentChip) => prevList.filter(currentChip.applyFn),
        workspaces
      )
      .sort(comparator);
    if (order === "asc") {
      list.reverse();
    }

    return {
      order: order,
      orderBy: orderBy,
      filterList: filterList,
      setFilterList: setFilterList,
      addFilter: (chip: Filter) =>
        setFilterList([
          ...filterList,
          { label: chip.label, applyFn: chip.applyFn },
        ]),
      removeFilter: (chip: Filter) => {
        const removeIndex = filterList.indexOf(chip);
        if (removeIndex >= 0) {
          const newFilterList = filterList.slice();
          newFilterList.splice(removeIndex, 1);
          setFilterList(newFilterList);
        }
      },
      setOrder: setOrder,
      setOrderBy: setOrderBy,
      setComparator: setComparator,
      sortedWorkspaces: list,
    };
  }, [order, orderBy, filterList, workspaces, comparator]);

  return (
    <WorkspaceTableContext.Provider value={state}>
      {children(state)}
    </WorkspaceTableContext.Provider>
  );
}

type WorkspaceSortField = keyof Pick<
  WorkspaceDescription,
  "userFacingId" | "displayName" | "description" | "createdBy"
>;

export function getWorkspaceComparator(
  field: WorkspaceSortField
): (a: WorkspaceDescription, b: WorkspaceDescription) => number {
  return (a, b) => (a[field] || "").localeCompare(b[field] || "");
}

type WorkspaceStringFilterField = keyof Pick<
  WorkspaceDescription,
  "displayName" | "description" | "lastUpdatedBy" | "createdBy"
>;

export function getWorkspaceStringFilterFunc(
  field: WorkspaceStringFilterField,
  value: string
) {
  return (ws: WorkspaceDescription) =>
    (ws[field] || "").toLowerCase().includes(value.toLowerCase());
}

export const workspaceNameDescriptionComparator = (
  a: WorkspaceDescription,
  b: WorkspaceDescription
) =>
  getWorkspaceComparator("displayName")(a, b) ||
  getWorkspaceComparator("description")(a, b);

export const workspaceAccessLevelComparator = (
  a: WorkspaceDescription,
  b: WorkspaceDescription
) => ALL_ROLES.indexOf(a.highestRole) - ALL_ROLES.indexOf(b.highestRole);
