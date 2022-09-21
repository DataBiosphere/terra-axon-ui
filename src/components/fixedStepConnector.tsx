import { StepConnector, StepConnectorProps, styled } from "@mui/material";

export const FixedStepConnector = styled(StepConnector)<StepConnectorProps>(
  () => ({ width: "24px", flexGrow: 0 })
);
