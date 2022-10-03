import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { usePopupState } from "material-ui-popup-state/hooks";
import { WorkspaceDescription } from "../generated/workspacemanager";
import { pluralize } from "../lib/pluralize";
import { AbsoluteDateTooltip } from "./absoluteDateTooltip";
import { Flyover, FlyoverContent, FlyoverProps } from "./flyover";
import { lastModifiedToString } from "./lastModified";
import { NoWrapCell } from "./noWrapCell";
import { NoWrapTypography } from "./noWrapTypography";
import { OverflowTooltip } from "./overflowTooltip";
import {
  getWorkspaceDateComparator,
  workspaceNameDescriptionComparator,
  WorkspaceTableControl,
  WorkspaceTableSortField,
} from "./workspaceTableControl";

interface WorkspaceDataCollectionsTableProps
  extends Omit<FlyoverProps, "children"> {
  dataCollections: WorkspaceDescription[];
}

export function WorkspaceDataCollectionsTable({
  dataCollections,
  ...flyoverProps
}: WorkspaceDataCollectionsTableProps) {
  const flyoverSubtitle = pluralize("collection", dataCollections.length, true);
  return (
    <Flyover
      title="Data Collections In Workspace"
      size="large"
      subtitle={flyoverSubtitle}
      {...flyoverProps}
    >
      <FlyoverContent>
        <WorkspaceTableControl workspaces={dataCollections}>
          {({ sortedWorkspaces: sortedDataCollections }) => (
            <TableContainer
              component={Paper}
              variant="outlined"
              square
              sx={{ my: 3 }}
            >
              <Table width="100%" sx={{ tableLayout: "fixed" }}>
                <TableHead sx={{ bgcolor: "table.head" }}>
                  <TableRow>
                    <TableCell width="55%">
                      <WorkspaceTableSortField
                        label="Name"
                        comparator={workspaceNameDescriptionComparator}
                      />
                    </TableCell>
                    <TableCell width="22.5%">
                      <WorkspaceTableSortField
                        label="Last Updated"
                        comparator={getWorkspaceDateComparator(
                          "lastUpdatedDate"
                        )}
                      />
                    </TableCell>
                    <TableCell width="22.5%">Data Policies</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDataCollections.map((dataCollection) => (
                    <TableRow key={dataCollection.id}>
                      <NoWrapCell>
                        <Box>
                          <OverflowTooltip
                            title={dataCollection.displayName || ""}
                          >
                            <Typography sx={{ color: "table.primary" }}>
                              {dataCollection.displayName}
                            </Typography>
                          </OverflowTooltip>
                        </Box>
                        <NoWrapTypography
                          sx={{ fontSize: 12, color: "table.secondary" }}
                        >
                          {dataCollection.description || "--"}
                        </NoWrapTypography>
                      </NoWrapCell>
                      <NoWrapCell sx={{ color: "table.secondary" }}>
                        <AbsoluteDateTooltip
                          date={dataCollection.lastUpdatedDate}
                        >
                          {lastModifiedToString(
                            dataCollection.lastUpdatedDate
                          ) || "--"}
                        </AbsoluteDateTooltip>
                      </NoWrapCell>
                      <NoWrapCell
                        sx={{
                          color: "table.secondary",
                        }}
                      >
                        {/*TODO: Add hover info when available */}
                        <Typography
                          variant="body2"
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          {pluralize(
                            "policy",
                            dataCollection.policies?.length || 0,
                            true
                          )}
                        </Typography>
                      </NoWrapCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </WorkspaceTableControl>
      </FlyoverContent>
    </Flyover>
  );
}

export function useWorkspaceDataColectionsTablePopupState() {
  return usePopupState({
    variant: "dialog",
    popupId: `data-collections-table`,
  });
}
