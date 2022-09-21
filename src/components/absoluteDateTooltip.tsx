import { Tooltip } from "@mui/material";

export function dateToAbsoluteDateString(date?: Date) {
  return date?.toLocaleString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

interface AbsoluteDateTooltipProps {
  date?: Date;
  children: string;
}

export function AbsoluteDateTooltip({
  date,
  children,
}: AbsoluteDateTooltipProps) {
  return (
    <Tooltip title={dateToAbsoluteDateString(date) || ""}>
      <span>{children}</span>
    </Tooltip>
  );
}
