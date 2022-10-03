import { Box, FormControlLabel, Paper, Radio, Typography } from "@mui/material";
import { Field } from "react-final-form";

export interface RadioButtonProps {
  name: string;
  primary: string;
  secondary?: string;
  value: string;
}

export const RadioButton = ({
  name,
  primary,
  secondary,
  value,
}: RadioButtonProps) => {
  return (
    <Field
      name={name}
      type="radio"
      value={value}
      render={({ input }) => (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            backgroundColor: input.checked ? "table.selected" : "default",
          }}
        >
          <FormControlLabel
            disableTypography
            checked={input.checked}
            value={input.value}
            onChange={input.onChange}
            label={
              <Box sx={{ ml: 2 }}>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: "medium",
                    lineHeight: "24px",
                    color: "black",
                    opacity: "0.87",
                  }}
                >
                  {primary}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    lineHeight: "20px",
                    color: "black",
                    opacity: "0.54",
                  }}
                >
                  {secondary}
                </Typography>
              </Box>
            }
            control={<Radio />}
          />
        </Paper>
      )}
    />
  );
};
