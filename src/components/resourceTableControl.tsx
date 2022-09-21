import { TablePagination, TableSortLabel } from "@mui/material";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ResourceDescription,
  ResourceMetadata,
} from "../generated/workspacemanager";

export interface ResourceTableState {
  order: "asc" | "desc";
  orderBy?: string;
  page: number;
  rowsPerPage: number;
  resourcesCount: number;
  setOrder: (order: "asc" | "desc") => void;
  setOrderBy: (orderBy?: string) => void;
  setPage: Dispatch<SetStateAction<number>>;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  setComparator: Dispatch<
    SetStateAction<(a: ResourceDescription, b: ResourceDescription) => number>
  >;
  sortedResources: ResourceDescription[];
}

const ResourceTableContext = createContext<ResourceTableState>(
  {} as ResourceTableState
);

export type ResourceTableSortFieldProps = {
  label?: string;
} & (
  | { field: ResourceSortField }
  | {
      id: string;
      comparator: (a: ResourceDescription, b: ResourceDescription) => number;
    }
);

export function ResourceTableSortField(props: ResourceTableSortFieldProps) {
  const { label } = props;
  const id = "id" in props ? props.id : props.field;
  const comparator =
    "comparator" in props
      ? props.comparator
      : getResourceComparator(props.field);

  const { order, orderBy, setOrder, setOrderBy, setComparator } =
    useContext(ResourceTableContext);
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

export function ResourceTablePagination() {
  const { page, rowsPerPage, setPage, setRowsPerPage, resourcesCount } =
    useContext(ResourceTableContext);
  if (resourcesCount <= 5) {
    return null;
  }
  return (
    <TablePagination
      rowsPerPageOptions={[5, 10, 20, 50, { label: "All", value: -1 }]}
      count={resourcesCount}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(event) => {
        setRowsPerPage(parseInt(event.target.value));
        setPage(0);
      }}
      showFirstButton
      showLastButton
    />
  );
}

export interface ResourceTableControlProps {
  resources: ResourceDescription[];
  paginated?: boolean;
  children: (resourceTableState: ResourceTableState) => ReactNode;
}

export function ResourceTableControl({
  resources,
  paginated,
  children,
}: ResourceTableControlProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(paginated ? 5 : -1);

  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<string | undefined>("name");

  const [comparator, setComparator] = useState(() =>
    getResourceComparator("name")
  );

  const state = useMemo(() => {
    const orderedComparator = (
      a: ResourceDescription,
      b: ResourceDescription
    ) => (order === "desc" ? 1 : -1) * comparator(a, b);
    const sorted = resources.sort(orderedComparator).slice(
      ...(rowsPerPage > 0 //-1 means "All" is selected.
        ? [page * rowsPerPage, (page + 1) * rowsPerPage]
        : [undefined, undefined])
    );
    return {
      order: order,
      orderBy: orderBy,
      page: page,
      rowsPerPage: rowsPerPage,
      resourcesCount: resources.length,
      setOrder: setOrder,
      setOrderBy: setOrderBy,
      setPage: setPage,
      setRowsPerPage: setRowsPerPage,
      setComparator: setComparator,
      sortedResources: sorted,
    };
  }, [order, orderBy, page, rowsPerPage, resources, comparator]);

  return (
    <ResourceTableContext.Provider value={state}>
      {children(state)}
    </ResourceTableContext.Provider>
  );
}

type ResourceSortField =
  | keyof Pick<ResourceMetadata, "name" | "description" | "resourceType">;
export function getResourceComparator(
  field: ResourceSortField
): (a: ResourceDescription, b: ResourceDescription) => number {
  return (a, b) =>
    (a.metadata[field] || "").localeCompare(b.metadata[field] || "");
}
