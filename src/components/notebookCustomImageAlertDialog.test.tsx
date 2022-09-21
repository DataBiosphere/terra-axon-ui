import { Button } from "@mui/material";
import { fireEvent, render, screen } from "@testing-library/react";
import useNotebookCustomImageAlertDialog from "./notebookCustomImageAlertDialog";

const TestCreateNotebookButton = () => {
  const { alertDialog, setDialogOpen } = useNotebookCustomImageAlertDialog({
    formId: "fakeForm",
  });
  return (
    <div>
      <Button onClick={() => setDialogOpen(true)} />
      {alertDialog}
    </div>
  );
};
describe("Alert dialog for notebook custom image", () => {
  it("show dialog", async () => {
    render(<TestCreateNotebookButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Create an instance with a custom docker image"));
    expect(screen.getByRole("button", { name: /warning/i }));

    expect(screen.getByText("Continue")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeEnabled();

    fireEvent.click(
      screen.getByLabelText(
        "I am confident that my image is safe and understand the risks involved"
      )
    );
    expect(screen.getByText("Continue")).toBeEnabled();

    fireEvent.click(
      screen.getByLabelText(
        "I am confident that my image is safe and understand the risks involved"
      )
    );
    expect(screen.getByText("Continue")).toBeDisabled();
  });
});
