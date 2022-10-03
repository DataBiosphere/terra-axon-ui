import { ReactNode, useState } from "react";
import { Folder, ResourceDescription } from "../generated/workspacemanager";
import { ResourcePropertyNames } from "./api/resourceList";

export type ResourceNode = {
  id: string;
  parentId?: string;
} & (
  | {
      type: "resource";
      resource: ResourceDescription;
    }
  | {
      type: "folder";
      folder: Folder;
    }
);

export function resourcesToNodes(
  resources: ResourceDescription[]
): ResourceNode[] {
  return resources.map((resource) => ({
    id: resource.metadata.resourceId,
    type: "resource",
    resource: resource,
    parentId: resource?.metadata?.properties?.find(
      (prop) => prop.key === ResourcePropertyNames.FolderId
    )?.value,
  }));
}

export function foldersToNodes(folders: Folder[]): ResourceNode[] {
  return folders.map((folder) => ({
    id: folder.id,
    type: "folder",
    folder: folder,
    parentId: folder.parentFolderId,
  }));
}

interface ResourceNodeRowProps {
  resourceNode: ResourceNode;
  resourceNodeChildrenMap: Map<string, ResourceNode[]>;
  children: (
    resource: ResourceNode,
    isExpanded: boolean,
    setIsExpanded: (isExpanded: boolean) => void,
    indent: number
  ) => ReactNode;
  indent?: number;
}

export function ResourceNodeRow({
  resourceNode,
  resourceNodeChildrenMap,
  children,
  indent = 0,
}: ResourceNodeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {children(resourceNode, isExpanded, setIsExpanded, indent)}
      {isExpanded &&
        resourceNodeChildrenMap.get(resourceNode.id)?.map((resourceNode) => (
          <ResourceNodeRow
            key={resourceNode.id}
            resourceNode={resourceNode}
            resourceNodeChildrenMap={resourceNodeChildrenMap}
            indent={indent + 1}
          >
            {children}
          </ResourceNodeRow>
        ))}
    </>
  );
}
