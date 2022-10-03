import {
  FormControl,
  Icon,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import { useMemo } from "react";
import { Field } from "react-final-form";
import * as Yup from "yup";
import { Folder, WorkspaceDescription } from "../generated/workspacemanager";
import { useFolderList } from "./api/folder";

// We can't use "" as the root ID as the component treats that as 'unselected'.
const rootId = "root";
export const isRootFolder = (id: string) => id === rootId || !id;
export const defaultFolderPath = () => rootId;

export function folderPathField() {
  return Yup.string().label("folder path").required();
}

export interface FolderPathFieldProps {
  workspace: WorkspaceDescription;
}

export function FolderPathField({ workspace }: FolderPathFieldProps) {
  const { data: folders } = useFolderList(workspace.id);
  const sorted = useMemo(
    () =>
      folders
        ?.slice()
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [folders]
  );
  const root: Folder = useMemo(
    () => ({
      id: rootId,
      displayName: `[${workspace.displayName || workspace.id}]`,
    }),
    [workspace]
  );
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    map.set(root.id, root);
    folders?.forEach((folder) => {
      map.set(folder.id, folder);
    });
    return map;
  }, [folders, root]);
  const parentMap = useMemo(() => {
    const map = new Map<string, Folder[]>();
    sorted?.forEach((folder) => {
      const parentId = folder.parentFolderId || rootId;
      map.set(parentId, [...(map.get(parentId) || []), folder]);
    });
    return map;
  }, [sorted]);

  const folderOptions = useMemo(
    () => buildOptions(root, 0, folderMap, parentMap),
    [folderMap, parentMap, root]
  );

  return (
    <Field
      name="folderPath"
      render={({ input }) => (
        <FormControl fullWidth>
          <InputLabel id="folder-path-label">Folder path</InputLabel>
          <Select
            required
            labelId="folder-path-label"
            id="folder-path-field"
            value={input.value}
            onChange={(event) => input.onChange(event.target.value)}
            input={<OutlinedInput label="Folder path" />}
            renderValue={(selected: string) => {
              const folder = folderMap.get(selected);
              let value = folder?.displayName;
              let parentId = folder?.parentFolderId;
              while (parentId) {
                const parent = folderMap.get(parentId);
                value = `${parent?.displayName} > ${value}`;
                parentId = parent?.parentFolderId;
              }
              return value;
            }}
          >
            {folderOptions.map((option) => (
              <MenuItem key={option.folder.id} value={option.folder.id}>
                <ListItemIcon sx={{ ml: option.indent * 2 }}>
                  <Icon>folder_open</Icon>
                </ListItemIcon>
                <ListItemText primary={option.folder.displayName} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}

interface FolderOption {
  folder: Folder;
  indent: number;
}
const buildOptions = (
  folder: Folder,
  indent: number,
  folderMap: Map<string, Folder>,
  parentMap: Map<string, Folder[]>
): FolderOption[] => {
  const self: FolderOption = {
    folder: folder,
    indent: indent,
  };
  const children = (parentMap.get(folder.id) || []).reduce(
    (list, folder) => [
      ...list,
      ...buildOptions(folder as Folder, indent + 1, folderMap, parentMap),
    ],
    [] as FolderOption[]
  );
  return [self, ...children];
};
