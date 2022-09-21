import { Box, BoxProps, Tooltip, TooltipProps } from "@mui/material";
import { ReactNode, useEffect, useRef, useState } from "react";

export interface OverflowTooltip extends Omit<TooltipProps, "children"> {
  boxProps?: BoxProps;
  children?: ReactNode;
}

export const OverflowTooltip = (props: OverflowTooltip) => {
  const textElementRef = useRef<HTMLElement>();

  const [hover, setHover] = useState(false);
  useEffect(() => {
    const compareSize = () =>
      setHover(
        !!textElementRef.current &&
          textElementRef.current.scrollWidth >
            textElementRef.current.clientWidth
      );
    compareSize();
    window.addEventListener("resize", compareSize);
    return () => window.removeEventListener("resize", compareSize);
  }, []);
  return (
    <Tooltip placement="top" disableHoverListener={!hover} {...props}>
      <Box
        ref={textElementRef}
        {...props.boxProps}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...props.boxProps?.sx,
        }}
      >
        {props.children || props.title}
      </Box>
    </Tooltip>
  );
};
