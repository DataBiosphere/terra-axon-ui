import { Avatar } from "@mui/material";
import { ReactElement, useMemo } from "react";

export interface LetterAvatarProps {
  name: string;
}

export function LetterAvatar({ name }: LetterAvatarProps): ReactElement {
  const color = useMemo(() => {
    let hash = 0;
    let i;

    for (i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.substr(-2);
    }

    return color;
  }, [name]);
  return (
    <Avatar alt={name} sx={{ bgcolor: color }}>
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}
