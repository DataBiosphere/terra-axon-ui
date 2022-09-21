import { useResourceList } from "../components/api/resourceList";
import { ResourceDescription } from "../generated/workspacemanager";

export interface TestResourceListProps {
  workspaceId: string;
  onUpdate: (resources: ResourceDescription[] | undefined) => void;
}

export function TestResourceList({
  workspaceId,
  onUpdate,
}: TestResourceListProps) {
  const { data } = useResourceList(workspaceId);
  onUpdate(data);
  return <div />;
}
