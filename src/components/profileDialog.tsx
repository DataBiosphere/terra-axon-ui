import {
  Box,
  Button,
  ButtonProps,
  Divider,
  FormLabel,
  Icon,
  Stack,
  Typography,
} from "@mui/material";
import { StatusCodes } from "http-status-codes";
import { ReactElement, useCallback, useState } from "react";
import { errorIsCode } from "../lib/api/error";
import { useGenerateSshKeyPair, useSshKeyPair } from "./api/sshKeyPair";
import { Profile, useAuth } from "./auth";
import { CopyToClipboardButton } from "./copyToClipboardButton";
import { ErrorList } from "./errorhandler";
import { FlyoverActions, FlyoverContent, useFlyover } from "./flyover";
import { InlineLoading } from "./loading";

export interface ProfileDialogState {
  profileDialog: ReactElement;
  show: () => void;
}

export function useProfileDialog(): ProfileDialogState {
  const { profile } = useAuth();
  const { flyover, setOpen } = useFlyover({
    title: "My profile",
    children: profile ? (
      <ProfileContents profile={profile} close={() => setOpen(false)} />
    ) : (
      <div />
    ),
  });

  const show = useCallback(() => setOpen(true), [setOpen]);
  return { profileDialog: flyover, show: show };
}

interface ProfileContentsProps {
  profile: Profile;
  close: () => void;
}

function ProfileContents({ profile, close }: ProfileContentsProps) {
  return (
    <div>
      <FlyoverContent>
        <PersonalInfo profile={profile} />
        <Divider sx={{ my: 2 }} />
        <SshKeys />
      </FlyoverContent>
      <FlyoverActions>
        <Button variant="contained" onClick={close}>
          Close
        </Button>
      </FlyoverActions>
    </div>
  );
}

function PersonalInfo({ profile }: { profile: Profile }) {
  return (
    <div>
      <ProfileSection label="My personal information" />
      <ProfileField label="First name" value={profile.givenName} />
      <ProfileField label="Last name" value={profile.familyName} />
      <ProfileField label="Email" value={profile.email} />
    </div>
  );
}

function SshKeys() {
  const {
    run: generate,
    error: generateError,
    isPending: isGenerating,
  } = useGenerateSshKeyPair();
  const [generatedOnce, setGeneratedOnce] = useState(false);

  const {
    data: sshKeyPair,
    error: loadError,
    isValidating,
  } = useSshKeyPair({
    onError: (error) => {
      if (!generatedOnce && errorIsCode(error, StatusCodes.NOT_FOUND)) {
        setGeneratedOnce(true);
        generate();
      }
    },
  });
  const isPending = (isValidating && !sshKeyPair && !loadError) || isGenerating;

  return (
    <div>
      <ProfileSection label="My SSH keys" />
      <FormLabel>
        SSH keys are used by Terra to access external data and source code.
      </FormLabel>
      <Stack sx={{ backgroundColor: "#F8F9FA", p: 2, my: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography fontWeight="medium" sx={{ flexGrow: 1, color: "black" }}>
            Public SSH Key
          </Typography>
          <Box display="flex" gap={1}>
            <CopyToClipboardButton
              variant="text"
              value={sshKeyPair?.publicKey || ""}
              buttonProps={{ disabled: isPending || !sshKeyPair }}
            />
            <RegenerateButton
              onClick={generate}
              disabled={isPending || !!loadError}
            />
          </Box>
        </Box>
        {isPending ? (
          <InlineLoading />
        ) : (
          <Box component="code" sx={{ wordBreak: "break-all" }}>
            {sshKeyPair?.publicKey}
          </Box>
        )}
      </Stack>
      <ErrorList
        errors={[
          errorIsCode(loadError, StatusCodes.NOT_FOUND) ? undefined : loadError,
          generateError,
        ]}
      />
    </div>
  );
}

function RegenerateButton(props: ButtonProps) {
  return (
    <Button variant="outlined" startIcon={<Icon>refresh</Icon>} {...props}>
      Regenerate
    </Button>
  );
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <Box my={2}>
      <FormLabel>{label}</FormLabel>
      <Typography sx={{ color: "black", m: 1 }}>{value}</Typography>
    </Box>
  );
}

function ProfileSection({ label }: { label: string }) {
  return (
    <Typography fontWeight="medium" sx={{ color: "black" }}>
      {label}
    </Typography>
  );
}
