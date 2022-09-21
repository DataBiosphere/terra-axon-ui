import { Button } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import { SshKeyPair, SshKeyPairApi, SshKeyPairType } from "../generated/ecm";
import { apiFakes } from "../testing/api/fakes";
import { FakeApiProvider } from "../testing/api/provider";
import { TestAuth } from "../testing/auth";
import { TestProfile } from "../testing/profile";
import { useProfileDialog } from "./profileDialog";

const TestShowProfileButton = () => {
  const { profileDialog, show } = useProfileDialog();
  return (
    <div>
      <Button onClick={show} />
      {profileDialog}
    </div>
  );
};

describe("profile dialog", () => {
  it("renders profile", () => {
    render(
      <SnackbarProvider>
        <TestAuth>
          <TestShowProfileButton />
        </TestAuth>
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "My profile" });

    screen.getByText(TestProfile.givenName);
    screen.getByText(TestProfile.familyName);
    screen.getByText(TestProfile.email);
  });

  it("renders existing ssh key", async () => {
    const apis = apiFakes();
    const { sshKeyPairApi } = apis;
    const sshKeyPair = await sshKeyPairApi.generateSshKeyPair({
      type: SshKeyPairType.Github,
      body: "existing-key",
    });
    expect(sshKeyPair.publicKey).toBeTruthy();

    render(
      <SnackbarProvider>
        <TestAuth>
          <FakeApiProvider apis={apis}>
            <TestShowProfileButton />
          </FakeApiProvider>
        </TestAuth>
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "My profile" });

    await screen.findByText(sshKeyPair.publicKey);
    expect(screen.queryByText(sshKeyPair.privateKey)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeEnabled();
  });

  it("auto-generates ssh key", async () => {
    const apis = apiFakes();
    const { sshKeyPairApi } = apis;

    render(
      <SnackbarProvider>
        <TestAuth>
          <FakeApiProvider apis={apis}>
            <TestShowProfileButton />
          </FakeApiProvider>
        </TestAuth>
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "My profile" });
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled();

    const sshKeyPair = await waitForKeyPair(sshKeyPairApi);
    await screen.findByText(sshKeyPair.publicKey);
    expect(screen.queryByText(sshKeyPair.privateKey)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeEnabled();
  });

  it("can re-generate ssh key", async () => {
    const apis = apiFakes();
    const { sshKeyPairApi } = apis;

    render(
      <SnackbarProvider>
        <TestAuth>
          <FakeApiProvider apis={apis}>
            <TestShowProfileButton />
          </FakeApiProvider>
        </TestAuth>
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    const sshKeyPair1 = await waitForKeyPair(sshKeyPairApi);
    await screen.findByText(sshKeyPair1.publicKey);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled();
    const sshKeyPair2 = await waitForKeyPair(sshKeyPairApi, sshKeyPair1);
    await screen.findByText(sshKeyPair2.publicKey);
    expect(screen.getByRole("button", { name: "Copy" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeEnabled();
  });

  it("closes", async () => {
    render(
      <SnackbarProvider>
        <TestAuth>
          <TestShowProfileButton />
        </TestAuth>
      </SnackbarProvider>
    );
    fireEvent.click(screen.getByRole("button"));
    screen.getByRole("heading", { name: "My profile" });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("heading", { name: "My profile" })
    ).not.toBeInTheDocument();
  });
});

function waitForKeyPair(sshKeyPairApi: SshKeyPairApi, previous?: SshKeyPair) {
  return waitFor(async () => {
    const sshKeyPair = await sshKeyPairApi.getSshKeyPair({
      type: SshKeyPairType.Github,
    });
    expect(sshKeyPair.publicKey).not.toEqual(previous);
    return sshKeyPair;
  });
}
