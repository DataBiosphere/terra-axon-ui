import { Link } from "@mui/material";
export interface GitRepoLinkProps {
  url?: string;
}

export function GitRepoLink({ url }: GitRepoLinkProps) {
  if (!url) return null;

  const regArray =
    /^(?:(?:https:\/\/github.com\/)|(?:(?:ssh:\/\/|)git@github.com.))([\S]*)/.exec(
      url
    );
  if (regArray) {
    return (
      <Link
        href={`https://github.com/${regArray[1]}`}
        target="_blank"
        variant="inherit"
      >
        {url}
      </Link>
    );
  }
  return <>{url}</>;
}
