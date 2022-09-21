import { Tooltip } from "@mui/material";
import { ReactElement } from "react";

export interface DisabledTooltipProps {
  title: string;
  children: ReactElement;
}

export function DisabledTooltip({ title, children }: DisabledTooltipProps) {
  if (children?.props?.disabled) {
    return (
      <Tooltip title={title}>
        {/* Wrap in a span so the tooltip is active with a disabled component. */}
        <span>{children}</span>
      </Tooltip>
    );
  }
  return children;
}
