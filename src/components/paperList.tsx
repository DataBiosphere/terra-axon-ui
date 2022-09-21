import { Box, Divider, Icon, IconButton } from "@mui/material";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import nop from "./nop";
import { NoWrapTypography } from "./noWrapTypography";
import { OverflowTooltip } from "./overflowTooltip";

interface ItemContextType {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}
const ItemContext = createContext<ItemContextType>({
  expanded: false,
  setExpanded: nop,
});

export interface PaperListProps {
  children: ReactNode;
}

export function PaperList({ children }: PaperListProps) {
  return (
    <div>
      <Divider sx={{ pt: 1, mx: 2 }} />
      {children}
    </div>
  );
}

export interface PaperListItemProps {
  children: ReactNode;
}

export function PaperListItem({ children }: PaperListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const state = useMemo(
    () => ({ expanded: expanded, setExpanded: setExpanded }),
    [expanded]
  );
  return (
    <>
      <ItemContext.Provider value={state}>{children}</ItemContext.Provider>
      <Divider sx={{ mx: 2 }} />
    </>
  );
}

export interface PaperListItemTitleProps {
  title?: string;
  actions?: ReactNode;
}

export function PaperListItemTitle({
  title,
  actions,
}: PaperListItemTitleProps) {
  const { expanded, setExpanded } = useContext(ItemContext);
  return (
    <Box display="flex" alignItems="flex-start">
      <NoWrapTypography
        variant="body2"
        flexGrow={1}
        sx={{
          pt: 1,
          pl: 3,
          fontWeight: "bold",
        }}
      >
        <OverflowTooltip title={title || ""}></OverflowTooltip>
      </NoWrapTypography>
      {actions}
      <IconButton
        size="small"
        sx={{ pr: 1 }}
        onClick={() => setExpanded(!expanded)}
      >
        <Icon>{expanded ? "expand_less" : "expand_more"}</Icon>
      </IconButton>
    </Box>
  );
}

export interface PaperListItemContentsProps {
  children: ReactNode;
}

export function PaperListItemContents({
  children,
}: PaperListItemContentsProps) {
  return <Box sx={{ px: 3, pb: 1 }}>{children}</Box>;
}

export interface PaperListItemMoreProps {
  children: ReactNode;
}

export function PaperListItemMore(props: PaperListItemMoreProps) {
  const { expanded } = useContext(ItemContext);
  return expanded ? <PaperListItemContents {...props} /> : <></>;
}
