import {
  Avatar,
  AvatarProps,
  Box,
  Divider,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  styled,
  Typography,
} from "@mui/material";
import { Fragment, ReactElement, useState } from "react";
import { Profile, useAuth } from "./auth";
import { LegalFooter } from "./legalFooter";
import { useProfileDialog } from "./profileDialog";

const MenuItemCentered = styled(MenuItem)({
  justifyContent: "center",
  padding: "10px",
});

export function ProfileButton(): ReactElement {
  const { profile, signOut } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClose = () => setAnchorEl(null);

  const { profileDialog, show: showProfile } = useProfileDialog();

  if (!profile) {
    return <Fragment />;
  }
  return (
    <div>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <ProfileAvatar profile={profile} />
      </IconButton>
      <Popover
        id="profile-menu"
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper sx={{ width: "250px" }}>
          <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
            <ProfileAvatar profile={profile} sx={{ height: 64, width: 64 }} />
          </Box>
          <Typography align="center" sx={{ m: 2 }}>
            <b>{profile?.name}</b>
            <br />
            {profile?.email}
          </Typography>
          <Divider />
          <MenuList>
            <MenuItemCentered
              onClick={() => {
                showProfile();
                handleClose();
              }}
            >
              My profile
            </MenuItemCentered>
            <MenuItemCentered
              onClick={() => {
                signOut();
                handleClose();
              }}
            >
              Sign out
            </MenuItemCentered>
          </MenuList>
          <LegalFooter handleClose={handleClose} />
        </Paper>
      </Popover>
      {profileDialog}
    </div>
  );
}

interface ProfileAvatarProps extends AvatarProps {
  profile: Profile;
}

function ProfileAvatar({ profile, ...avatarProps }: ProfileAvatarProps) {
  return (
    <Avatar src={profile.imageUrl} alt={profile.name} {...avatarProps}>
      {profile.name.charAt(0).toUpperCase()}
    </Avatar>
  );
}
